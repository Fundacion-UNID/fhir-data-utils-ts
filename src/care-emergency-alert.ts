import {
  CommunicationRequestClaim,
  EncounterClaim,
  EncounterHistoryClaim,
  EncounterStatusR5,
  ServiceRequestClaim,
  TaskClaim,
} from './claims/index.js'
import { buildFlatClaimResourceEntry, type FlatClaimResourceEntry } from './flat-claim-resource-graph.js'

export type ClinicalCoding = Readonly<{ system: string; code: string; display?: string; text?: string }>

export type EncounterJourneyNode = Readonly<{
  entryId: string
  identifier: string
  status: 'planned' | 'arrived' | 'triaged' | 'in-progress' | 'onleave' | 'finished' | 'cancelled'
  periodStart: string
  periodEnd?: string
  locationReference: string
  type?: ClinicalCoding
}>

/** Builds one FHIR R5 EncounterHistory milestone from canonical flat claims. */
export function buildEncounterHistoryR5FlatEntry(input: Readonly<{
  entryId: string
  identifier: string
  encounterReference: string
  status: EncounterStatusR5
  class: ClinicalCoding
  serviceReference?: string
  subjectReference?: string
  subjectStatus?: ClinicalCoding
  actualPeriodStart?: string
  actualPeriodEnd?: string
  plannedStartDate?: string
  plannedEndDate?: string
  locationReference?: string
  locationForm?: ClinicalCoding
}>): FlatClaimResourceEntry {
  const claims: Record<string, string> = {
    [EncounterHistoryClaim.Identifier]: required(input.identifier, 'encounter_history_identifier_required'),
    [EncounterHistoryClaim.Encounter]: reference(input.encounterReference, 'encounter_history_encounter_invalid'),
    [EncounterHistoryClaim.Status]: input.status,
    [EncounterHistoryClaim.Class]: coding(input.class, 'encounter_history_class_invalid'),
  }
  if (input.serviceReference) claims[EncounterHistoryClaim.ServiceType] = reference(input.serviceReference, 'encounter_history_service_invalid')
  if (input.subjectReference) claims[EncounterHistoryClaim.Subject] = reference(input.subjectReference, 'encounter_history_subject_invalid')
  if (input.subjectStatus) claims[EncounterHistoryClaim.SubjectStatus] = coding(input.subjectStatus, 'encounter_history_subject_status_invalid')
  if (input.actualPeriodStart) claims[EncounterHistoryClaim.ActualPeriodStart] = dateTime(input.actualPeriodStart, 'encounter_history_actual_start_invalid')
  if (input.actualPeriodEnd) claims[EncounterHistoryClaim.ActualPeriodEnd] = dateTime(input.actualPeriodEnd, 'encounter_history_actual_end_invalid')
  if (input.plannedStartDate) claims[EncounterHistoryClaim.PlannedStartDate] = dateTime(input.plannedStartDate, 'encounter_history_planned_start_invalid')
  if (input.plannedEndDate) claims[EncounterHistoryClaim.PlannedEndDate] = dateTime(input.plannedEndDate, 'encounter_history_planned_end_invalid')
  if (input.locationReference) claims[EncounterHistoryClaim.Location] = reference(input.locationReference, 'encounter_history_location_invalid')
  if (input.locationForm) claims[EncounterHistoryClaim.LocationForm] = coding(input.locationForm, 'encounter_history_location_form_invalid')
  return buildFlatClaimResourceEntry({ entryId: input.entryId, resourceType: 'EncounterHistory', claims })
}

/**
 * Builds one actual-care Encounter graph from an originating Appointment.
 * Child service/location encounters inherit subject and provider and reference
 * the parent with FHIR `Encounter.partOf`; Appointment remains planning input.
 */
export function buildEncounterCareJourneyFlatGraph(input: Readonly<{
  parent: EncounterJourneyNode & Readonly<{
    subjectReference: string
    appointmentReference?: string
    serviceProviderReference: string
  }>
  stages?: readonly EncounterJourneyNode[]
}>): readonly FlatClaimResourceEntry[] {
  const parent = encounterEntry(input.parent)
  const stages = (input.stages ?? []).map(stage => encounterEntry({
    ...stage,
    subjectReference: input.parent.subjectReference,
    serviceProviderReference: input.parent.serviceProviderReference,
    partOfReference: parent.reference,
  }))
  return Object.freeze([parent, ...stages])
}

/** Builds one standard claims-first ServiceRequest; caller identity is input, not inferred authority. */
export function buildServiceRequestFlatEntry(input: Readonly<{
  entryId: string
  identifier: string
  status: 'draft' | 'active' | 'on-hold' | 'revoked' | 'completed' | 'entered-in-error' | 'unknown'
  intent: 'proposal' | 'plan' | 'directive' | 'order' | 'original-order' | 'reflex-order' | 'filler-order' | 'instance-order' | 'option'
  priority?: 'routine' | 'urgent' | 'asap' | 'stat'
  category?: ClinicalCoding
  code: ClinicalCoding
  subjectReference: string
  encounterReference?: string
  requesterReference: string
  performerReferences: readonly string[]
  authoredAt: string
  occurrence?: string
  reasonCodes?: readonly ClinicalCoding[]
  reasonReferences?: readonly string[]
}>): FlatClaimResourceEntry {
  const claims: Record<string, string> = {
    [ServiceRequestClaim.Identifier]: required(input.identifier, 'service_request_identifier_required'),
    [ServiceRequestClaim.Status]: input.status,
    [ServiceRequestClaim.Intent]: input.intent,
    [ServiceRequestClaim.Code]: coding(input.code, 'service_request_code_invalid'),
    [ServiceRequestClaim.Subject]: reference(input.subjectReference, 'service_request_subject_invalid'),
    [ServiceRequestClaim.Requester]: reference(input.requesterReference, 'service_request_requester_invalid'),
    [ServiceRequestClaim.Performer]: references(input.performerReferences, 'service_request_performer_required'),
    [ServiceRequestClaim.AuthoredOn]: dateTime(input.authoredAt, 'service_request_authored_on_invalid'),
  }
  if (input.priority) claims[ServiceRequestClaim.Priority] = input.priority
  if (input.category) claims[ServiceRequestClaim.Category] = coding(input.category, 'service_request_category_invalid')
  if (input.code.text?.trim()) claims[ServiceRequestClaim.CodeText] = input.code.text.trim()
  if (input.encounterReference) claims[ServiceRequestClaim.Encounter] = reference(input.encounterReference, 'service_request_encounter_invalid')
  if (input.occurrence) claims[ServiceRequestClaim.Occurrence] = dateTime(input.occurrence, 'service_request_occurrence_invalid')
  if (input.reasonCodes?.length) claims[ServiceRequestClaim.ReasonCode] = input.reasonCodes.map(value => coding(value, 'service_request_reason_code_invalid')).join(',')
  if (input.reasonReferences?.length) claims[ServiceRequestClaim.ReasonReference] = references(input.reasonReferences, 'service_request_reason_reference_invalid')
  return buildFlatClaimResourceEntry({ entryId: input.entryId, resourceType: 'ServiceRequest', claims })
}

/** Builds the independent durable Task used to acknowledge and triage one ServiceRequest. */
export function buildServiceRequestTriageTaskFlatEntry(input: Readonly<{
  entryId: string
  identifier: string
  serviceRequestReference: string
  subjectReference: string
  requesterReference: string
  ownerReference: string
  authoredAt: string
}>): FlatClaimResourceEntry {
  return buildFlatClaimResourceEntry({
    entryId: input.entryId,
    resourceType: 'Task',
    claims: {
      [TaskClaim.Identifier]: required(input.identifier, 'triage_task_identifier_required'),
      [TaskClaim.Status]: 'requested',
      [TaskClaim.Intent]: 'order',
      [TaskClaim.Code]: 'triage',
      [TaskClaim.For]: reference(input.subjectReference, 'triage_task_subject_invalid'),
      [TaskClaim.Requester]: reference(input.requesterReference, 'triage_task_requester_invalid'),
      [TaskClaim.Owner]: reference(input.ownerReference, 'triage_task_owner_invalid'),
      [TaskClaim.Focus]: reference(input.serviceRequestReference, 'triage_task_focus_invalid'),
      [TaskClaim.AuthoredOn]: dateTime(input.authoredAt, 'triage_task_authored_on_invalid'),
    },
  })
}

/** Builds one campaign-level request against a frozen enumerated Group snapshot. */
export function buildCohortCommunicationRequestFlatEntry(input: Readonly<{
  entryId: string
  identifier: string
  status: 'draft' | 'active' | 'on-hold' | 'revoked' | 'completed' | 'entered-in-error' | 'unknown'
  priority?: 'routine' | 'urgent' | 'asap' | 'stat'
  category: ClinicalCoding
  subjectReference: string
  requesterReference: string
  authoredAt: string
  occurrence?: string
  reasonReferences: readonly string[]
}>): FlatClaimResourceEntry {
  const claims: Record<string, string> = {
    [CommunicationRequestClaim.Identifier]: required(input.identifier, 'communication_request_identifier_required'),
    [CommunicationRequestClaim.Status]: input.status,
    [CommunicationRequestClaim.Category]: coding(input.category, 'communication_request_category_invalid'),
    [CommunicationRequestClaim.Subject]: groupReference(input.subjectReference, 'communication_request_subject_group_required'),
    [CommunicationRequestClaim.Requester]: reference(input.requesterReference, 'communication_request_requester_invalid'),
    [CommunicationRequestClaim.AuthoredOn]: dateTime(input.authoredAt, 'communication_request_authored_on_invalid'),
    [CommunicationRequestClaim.ReasonReference]: references(input.reasonReferences, 'communication_request_reason_reference_required'),
  }
  if (input.priority) claims[CommunicationRequestClaim.Priority] = input.priority
  if (input.occurrence) claims[CommunicationRequestClaim.Occurrence] = dateTime(input.occurrence, 'communication_request_occurrence_invalid')
  return buildFlatClaimResourceEntry({ entryId: input.entryId, resourceType: 'CommunicationRequest', claims })
}

function encounterEntry(input: EncounterJourneyNode & Readonly<{
  subjectReference: string
  serviceProviderReference: string
  appointmentReference?: string
  partOfReference?: string
}>): FlatClaimResourceEntry {
  const claims: Record<string, string> = {
    [EncounterClaim.Identifier]: required(input.identifier, 'encounter_identifier_required'),
    [EncounterClaim.Status]: input.status,
    [EncounterClaim.Subject]: reference(input.subjectReference, 'encounter_subject_invalid'),
    [EncounterClaim.ServiceProvider]: reference(input.serviceProviderReference, 'encounter_service_provider_invalid'),
    [EncounterClaim.PeriodStart]: dateTime(input.periodStart, 'encounter_period_start_invalid'),
    [EncounterClaim.Location]: reference(input.locationReference, 'encounter_location_invalid'),
  }
  if (input.periodEnd) claims[EncounterClaim.PeriodEnd] = dateTime(input.periodEnd, 'encounter_period_end_invalid')
  if (input.appointmentReference) claims[EncounterClaim.Appointment] = reference(input.appointmentReference, 'encounter_appointment_invalid')
  if (input.partOfReference) claims[EncounterClaim.PartOf] = reference(input.partOfReference, 'encounter_part_of_invalid')
  if (input.type) claims[EncounterClaim.Type] = coding(input.type, 'encounter_type_invalid')
  return buildFlatClaimResourceEntry({ entryId: input.entryId, resourceType: 'Encounter', claims })
}

function coding(value: ClinicalCoding, error: string): string {
  const system = required(value.system, error)
  const code = required(value.code, error)
  if (system.includes('|') || code.includes('|') || system.includes(',') || code.includes(',')) throw new TypeError(error)
  return `${system}|${code}`
}

function references(values: readonly string[], error: string): string {
  const normalized = [...new Set(values.map(value => reference(value, error)))]
  if (!normalized.length) throw new TypeError(error)
  return normalized.join(',')
}

function reference(value: string, error: string): string {
  const normalized = required(value, error)
  if (normalized.includes(',')) throw new TypeError(error)
  return normalized
}

function groupReference(value: string, error: string): string {
  const normalized = reference(value, error)
  if (!normalized.startsWith('Group/')) throw new TypeError(error)
  return normalized
}

function dateTime(value: string, error: string): string {
  const normalized = required(value, error)
  if (!/^\d{4}-\d{2}-\d{2}T/.test(normalized) || Number.isNaN(Date.parse(normalized))) throw new TypeError(error)
  return normalized
}

function required(value: unknown, error: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(error)
  return value.trim()
}
