// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ObservationClaim,
  VITAL_SIGN_EXAMPLES,
  VitalSignCode,
  VitalSignUnit,
  VitalSignsCodes,
  buildVitalSignObservation,
  materializeObservationComponentIndexEntries,
  normalizeVitalSignDeviceBatch,
  parseObservationComponents,
  projectVitalSignObservationR4,
  projectVitalSignObservationR5,
} from '../dist/vital-sign-observations.js'

const { subjectReference, deviceReference, bloodPressure, heartRateBatch } = VITAL_SIGN_EXAMPLES

test('builds a blood-pressure graph with parent-owned has-member links and independently indexable component Observations', () => {
  const graph = buildVitalSignObservation({
    entryId: bloodPressure.entryId,
    subjectReference,
    kind: 'blood-pressure',
    measuredAt: bloodPressure.measuredAt,
    status: 'preliminary',
    userSelected: true,
    systolic: bloodPressure.systolic,
    diastolic: bloodPressure.diastolic,
    deviceReference,
  })

  assert.equal(graph.entries.length, 3)
  assert.equal(graph.primary.claims[ObservationClaim.Code], VitalSignCode.bloodPressure)
  assert.equal(graph.primary.claims[ObservationClaim.CodeDisplay], VitalSignsCodes.BloodPressure.display)
  assert.equal(graph.primary.claims[ObservationClaim.HasMember], graph.components.map(component => component.reference).join(','))
  assert.equal(graph.primary.claims[ObservationClaim.ComponentCode], undefined)
  assert.equal(graph.primary.claims[ObservationClaim.ComponentValueQuantityNumber], undefined)
  assert.equal(graph.primary.claims[ObservationClaim.Device], deviceReference)
  assert.equal(graph.primary.claims[ObservationClaim.Status], 'preliminary')
  assert.equal(graph.primary.claims[ObservationClaim.UserSelected], 'true')
  assert.equal(graph.primary.claims[ObservationClaim.Performer], undefined)
  assert.equal(graph.primary.claims[ObservationClaim.BloodPressureSystolicNumber], undefined)
  assert.equal(graph.primary.claims[ObservationClaim.BloodPressureDiastolicNumber], undefined)
  assert.deepEqual(graph.components.map(component => component.claims[ObservationClaim.Code]), [VitalSignCode.systolic, VitalSignCode.diastolic])
  assert.deepEqual(graph.components.map(component => component.claims[ObservationClaim.ValueQuantityNumber]), [String(bloodPressure.systolic), String(bloodPressure.diastolic)])
  assert.ok(graph.components.every(component => component.claims[ObservationClaim.Identifier] === component.entryId))
  assert.ok(graph.components.every(component => component.claims[ObservationClaim.Subject] === subjectReference))
  assert.ok(graph.components.every(component => component.claims[ObservationClaim.Status] === undefined))
  assert.ok(graph.components.every(component => component.claims['Observation.is-contained'] === undefined))
  assert.ok(graph.components.every(component => component.claims['Observation.contained-parent-reference'] === undefined))

  assert.deepEqual(parseObservationComponents(graph), [
    { code: VitalSignCode.systolic, display: VitalSignsCodes.SystolicBloodPressure.display, value: bloodPressure.systolic, unit: VitalSignUnit.bloodPressure },
    { code: VitalSignCode.diastolic, display: VitalSignsCodes.DiastolicBloodPressure.display, value: bloodPressure.diastolic, unit: VitalSignUnit.bloodPressure },
  ])
})

test('materializes one native FHIR blood-pressure Observation with two components in R4 and R5', () => {
  const graph = buildVitalSignObservation({ ...bloodPressure, subjectReference, deviceReference, kind: 'blood-pressure', status: 'final' })
  for (const projected of [projectVitalSignObservationR4(graph), projectVitalSignObservationR5(graph)]) {
    assert.equal(projected.resourceType, 'Observation') // Exact FHIR wire literal is the behavior under test.
    assert.equal(projected.code.coding[0].code, VitalSignCode.bloodPressure.split('|')[1])
    assert.equal(projected.code.coding[0].display, VitalSignsCodes.BloodPressure.display)
    assert.equal(projected.component.length, 2)
    assert.equal(projected.valueQuantity, undefined)
    assert.deepEqual(projected.component.map(component => component.valueQuantity.value), [bloodPressure.systolic, bloodPressure.diastolic])
    assert.deepEqual(projected.component.map(component => component.code.coding[0].display), [VitalSignsCodes.SystolicBloodPressure.display, VitalSignsCodes.DiastolicBloodPressure.display])
  }
})

test('materializes generic component index rows without inventing scale-specific claims', () => {
  const graph = buildVitalSignObservation({ ...bloodPressure, subjectReference, kind: 'blood-pressure', status: 'final' })
  const indexed = materializeObservationComponentIndexEntries(graph)
  assert.equal(indexed.length, 2)
  assert.deepEqual(indexed.map(item => item.claims[ObservationClaim.Code]), [VitalSignCode.systolic, VitalSignCode.diastolic])
  assert.deepEqual(indexed.map(item => item.claims[ObservationClaim.CodeDisplay]), [VitalSignsCodes.SystolicBloodPressure.display, VitalSignsCodes.DiastolicBloodPressure.display])
  assert.deepEqual(indexed.map(item => item.claims[ObservationClaim.ValueQuantityNumber]), [String(bloodPressure.systolic), String(bloodPressure.diastolic)])
  assert.ok(indexed.every(item => item.parentReference === graph.primary.reference))
  assert.ok(indexed.every(item => item.claims[ObservationClaim.Identifier]))
  assert.ok(indexed.every(item => item.claims[ObservationClaim.Status] === undefined))
  assert.ok(indexed.every(item => item.claims[ObservationClaim.BloodPressureSystolicNumber] === undefined))
  assert.ok(indexed.every(item => item.claims[ObservationClaim.BloodPressureDiastolicNumber] === undefined))
})

test('reads historical comma-separated component claims without writing that format again', () => {
  const legacyClaims = {
    [ObservationClaim.ComponentCode]: `${VitalSignCode.systolic},${VitalSignCode.diastolic}`,
    [ObservationClaim.ComponentValueQuantityNumber]: `${bloodPressure.systolic},${bloodPressure.diastolic}`,
    [ObservationClaim.ComponentValueQuantityUnit]: `${VitalSignUnit.bloodPressure},${VitalSignUnit.bloodPressure}`,
  }
  assert.deepEqual(parseObservationComponents(legacyClaims), [
    { code: VitalSignCode.systolic, value: bloodPressure.systolic, unit: VitalSignUnit.bloodPressure },
    { code: VitalSignCode.diastolic, value: bloodPressure.diastolic, unit: VitalSignUnit.bloodPressure },
  ])
})

test('reads historical blood-pressure scalar aliases only when component claims are absent', () => {
  const historicalClaims = {
    [ObservationClaim.Code]: VitalSignCode.bloodPressure,
    [ObservationClaim.BloodPressureSystolicNumber]: String(bloodPressure.systolic),
    [ObservationClaim.BloodPressureDiastolicNumber]: String(bloodPressure.diastolic),
  }
  assert.deepEqual(parseObservationComponents(historicalClaims), [
    { code: VitalSignCode.systolic, value: bloodPressure.systolic, unit: VitalSignUnit.bloodPressure },
    { code: VitalSignCode.diastolic, value: bloodPressure.diastolic, unit: VitalSignUnit.bloodPressure },
  ])
})

test('normalizes a multi-day device batch without collapsing timestamps or inventing an attester', () => {
  const observations = normalizeVitalSignDeviceBatch({
    subjectReference,
    deviceReference,
    readings: heartRateBatch,
  })

  assert.deepEqual(observations.map(graph => graph.primary.claims[ObservationClaim.EffectiveDateTime]), heartRateBatch.map(reading => new Date(reading.measuredAt).toISOString()))
  assert.ok(observations.every(graph => graph.primary.claims[ObservationClaim.Device] === deviceReference))
  assert.ok(observations.every(graph => graph.primary.claims[ObservationClaim.Performer] === undefined))
})

test('preserves governed Fahrenheit and pound UCUM units selected by a regional UI', () => {
  const temperature = buildVitalSignObservation({
    entryId: 'temperature-fahrenheit', subjectReference, kind: 'temperature',
    measuredAt: '2026-09-27T09:00:00-07:00', status: 'registered', value: 98.6,
    unit: VitalSignUnit.temperatureFahrenheit,
  })
  const weight = buildVitalSignObservation({
    entryId: 'weight-pounds', subjectReference, kind: 'body-weight',
    measuredAt: '2026-09-27T09:05:00-07:00', status: 'registered', value: 22.5,
    unit: VitalSignUnit.bodyWeightPound,
  })

  assert.equal(temperature.primary.claims[ObservationClaim.ValueQuantityUnit], VitalSignUnit.temperatureFahrenheit)
  assert.equal(weight.primary.claims[ObservationClaim.ValueQuantityUnit], VitalSignUnit.bodyWeightPound)
  assert.equal(projectVitalSignObservationR4(temperature).valueQuantity.code, '[degF]')
  assert.equal(projectVitalSignObservationR4(weight).valueQuantity.code, '[lb_av]')
  assert.throws(() => buildVitalSignObservation({
    entryId: 'temperature-pounds', subjectReference, kind: 'temperature',
    measuredAt: '2026-09-27T09:10:00-07:00', status: 'registered', value: 98.6,
    unit: VitalSignUnit.bodyWeightPound,
  }), /vital_sign_unit_invalid/)
})

test('rejects impossible measurements, invalid timestamps and duplicate batch identities', () => {
  assert.throws(() => buildVitalSignObservation({
    entryId: 'take-01', subjectReference, kind: 'blood-pressure', measuredAt: 'not-a-date', status: 'preliminary', systolic: 70, diastolic: 90,
  }), /vital_sign_measured_at_invalid|blood_pressure_values_invalid/)
  assert.throws(() => normalizeVitalSignDeviceBatch({
    subjectReference,
    deviceReference,
    readings: [
      { entryId: 'take-01', kind: 'temperature', measuredAt: '2026-09-21T08:00:00Z', value: 37 },
      { entryId: 'take-01', kind: 'temperature', measuredAt: '2026-09-21T09:00:00Z', value: 37.2 },
    ],
  }), /vital_sign_entry_id_duplicate/)
})
