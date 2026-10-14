// Flow contract: every documented package subpath must resolve from the built publishable package.
import assert from 'node:assert/strict'
import test from 'node:test'

const PUBLIC_SUBPATHS = Object.freeze([
  'claims',
  'claim-helpers',
  'converters',
  'care-emergency-alert',
  'fhir-types',
  'fhir-values',
  'fhir-search-parameters',
  'fhir-bundle',
  'fhir-tokens',
  'related-person',
  'search-models',
  'terminology-models',
  'clinical-terminology',
  'builders',
  'builders/immunization',
  'immunization-flat-claims',
  'immunization-reminder-plan',
  'group-r5',
  'healthcare-service-specialty-map',
  'research-study-r5',
  'imaging-types',
  'constants',
])

test('resolves every stable public subpath through package exports', async () => {
  for (const subpath of PUBLIC_SUBPATHS) {
    const module = await import(`fhir-data-utils-ts/${subpath}`)
    assert.ok(module, `unresolved public subpath: ${subpath}`)
  }
})
