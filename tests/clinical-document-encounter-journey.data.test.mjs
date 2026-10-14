// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  FHIR_CLINICAL_DOCUMENT_ENCOUNTER_JOURNEY_TEST_DATA,
  ResourceTypesFhirR5,
} from '../dist/index.js'

test('exports documents rooted in Composition with resolvable Encounter context and a navigable care hierarchy', () => {
  const fixture = FHIR_CLINICAL_DOCUMENT_ENCOUNTER_JOURNEY_TEST_DATA
  assert.equal(fixture.documents.length, fixture.documentCount)
  assert.equal(fixture.encounters.length, fixture.encounterCount)

  for (const bundle of fixture.documents) {
    // These exact values are the FHIR document invariant under test.
    assert.equal(bundle.type, 'document')
    assert.equal(bundle.entry[0].resource.resourceType, ResourceTypesFhirR5.Composition)
    const composition = bundle.entry[0].resource
    const encounterReference = composition.encounter.reference
    assert.ok(bundle.entry.some(entry => entry.fullUrl === encounterReference && entry.resource.resourceType === ResourceTypesFhirR5.Encounter))
    assert.ok(composition.type.text || composition.type.coding?.[0]?.display)
  }

  const encounterReferences = new Set(fixture.encounters.map(encounter => `Encounter/${encounter.id}`))
  assert.ok(fixture.encounters.every(encounter => encounter.subject.reference === fixture.subject.reference))
  assert.ok(fixture.encounters.filter(encounter => encounter.partOf).every(encounter => encounterReferences.has(encounter.partOf.reference)))
})
