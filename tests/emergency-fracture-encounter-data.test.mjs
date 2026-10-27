// Flow contract: one exported FHIR-neutral emergency fixture is reused by portal, SDK and gateway tests without product-owned clinical literals.
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  FHIR_DEMO_ARM_FRACTURE_ENCOUNTER_JOURNEY,
  FhirDemoEncounterUpdateStatusIds,
} from '../dist/data/emergency-fracture-encounter.data.js'

test('exports one immutable in-progress emergency encounter and its ordered updates', () => {
  const fixture = FHIR_DEMO_ARM_FRACTURE_ENCOUNTER_JOURNEY

  assert.equal(fixture.encounter.resourceType, 'Encounter')
  assert.equal(fixture.encounter.status, 'in-progress')
  assert.equal(fixture.condition.resourceType, 'Condition')
  assert.equal(fixture.condition.subject.reference, fixture.encounter.subject.reference)
  assert.deepEqual(fixture.updates.map(({ status }) => status), [
    FhirDemoEncounterUpdateStatusIds.Arrived,
    FhirDemoEncounterUpdateStatusIds.Triaged,
    FhirDemoEncounterUpdateStatusIds.Diagnosed,
    FhirDemoEncounterUpdateStatusIds.TreatmentInProgress,
  ])
  assert.ok(Object.isFrozen(fixture))
  assert.ok(Object.isFrozen(fixture.updates))
})

test('keeps product authorization and family relationships outside the neutral fixture', () => {
  const serialized = JSON.stringify(FHIR_DEMO_ARM_FRACTURE_ENCOUNTER_JOURNEY)

  assert.doesNotMatch(serialized, /SOSChain|controller|permission|emergency contact/i)
})
