import { DeviceMetricClaim } from '../claims/device-metric-claims.js'
import { DocumentReferenceClaim } from '../claims/document-reference-claims.js'
import { ProcedureClaim } from '../claims/procedure-claims.js'
import { RegulatedAuthorizationClaim } from '../claims/regulated-authorization-claims.js'

type FlatResourceType = 'Procedure' | 'DeviceMetric' | 'DocumentReference' | 'RegulatedAuthorization'
export type DeviceComplianceFlatResource = Readonly<{
  resourceType: FlatResourceType
  id: string
  meta: Readonly<{ claims: Readonly<Record<string, string>> }>
}>

const required = (value: string, error: string): string => {
  const normalized = String(value || '').trim()
  if (!normalized) throw new TypeError(error)
  return normalized
}
const id = (value: string): string => {
  const normalized = required(value, 'device_compliance_id_required')
  if (!/^[A-Za-z0-9.-]{1,64}$/.test(normalized)) throw new TypeError('device_compliance_id_invalid')
  return normalized
}
const reference = (value: string, resourceType: string, error: string): string => {
  const normalized = required(value, error)
  if (!new RegExp(`^${resourceType}/[A-Za-z0-9.-]+$`).test(normalized)) throw new TypeError(error)
  return normalized
}
const actorReference = (value: string): string => {
  const normalized = required(value, 'calibration_performer_reference_invalid')
  if (!/^(?:Practitioner|PractitionerRole|Organization|HealthcareService|Device)\/[A-Za-z0-9.-]+$/.test(normalized)) {
    throw new TypeError('calibration_performer_reference_invalid')
  }
  return normalized
}
const token = (value: string, error: string): string => {
  const normalized = required(value, error)
  const separator = normalized.lastIndexOf('|')
  if (separator < 1 || separator === normalized.length - 1) throw new TypeError(error)
  return normalized
}
const instant = (value: string, error: string): string => {
  const normalized = required(value, error)
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(normalized)) throw new TypeError(error)
  return normalized
}
const resource = (resourceType: FlatResourceType, resourceId: string, claims: Record<string, string>): DeviceComplianceFlatResource => Object.freeze({
  resourceType,
  id: id(resourceId),
  meta: Object.freeze({ claims: Object.freeze(claims) }),
})

/**
 * Builds the technical calibration event separately from the current metric state and its evidence.
 * Performer references are descriptive; product authorization decides which credentialed actor may submit.
 */
export function buildDeviceCalibrationFlatGraph(input: Readonly<{
  procedureId: string
  procedureIdentifier: string
  procedureCode: string
  deviceReference: string
  metricId: string
  metricIdentifier: string
  metricType: string
  metricUnit?: string
  calibrationType: 'unspecified' | 'offset' | 'gain' | 'two-point'
  calibrationState: 'not-calibrated' | 'calibration-required' | 'calibrated' | 'unspecified'
  calibrationTime: string
  performerReferences: readonly string[]
  locationReference?: string
  evidence?: Readonly<{ documentId: string; documentIdentifier: string; contentHash: string; contentType: string }>
}>): readonly DeviceComplianceFlatResource[] {
  const deviceReference = reference(input.deviceReference, 'Device', 'device_reference_invalid')
  const performers = [...new Set(input.performerReferences.map(actorReference))]
  if (!performers.length) throw new TypeError('calibration_performer_required')
  const calibrationTime = instant(input.calibrationTime, 'calibration_time_invalid')
  const reportReference = input.evidence ? `DocumentReference/${id(input.evidence.documentId)}` : undefined
  const procedure = resource('Procedure', input.procedureId, {
    [ProcedureClaim.Identifier]: required(input.procedureIdentifier, 'procedure_identifier_required'),
    [ProcedureClaim.Status]: 'completed',
    [ProcedureClaim.Code]: token(input.procedureCode, 'procedure_code_invalid'),
    [ProcedureClaim.Subject]: deviceReference,
    [ProcedureClaim.FocalDevice]: deviceReference,
    [ProcedureClaim.Date]: calibrationTime,
    [ProcedureClaim.Performer]: performers.join(','),
    ...(input.locationReference ? { [ProcedureClaim.Location]: reference(input.locationReference, 'Location', 'calibration_location_reference_invalid') } : {}),
    ...(reportReference ? { [ProcedureClaim.Report]: reportReference } : {}),
  })
  const metric = resource('DeviceMetric', input.metricId, {
    [DeviceMetricClaim.Identifier]: required(input.metricIdentifier, 'metric_identifier_required'),
    [DeviceMetricClaim.Type]: token(input.metricType, 'metric_type_invalid'),
    ...(input.metricUnit ? { [DeviceMetricClaim.Unit]: token(input.metricUnit, 'metric_unit_invalid') } : {}),
    [DeviceMetricClaim.Device]: deviceReference,
    [DeviceMetricClaim.Category]: 'measurement',
    [DeviceMetricClaim.CalibrationType]: input.calibrationType,
    [DeviceMetricClaim.CalibrationState]: input.calibrationState,
    [DeviceMetricClaim.CalibrationTime]: calibrationTime,
  })
  const evidence = input.evidence
    ? [resource('DocumentReference', input.evidence.documentId, {
      [DocumentReferenceClaim.Identifier]: required(input.evidence.documentIdentifier, 'calibration_evidence_identifier_required'),
      [DocumentReferenceClaim.Subject]: deviceReference,
      [DocumentReferenceClaim.Context]: `Procedure/${procedure.id}`,
      [DocumentReferenceClaim.ContentHash]: required(input.evidence.contentHash, 'calibration_evidence_hash_required'),
      [DocumentReferenceClaim.ContentType]: required(input.evidence.contentType, 'calibration_evidence_content_type_required'),
      [DocumentReferenceClaim.Date]: calibrationTime,
    })]
    : []
  return Object.freeze([procedure, metric, ...evidence])
}

/** Builds a public-authority operating authorization without conflating it with calibration. */
export function buildDeviceOperatingAuthorizationFlatResource(input: Readonly<{
  authorizationId: string
  identifier: string
  subjectReference: string
  holderReference: string
  regulatorReference: string
  type: string
  status: string
  statusDate: string
  validityPeriod: Readonly<{ start: string; end: string }>
  region: string
  basis: string
}>): DeviceComplianceFlatResource {
  const start = required(input.validityPeriod.start, 'authorization_validity_invalid')
  const end = required(input.validityPeriod.end, 'authorization_validity_invalid')
  if (Date.parse(end) < Date.parse(start)) throw new TypeError('authorization_validity_invalid')
  const subjectReference = required(input.subjectReference, 'authorization_subject_reference_invalid')
  if (!/^(?:DeviceDefinition|Organization|Location|ActivityDefinition|PlanDefinition)\/[A-Za-z0-9.-]+$/.test(subjectReference)) {
    throw new TypeError('authorization_subject_reference_invalid')
  }
  return resource('RegulatedAuthorization', input.authorizationId, {
    [RegulatedAuthorizationClaim.Identifier]: required(input.identifier, 'authorization_identifier_required'),
    [RegulatedAuthorizationClaim.Subject]: subjectReference,
    [RegulatedAuthorizationClaim.Type]: token(input.type, 'authorization_type_invalid'),
    [RegulatedAuthorizationClaim.Region]: token(input.region, 'authorization_region_invalid'),
    [RegulatedAuthorizationClaim.Status]: required(input.status, 'authorization_status_required'),
    [RegulatedAuthorizationClaim.StatusDate]: instant(input.statusDate, 'authorization_status_date_invalid'),
    [RegulatedAuthorizationClaim.ValidityStart]: start,
    [RegulatedAuthorizationClaim.ValidityEnd]: end,
    [RegulatedAuthorizationClaim.Basis]: token(input.basis, 'authorization_basis_invalid'),
    [RegulatedAuthorizationClaim.Holder]: reference(input.holderReference, 'Organization', 'authorization_holder_reference_invalid'),
    [RegulatedAuthorizationClaim.Regulator]: reference(input.regulatorReference, 'Organization', 'authorization_regulator_reference_invalid'),
  })
}
