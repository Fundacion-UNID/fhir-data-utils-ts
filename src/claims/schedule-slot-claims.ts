// Copyright 2026 Conéctate Soluciones y Aplicaciones SL under the Apache License, Version 2.0.

import type { ClaimSpec } from './claim-types.js'
import { defineFlatSearchParameter } from '../search-parameters.js'

/** Canonical flat claims for the official FHIR R5 Schedule search surface. */
export const ScheduleClaim = Object.freeze({
  Active: 'Schedule.active',
  Actor: 'Schedule.actor',
  Date: 'Schedule.date',
  Identifier: 'Schedule.identifier',
  Name: 'Schedule.name',
  ServiceCategory: 'Schedule.service-category',
  ServiceType: 'Schedule.service-type',
  ServiceTypeReference: 'Schedule.service-type-reference',
  Specialty: 'Schedule.specialty',
  PlanningHorizonStart: 'Schedule.planning-horizon-start',
  PlanningHorizonEnd: 'Schedule.planning-horizon-end',
  Comment: 'Schedule.comment',
} as const)

/** Canonical flat claims for the official FHIR R5 Slot search surface. */
export const SlotClaim = Object.freeze({
  AppointmentType: 'Slot.appointment-type',
  Identifier: 'Slot.identifier',
  Schedule: 'Slot.schedule',
  ServiceCategory: 'Slot.service-category',
  ServiceType: 'Slot.service-type',
  ServiceTypeReference: 'Slot.service-type-reference',
  Specialty: 'Slot.specialty',
  Start: 'Slot.start',
  Status: 'Slot.status',
  End: 'Slot.end',
  Overbooked: 'Slot.overbooked',
  Comment: 'Slot.comment',
} as const)

export const ScheduleR5SearchParameterCatalog = Object.freeze([
  defineFlatSearchParameter({ claim: ScheduleClaim.Active, resourceType: 'Schedule', elementPath: 'Schedule.active', type: 'token' }),
  defineFlatSearchParameter({ claim: ScheduleClaim.Actor, resourceType: 'Schedule', elementPath: 'Schedule.actor', type: 'reference' }),
  defineFlatSearchParameter({ claim: ScheduleClaim.Date, resourceType: 'Schedule', elementPath: 'Schedule.planningHorizon', type: 'date' }),
  defineFlatSearchParameter({ claim: ScheduleClaim.Identifier, resourceType: 'Schedule', elementPath: 'Schedule.identifier', type: 'token' }),
  defineFlatSearchParameter({ claim: ScheduleClaim.Name, resourceType: 'Schedule', elementPath: 'Schedule.name', type: 'string' }),
  defineFlatSearchParameter({ claim: ScheduleClaim.ServiceCategory, resourceType: 'Schedule', elementPath: 'Schedule.serviceCategory', type: 'token' }),
  defineFlatSearchParameter({ claim: ScheduleClaim.ServiceType, resourceType: 'Schedule', elementPath: 'Schedule.serviceType.concept', type: 'token' }),
  defineFlatSearchParameter({ claim: ScheduleClaim.ServiceTypeReference, resourceType: 'Schedule', elementPath: 'Schedule.serviceType.reference', type: 'reference' }),
  defineFlatSearchParameter({ claim: ScheduleClaim.Specialty, resourceType: 'Schedule', elementPath: 'Schedule.specialty', type: 'token' }),
])

export const SlotR5SearchParameterCatalog = Object.freeze([
  defineFlatSearchParameter({ claim: SlotClaim.AppointmentType, resourceType: 'Slot', elementPath: 'Slot.appointmentType', type: 'token' }),
  defineFlatSearchParameter({ claim: SlotClaim.Identifier, resourceType: 'Slot', elementPath: 'Slot.identifier', type: 'token' }),
  defineFlatSearchParameter({ claim: SlotClaim.Schedule, resourceType: 'Slot', elementPath: 'Slot.schedule', type: 'reference' }),
  defineFlatSearchParameter({ claim: SlotClaim.ServiceCategory, resourceType: 'Slot', elementPath: 'Slot.serviceCategory', type: 'token' }),
  defineFlatSearchParameter({ claim: SlotClaim.ServiceType, resourceType: 'Slot', elementPath: 'Slot.serviceType.concept', type: 'token' }),
  defineFlatSearchParameter({ claim: SlotClaim.ServiceTypeReference, resourceType: 'Slot', elementPath: 'Slot.serviceType.reference', type: 'reference' }),
  defineFlatSearchParameter({ claim: SlotClaim.Specialty, resourceType: 'Slot', elementPath: 'Slot.specialty', type: 'token' }),
  defineFlatSearchParameter({ claim: SlotClaim.Start, resourceType: 'Slot', elementPath: 'Slot.start', type: 'date' }),
  defineFlatSearchParameter({ claim: SlotClaim.Status, resourceType: 'Slot', elementPath: 'Slot.status', type: 'token' }),
])

export const ScheduleClaimSpecs: readonly ClaimSpec[] = Object.freeze([
  { key: ScheduleClaim.Identifier, meaning: 'Logical schedule identifier.', example: 'urn:uuid:blood-donation-weekday' },
  { key: ScheduleClaim.Active, meaning: 'Whether this schedule is in active use.', example: 'true' },
  { key: ScheduleClaim.Actor, meaning: 'Repeatable independently schedulable actors as CSV references.', example: 'HealthcareService/blood-donation,Location/blood-donation-room' },
  { key: ScheduleClaim.ServiceType, meaning: 'Repeatable service-type concept tokens as CSV.', example: 'http://terminology.hl7.org/CodeSystem/service-type|117' },
  { key: ScheduleClaim.ServiceTypeReference, meaning: 'Repeatable HealthcareService references corresponding to service-type concepts.', example: 'HealthcareService/blood-donation' },
  { key: ScheduleClaim.PlanningHorizonStart, meaning: 'Start of the period covered by this schedule.', example: '2026-10-01' },
  { key: ScheduleClaim.PlanningHorizonEnd, meaning: 'End of the period covered by this schedule.', example: '2026-10-31' },
])

export const SlotClaimSpecs: readonly ClaimSpec[] = Object.freeze([
  { key: SlotClaim.Identifier, meaning: 'Logical slot identifier.', example: 'urn:uuid:blood-20261001-0900' },
  { key: SlotClaim.Schedule, meaning: 'The Schedule that owns this independent slot.', example: 'Schedule/blood-donation-weekday' },
  { key: SlotClaim.Status, meaning: 'FHIR Slot status.', example: 'free' },
  { key: SlotClaim.Start, meaning: 'Start instant.', example: '2026-10-01T09:00:00Z' },
  { key: SlotClaim.End, meaning: 'End instant; duration is derived from start and end.', example: '2026-10-01T09:15:00Z' },
])
