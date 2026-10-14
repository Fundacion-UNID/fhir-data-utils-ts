import type { ClaimSpec } from './claim-types.js'

/** Canonical claims-first keys for FHIR ServiceRequest. */
export const ServiceRequestClaim = Object.freeze({
  Identifier: 'ServiceRequest.identifier',
  Status: 'ServiceRequest.status',
  Intent: 'ServiceRequest.intent',
  Priority: 'ServiceRequest.priority',
  Category: 'ServiceRequest.category',
  Code: 'ServiceRequest.code',
  CodeText: 'ServiceRequest.code-text',
  Subject: 'ServiceRequest.subject',
  Encounter: 'ServiceRequest.encounter',
  Requester: 'ServiceRequest.requester',
  Performer: 'ServiceRequest.performer',
  AuthoredOn: 'ServiceRequest.authored-on',
  Occurrence: 'ServiceRequest.occurrence',
  ReasonCode: 'ServiceRequest.reason-code',
  ReasonReference: 'ServiceRequest.reason-reference',
  SupportingInfo: 'ServiceRequest.supporting-info',
  Specimen: 'ServiceRequest.specimen',
  BodySite: 'ServiceRequest.body-site',
} as const)

export type ServiceRequestClaimKey = typeof ServiceRequestClaim[keyof typeof ServiceRequestClaim]

export const ServiceRequestClaimSpecs: readonly ClaimSpec[] = Object.freeze([
  { key: ServiceRequestClaim.Identifier, meaning: 'Business identifier.', example: 'urn:uuid:request-1' },
  { key: ServiceRequestClaim.Status, meaning: 'Request lifecycle status.', example: 'active' },
  { key: ServiceRequestClaim.Intent, meaning: 'Request intent.', example: 'order' },
  { key: ServiceRequestClaim.Priority, meaning: 'Request priority.', example: 'stat' },
  { key: ServiceRequestClaim.Category, meaning: 'Category token.', example: 'http://snomed.info/sct|409971007' },
  { key: ServiceRequestClaim.Code, meaning: 'Requested service token.', example: 'http://snomed.info/sct|225358003' },
  { key: ServiceRequestClaim.Subject, meaning: 'Subject reference.', example: 'Patient/subject-1' },
  { key: ServiceRequestClaim.Requester, meaning: 'Requester reference.', example: 'RelatedPerson/requester-1' },
  { key: ServiceRequestClaim.Performer, meaning: 'Requested performer references (CSV).', example: 'HealthcareService/emergency-1' },
  { key: ServiceRequestClaim.AuthoredOn, meaning: 'Request authoring time.', example: '2026-09-26T10:00:00Z' },
])
