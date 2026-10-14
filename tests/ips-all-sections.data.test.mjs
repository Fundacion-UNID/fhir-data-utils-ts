// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import assert from 'node:assert/strict'
import test from 'node:test'
import { FHIR_IPS_ALL_SECTIONS_DEMO_DATA } from '../dist/data/index.js'

test('exports one repository-safe IPS document covering all sixteen clinical sections', () => {
  const fixture = FHIR_IPS_ALL_SECTIONS_DEMO_DATA
  const composition = fixture.bundle.entry.find(({ resource }) => resource.resourceType === 'Composition')?.resource

  assert.equal(fixture.subject.familyName, 'Doe')
  assert.equal(composition?.section?.length, 16)
  assert.equal(new Set(composition?.section?.map(({ code }) => code.coding[0].code)).size, 16)
  assert.ok(fixture.bundle.entry.some(({ resource }) => resource.resourceType === 'AllergyIntolerance'))
  assert.ok(fixture.bundle.entry.some(({ resource }) => resource.resourceType === 'MedicationStatement'))
  assert.ok(fixture.bundle.entry.some(({ resource }) => resource.resourceType === 'Immunization'))
  assert.ok(fixture.bundle.entry.some(({ resource }) => resource.resourceType === 'Observation'))
  assert.ok(fixture.bundle.entry.some(({ resource }) => resource.resourceType === 'CarePlan'))
  assert.doesNotMatch(JSON.stringify(fixture), /"(?:phone|telecom)"/i)
})
