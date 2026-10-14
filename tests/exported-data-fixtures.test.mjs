// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const packageManifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))

test('exports reusable data fixtures through an explicit data subpath', async () => {
  const data = await import('../dist/data/index.js')
  assert.ok(data.FHIR_APPOINTMENT_COMMUNICATION_TEST_DATA)
  assert.ok(data.FHIR_ENCOUNTER_TRANSFER_TEST_DATA)
  assert.deepEqual(Object.keys(data.FHIR_IPS_CLINICAL_ARTIFACT_SCHEMAS), [
    'AllergyIntolerance',
    'MedicationStatement',
    'Immunization',
    'Condition',
    'Procedure',
    'Observation',
  ])
  const composition = data.FHIR_IPS_ALL_SECTIONS_DEMO_DATA.bundle.entry[0].resource
  const sectionCodes = new Set(composition.section.map((section) => section.code.coding[0].code))
  for (const schema of Object.values(data.FHIR_IPS_CLINICAL_ARTIFACT_SCHEMAS)) {
    assert.ok(schema.requiredClaims.length >= 2)
    assert.ok(schema.terminologyTextClaims.length >= 1)
    assert.ok(schema.requiredClaims.every((claim) => claim.startsWith(`${schema.resourceType}.`)))
    assert.ok(sectionCodes.has(schema.sectionCode))
  }
  assert.equal(packageManifest.exports['./data'].default, './dist/data/index.js')
})

test('excludes data-only modules explicitly from executable coverage', () => {
  assert.match(packageManifest.scripts['test:coverage'], /--test-coverage-exclude='dist\/\*\*\/\*\.data\.js'/)
})
