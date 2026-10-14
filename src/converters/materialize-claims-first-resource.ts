import type { FhirResource } from '../fhir-types.js'
import type { FlatClaims } from './convert-shared.js'
import { healthcareServiceFlatToFhirR5 } from './convert-healthcare-service.js'
import { locationFlatToFhirR5 } from './convert-location.js'
import { organizationFlatToFhirR5 } from './convert-organization.js'
import { scheduleFlatToFhirR5, slotFlatToFhirR5 } from './convert-schedule-slot.js'
import { deviceMetricFlatToFhirR5 } from './convert-device-metric.js'
import { procedureFlatToFhirR5 } from './convert-procedure.js'
import { regulatedAuthorizationFlatToFhirR5 } from './convert-regulated-authorization.js'
import { documentReferenceFlatToFhirR4 } from './convert-document-reference.js'
import { encounterFlatToFhirR5 } from './convert-encounter.js'
import { encounterHistoryFlatToFhirR5 } from './convert-encounter-history.js'

export type ClaimsFirstFhirResource = Readonly<{
  resourceType: 'Organization' | 'HealthcareService' | 'Location' | 'Schedule' | 'Slot' | 'DeviceMetric' | 'Procedure' | 'RegulatedAuthorization' | 'DocumentReference' | 'Encounter' | 'EncounterHistory'
  id: string
  meta: Readonly<{ claims: Readonly<Record<string, unknown>> }>
}>

const materializers = Object.freeze({
  Organization: organizationFlatToFhirR5,
  HealthcareService: healthcareServiceFlatToFhirR5,
  Location: locationFlatToFhirR5,
  Schedule: scheduleFlatToFhirR5,
  Slot: slotFlatToFhirR5,
  DeviceMetric: deviceMetricFlatToFhirR5,
  Procedure: procedureFlatToFhirR5,
  RegulatedAuthorization: regulatedAuthorizationFlatToFhirR5,
  DocumentReference: documentReferenceFlatToFhirR4,
  Encounter: encounterFlatToFhirR5,
  EncounterHistory: encounterHistoryFlatToFhirR5,
} as const)

/**
 * Materializes native FHIR R5 only at an explicit adapter boundary.
 *
 * Canonical persistence remains `{ resourceType, id, meta: { claims } }`.
 * Nested native fields are rejected so a materialized representation can never
 * silently become a second business source of truth.
 */
export function materializeClaimsFirstResourceToFhirR5(input: unknown): FhirResource {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('claims_first_resource_invalid')
  }
  const resource = input as Record<string, unknown>
  if (Object.keys(resource).some(key => !['resourceType', 'id', 'meta'].includes(key))) {
    throw new TypeError('claims_first_resource_nested_fhir_forbidden')
  }
  const resourceType = String(resource.resourceType || '') as keyof typeof materializers
  const materializer = materializers[resourceType]
  if (!materializer) throw new TypeError('claims_first_resource_type_unsupported')
  const id = String(resource.id || '').trim()
  if (!id) throw new TypeError('claims_first_resource_id_required')
  const meta = resource.meta
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) throw new TypeError('claims_first_resource_claims_required')
  if (Object.keys(meta).some(key => key !== 'claims')) throw new TypeError('claims_first_resource_nested_fhir_forbidden')
  const rawClaims = (meta as Record<string, unknown>).claims
  if (!rawClaims || typeof rawClaims !== 'object' || Array.isArray(rawClaims)) {
    throw new TypeError('claims_first_resource_claims_required')
  }
  const claims: FlatClaims = {}
  for (const [claim, rawValue] of Object.entries(rawClaims as Record<string, unknown>)) {
    const values = (Array.isArray(rawValue) ? rawValue : [rawValue])
      .map(value => String(value).trim())
      .filter(Boolean)
    if (!values.length) throw new TypeError('claims_first_resource_claim_value_invalid')
    claims[claim] = values.join(',')
  }
  return Object.freeze({ ...materializer(claims), id })
}
