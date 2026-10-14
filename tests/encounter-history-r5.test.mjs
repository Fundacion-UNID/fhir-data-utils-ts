// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import assert from 'node:assert/strict'
import test from 'node:test'
import * as fhir from '../dist/index.js'

const ENCOUNTER_REFERENCE = 'Encounter/emergency-one'
const SUBJECT_REFERENCE = 'Patient/individual-one'
const SERVICE_REFERENCE = 'HealthcareService/emergency-department-one'
const LOCATION_REFERENCE = 'Location/emergency-box-one'

test('models the R5 encounter lifecycle and materializes one claims-first EncounterHistory milestone', () => {
  assert.deepEqual(Object.values(fhir.EncounterStatusR5), [
    'planned', 'in-progress', 'on-hold', 'discharged', 'completed',
    'cancelled', 'discontinued', 'entered-in-error', 'unknown',
  ])

  const entry = fhir.buildEncounterHistoryR5FlatEntry({
    entryId: 'encounter-history-one',
    identifier: 'urn:uuid:encounter-history-one',
    encounterReference: ENCOUNTER_REFERENCE,
    status: fhir.EncounterStatusR5.OnHold,
    class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'EMER' },
    serviceReference: SERVICE_REFERENCE,
    subjectReference: SUBJECT_REFERENCE,
    actualPeriodStart: '2026-09-29T08:00:00Z',
    actualPeriodEnd: '2026-09-29T08:30:00Z',
    locationReference: LOCATION_REFERENCE,
  })

  assert.equal(entry.resourceType, 'EncounterHistory')
  assert.equal(entry.claims[fhir.EncounterHistoryClaim.Encounter], ENCOUNTER_REFERENCE)
  assert.equal(entry.claims[fhir.EncounterHistoryClaim.Status], fhir.EncounterStatusR5.OnHold)
  assert.equal(entry.claims[fhir.EncounterHistoryClaim.ServiceType], SERVICE_REFERENCE)

  const materialized = fhir.materializeClaimsFirstResourceToFhirR5({
    resourceType: entry.resourceType,
    id: entry.entryId,
    meta: { claims: entry.claims },
  })
  assert.equal(materialized.resourceType, 'EncounterHistory')
  assert.equal(materialized.encounter.reference, ENCOUNTER_REFERENCE)
  assert.equal(materialized.status, 'on-hold')
  assert.equal(materialized.class.coding[0].code, 'EMER')
  assert.equal(materialized.serviceType[0].reference.reference, SERVICE_REFERENCE)
  assert.equal(materialized.location[0].location.reference, LOCATION_REFERENCE)
})

test('projects an R5 Encounter with an explicit HealthcareService and R5-only terminal states', () => {
  const claims = {
    [fhir.EncounterClaim.Identifier]: 'urn:uuid:intensive-care-one',
    [fhir.EncounterClaim.Status]: fhir.EncounterStatusR5.Completed,
    [fhir.EncounterClaim.Class]: 'http://terminology.hl7.org/CodeSystem/v3-ActCode|IMP',
    [fhir.EncounterClaim.Subject]: SUBJECT_REFERENCE,
    [fhir.EncounterClaim.ServiceType]: 'HealthcareService/intensive-care-one',
    [fhir.EncounterClaim.ServiceProvider]: 'Organization/hospital-one',
    [fhir.EncounterClaim.ActualPeriodStart]: '2026-09-29T08:30:00Z',
    [fhir.EncounterClaim.ActualPeriodEnd]: '2026-09-29T14:00:00Z',
    [fhir.EncounterClaim.Location]: 'Location/icu-one',
    [fhir.EncounterClaim.PartOf]: ENCOUNTER_REFERENCE,
  }

  const encounter = fhir.encounterFlatToFhirR5(claims)
  assert.equal(encounter.status, 'completed')
  assert.equal(encounter.serviceType[0].reference.reference, 'HealthcareService/intensive-care-one')
  assert.equal(encounter.actualPeriod.end, '2026-09-29T14:00:00Z')
  assert.equal(fhir.encounterFhirR5ToFlat(encounter)[fhir.EncounterClaim.ServiceType], 'HealthcareService/intensive-care-one')
})

test('rejects R4-only and unknown status values at the R5 projection boundary', () => {
  assert.throws(() => fhir.encounterFlatToFhirR5({
    [fhir.EncounterClaim.Status]: fhir.EncounterStatus.Finished,
  }), /encounter_r5_status_invalid/)
  assert.throws(() => fhir.encounterHistoryFlatToFhirR5({
    [fhir.EncounterHistoryClaim.Status]: 'finished',
  }), /encounter_history_r5_status_invalid/)
})
