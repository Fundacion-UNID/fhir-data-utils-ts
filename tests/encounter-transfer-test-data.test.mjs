// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  EncounterStatusR5,
  FHIR_ENCOUNTER_TRANSFER_TEST_DATA,
  fhirInstantToEpochSeconds,
} from '../dist/index.js'

const EXPECTED_TRANSFER_EPOCH_SECONDS = 1790763000

test('exports one internally consistent source-to-destination Encounter transfer fixture', () => {
  assert.equal(FHIR_ENCOUNTER_TRANSFER_TEST_DATA.source.statusWhenReturning, EncounterStatusR5.OnHold)
  assert.equal(FHIR_ENCOUNTER_TRANSFER_TEST_DATA.source.statusWhenNotReturning, EncounterStatusR5.Completed)
  assert.equal(FHIR_ENCOUNTER_TRANSFER_TEST_DATA.destination.statusOnArrival, EncounterStatusR5.InProgress)
  assert.equal(FHIR_ENCOUNTER_TRANSFER_TEST_DATA.sourceHistory.encounterReference, FHIR_ENCOUNTER_TRANSFER_TEST_DATA.source.reference)
  assert.equal(FHIR_ENCOUNTER_TRANSFER_TEST_DATA.destinationHistory.encounterReference, FHIR_ENCOUNTER_TRANSFER_TEST_DATA.destination.reference)
})

test('keeps FHIR instant separate from its derived Unix epoch seconds', () => {
  const transferOccurredAt = FHIR_ENCOUNTER_TRANSFER_TEST_DATA.occurredAt
  const invalidInstantWithoutTimezone = FHIR_ENCOUNTER_TRANSFER_TEST_DATA.invalidOccurredAtWithoutTimezone

  assert.equal(fhirInstantToEpochSeconds(transferOccurredAt), EXPECTED_TRANSFER_EPOCH_SECONDS)
  assert.throws(() => fhirInstantToEpochSeconds(invalidInstantWithoutTimezone), /fhir_instant_invalid/)
})
