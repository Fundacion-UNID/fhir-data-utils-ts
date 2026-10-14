// Flow contract: equipment scheduling, calibration evidence and public operating authorization remain independent claims-first resources and materialize only at the FHIR R5 boundary.
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DeviceMetricClaim,
  ProcedureClaim,
  RegulatedAuthorizationClaim,
  buildDeviceCalibrationFlatGraph,
  buildDeviceOperatingAuthorizationFlatResource,
  materializeClaimsFirstResourceToFhirR5,
} from '../dist/index.js'

const CALIBRATION_CODE = 'http://snomed.info/sct|386053000'

test('keeps a calibration procedure, metric state and evidence document independently addressable', () => {
  const graph = buildDeviceCalibrationFlatGraph({
    procedureId: 'calibration-20260929',
    procedureIdentifier: 'urn:uuid:calibration-20260929',
    procedureCode: CALIBRATION_CODE,
    deviceReference: 'Device/apheresis-machine-1',
    metricId: 'apheresis-flow-rate',
    metricIdentifier: 'urn:uuid:apheresis-flow-rate',
    metricType: 'http://loinc.org|11850-8',
    metricUnit: 'http://unitsofmeasure.org|mL/min',
    calibrationType: 'two-point',
    calibrationState: 'calibrated',
    calibrationTime: '2026-09-29T15:00:00Z',
    performerReferences: ['PractitionerRole/laboratory-technician-1', 'Organization/maintenance-provider-1'],
    locationReference: 'Location/plasma-station-1',
    evidence: {
      documentId: 'calibration-certificate-20260929',
      documentIdentifier: 'urn:uuid:calibration-certificate-20260929',
      contentHash: 'zCalibrationEvidenceHash',
      contentType: 'application/pdf',
    },
  })

  assert.deepEqual(graph.map(resource => resource.resourceType), ['Procedure', 'DeviceMetric', 'DocumentReference'])
  assert.equal(graph[0].meta.claims[ProcedureClaim.Subject], 'Device/apheresis-machine-1')
  assert.equal(graph[0].meta.claims[ProcedureClaim.FocalDevice], 'Device/apheresis-machine-1')
  assert.equal(graph[1].meta.claims[DeviceMetricClaim.Device], 'Device/apheresis-machine-1')
  assert.equal(graph[1].meta.claims[DeviceMetricClaim.CalibrationState], 'calibrated')

  const procedure = materializeClaimsFirstResourceToFhirR5(graph[0])
  const metric = materializeClaimsFirstResourceToFhirR5(graph[1])
  assert.equal(procedure.subject.reference, 'Device/apheresis-machine-1')
  assert.equal(procedure.focalDevice[0].manipulated.reference, 'Device/apheresis-machine-1')
  assert.equal(metric.device.reference, 'Device/apheresis-machine-1')
  assert.equal(metric.calibration[0].time, '2026-09-29T15:00:00Z')
})

test('models public authorization separately from technician calibration and targets the installed location', () => {
  const authorization = buildDeviceOperatingAuthorizationFlatResource({
    authorizationId: 'plasma-station-operating-authorization',
    identifier: 'urn:uuid:plasma-station-operating-authorization',
    subjectReference: 'Location/plasma-station-1',
    holderReference: 'Organization/blood-bank-department',
    regulatorReference: 'Organization/public-health-authority',
    type: 'https://example.invalid/codes/regulated-authorization|device-operation',
    status: 'active',
    statusDate: '2026-09-29T16:00:00Z',
    validityPeriod: { start: '2026-09-29', end: '2027-09-29' },
    region: 'urn:iso:std:iso:3166|-region',
    basis: 'https://example.invalid/codes/regulatory-basis|installed-medical-device',
  })

  assert.equal(authorization.meta.claims[RegulatedAuthorizationClaim.Regulator], 'Organization/public-health-authority')
  const materialized = materializeClaimsFirstResourceToFhirR5(authorization)
  assert.equal(materialized.subject[0].reference, 'Location/plasma-station-1')
  assert.equal(materialized.holder.reference, 'Organization/blood-bank-department')
  assert.equal(materialized.regulator.reference, 'Organization/public-health-authority')
  assert.deepEqual(materialized.validityPeriod, { start: '2026-09-29', end: '2027-09-29' })
})

test('rejects browser-authored nested FHIR and invalid calibration actors', () => {
  assert.throws(() => buildDeviceCalibrationFlatGraph({
    procedureId: 'calibration-20260929',
    procedureIdentifier: 'urn:uuid:calibration-20260929',
    procedureCode: CALIBRATION_CODE,
    deviceReference: 'Location/not-a-device',
    metricId: 'apheresis-flow-rate',
    metricIdentifier: 'urn:uuid:apheresis-flow-rate',
    metricType: 'http://loinc.org|11850-8',
    calibrationType: 'two-point',
    calibrationState: 'calibrated',
    calibrationTime: '2026-09-29T15:00:00Z',
    performerReferences: ['PractitionerRole/laboratory-technician-1'],
  }), /device_reference_invalid/)

  assert.throws(() => materializeClaimsFirstResourceToFhirR5({
    resourceType: 'DeviceMetric', id: 'metric-1', device: { reference: 'Device/machine-1' }, meta: { claims: {} },
  }), /claims_first_resource_nested_fhir_forbidden/)
})
