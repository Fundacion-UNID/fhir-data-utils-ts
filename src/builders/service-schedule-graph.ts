import { ScheduleClaim, SlotClaim } from '../claims/schedule-slot-claims.js'
import { LocationClaim } from '../claims/location-claims.js'

export type ScheduleSlotGraphResource = Readonly<{
  resourceType: 'Schedule' | 'Slot'
  id: string
  meta: Readonly<{ claims: Readonly<Record<string, string | readonly string[]>> }>
}>

export type ServiceScheduleFlatGraphInput = Readonly<{
  scheduleId: string
  scheduleIdentifier: string
  name: string
  healthcareServiceReference: string
  resourceActorReferences: readonly string[]
  serviceType: string
  planningHorizon: Readonly<{ start: string; end: string }>
  slots: readonly Readonly<{
    slotId: string
    slotIdentifier: string
    status: 'busy' | 'free' | 'busy-unavailable' | 'busy-tentative' | 'entered-in-error'
    start: string
    end: string
    overbooked?: boolean
    comment?: string
  }>[]
}>

export type SchedulableLocationFlatResource = Readonly<{
  resourceType: 'Location'
  id: string
  meta: Readonly<{ claims: Readonly<Record<string, string>> }>
}>

const required = (value: string, error: string): string => {
  const normalized = String(value || '').trim()
  if (!normalized) throw new TypeError(error)
  return normalized
}
const id = (value: string): string => {
  const normalized = required(value, 'schedule_slot_id_required')
  if (!/^[A-Za-z0-9.-]{1,64}$/.test(normalized)) throw new TypeError('schedule_slot_id_invalid')
  return normalized
}
const reference = (value: string, resourceType: string, error: string): string => {
  const normalized = required(value, error)
  if (!normalized.startsWith(`${resourceType}/`) || normalized.length === resourceType.length + 1) throw new TypeError(error)
  return normalized
}
const scheduleActorReference = (value: string): string => {
  const normalized = required(value, 'schedule_actor_reference_invalid')
  if (!/^(?:Patient|Practitioner|PractitionerRole|CareTeam|RelatedPerson|Device|Location)\/[A-Za-z0-9.-]+$/.test(normalized)) {
    throw new TypeError('schedule_actor_reference_invalid')
  }
  return normalized
}
const token = (value: string): string => {
  const normalized = required(value, 'schedule_service_type_invalid')
  const separator = normalized.lastIndexOf('|')
  if (separator < 1 || separator === normalized.length - 1) throw new TypeError('schedule_service_type_invalid')
  return normalized
}
const instant = (value: string, error: string): string => {
  const normalized = required(value, error)
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(normalized)) throw new TypeError(error)
  return normalized
}
const periodBoundary = (value: string, end: boolean): number => {
  const normalized = required(value, 'schedule_planning_horizon_invalid')
  const timestamp = Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(normalized)
    ? `${normalized}T${end ? '23:59:59.999' : '00:00:00.000'}Z`
    : normalized)
  if (!Number.isFinite(timestamp)) throw new TypeError('schedule_planning_horizon_invalid')
  return timestamp
}

/** Builds one claims-first Schedule and its independent Slot resources. */
export function buildServiceScheduleFlatGraph(
  input: ServiceScheduleFlatGraphInput,
): readonly ScheduleSlotGraphResource[] {
  const scheduleId = id(input.scheduleId)
  const healthcareServiceReference = reference(
    input.healthcareServiceReference,
    'HealthcareService',
    'schedule_healthcare_service_reference_invalid',
  )
  const resourceActorReferences = [...new Set(input.resourceActorReferences.map(scheduleActorReference))]
  if (!resourceActorReferences.length) throw new TypeError('schedule_resource_actor_required')
  const serviceType = token(input.serviceType)
  const horizonStart = periodBoundary(input.planningHorizon.start, false)
  const horizonEnd = periodBoundary(input.planningHorizon.end, true)
  if (horizonEnd < horizonStart) throw new TypeError('schedule_planning_horizon_invalid')
  const scheduleReference = `Schedule/${scheduleId}`
  const seenSlotIds = new Set<string>()
  const slots = input.slots.map(slot => {
    const slotId = id(slot.slotId)
    if (seenSlotIds.has(slotId)) throw new TypeError('schedule_slot_id_duplicate')
    seenSlotIds.add(slotId)
    const start = instant(slot.start, 'slot_start_invalid')
    const end = instant(slot.end, 'slot_end_invalid')
    const startTime = Date.parse(start)
    const endTime = Date.parse(end)
    if (endTime <= startTime) throw new TypeError('slot_interval_invalid')
    if (startTime < horizonStart || endTime > horizonEnd) throw new TypeError('slot_outside_planning_horizon')
    return Object.freeze({
      resourceType: 'Slot' as const,
      id: slotId,
      meta: Object.freeze({ claims: Object.freeze({
        [SlotClaim.Identifier]: required(slot.slotIdentifier, 'slot_identifier_required'),
        [SlotClaim.Schedule]: scheduleReference,
        [SlotClaim.ServiceType]: serviceType,
        [SlotClaim.ServiceTypeReference]: healthcareServiceReference,
        [SlotClaim.Status]: slot.status,
        [SlotClaim.Start]: start,
        [SlotClaim.End]: end,
        ...(slot.overbooked === undefined ? {} : { [SlotClaim.Overbooked]: String(slot.overbooked) }),
        ...(slot.comment?.trim() ? { [SlotClaim.Comment]: slot.comment.trim() } : {}),
      }) }),
    })
  })
  return Object.freeze([
    Object.freeze({
      resourceType: 'Schedule' as const,
      id: scheduleId,
      meta: Object.freeze({ claims: Object.freeze({
        [ScheduleClaim.Identifier]: required(input.scheduleIdentifier, 'schedule_identifier_required'),
        [ScheduleClaim.Active]: 'true',
        [ScheduleClaim.Name]: required(input.name, 'schedule_name_required'),
        [ScheduleClaim.ServiceType]: serviceType,
        [ScheduleClaim.ServiceTypeReference]: healthcareServiceReference,
        [ScheduleClaim.Actor]: Object.freeze([healthcareServiceReference, ...resourceActorReferences]),
        [ScheduleClaim.PlanningHorizonStart]: input.planningHorizon.start,
        [ScheduleClaim.PlanningHorizonEnd]: input.planningHorizon.end,
      }) }),
    }),
    ...slots,
  ])
}

/**
 * Builds one reservable child place such as a room, booth, chair or bed.
 *
 * R4 projects `Location.physicalType`; R5 projects the same governed coding as
 * `Location.form`. Equipment such as an apheresis machine remains a Device and
 * is added independently to the Schedule actor list.
 */
export function buildSchedulableLocationFlatResource(input: Readonly<{
  locationId: string
  locationIdentifier: string
  name: string
  status?: 'active' | 'suspended' | 'inactive'
  form: string
  managingOrganizationReference: string
  parentLocationReference: string
  position?: Readonly<{ longitude: number; latitude: number; altitude?: number }>
}>): SchedulableLocationFlatResource {
  const locationId = id(input.locationId)
  const form = token(input.form)
  const managingOrganizationReference = reference(
    input.managingOrganizationReference,
    'Organization',
    'schedulable_location_managing_organization_invalid',
  )
  const parentLocationReference = reference(
    input.parentLocationReference,
    'Location',
    'schedulable_location_parent_invalid',
  )
  if (parentLocationReference === `Location/${locationId}`) throw new TypeError('schedulable_location_parent_invalid')
  const position = input.position
  if (position && (!Number.isFinite(position.longitude) || position.longitude < -180 || position.longitude > 180
    || !Number.isFinite(position.latitude) || position.latitude < -90 || position.latitude > 90
    || (position.altitude !== undefined && !Number.isFinite(position.altitude)))) {
    throw new TypeError('schedulable_location_position_invalid')
  }
  return Object.freeze({
    resourceType: 'Location',
    id: locationId,
    meta: Object.freeze({ claims: Object.freeze({
      [LocationClaim.Identifier]: required(input.locationIdentifier, 'schedulable_location_identifier_required'),
      [LocationClaim.Status]: input.status ?? 'active',
      [LocationClaim.Mode]: 'instance',
      [LocationClaim.Name]: required(input.name, 'schedulable_location_name_required'),
      [LocationClaim.PhysicalType]: form,
      [LocationClaim.ManagingOrganization]: managingOrganizationReference,
      [LocationClaim.PartOf]: parentLocationReference,
      ...(position ? {
        [LocationClaim.PositionLongitude]: String(position.longitude),
        [LocationClaim.PositionLatitude]: String(position.latitude),
        ...(position.altitude === undefined ? {} : { [LocationClaim.PositionAltitude]: String(position.altitude) }),
      } : {}),
    }) }),
  })
}
