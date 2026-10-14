// Flow contract: services exchange canonical flat SearchParameter claim names and derive implementation coordinates from governed definitions.
import assert from 'node:assert/strict'
import test from 'node:test'
import { defineFlatSearchParameter, legacyFieldCoordinates } from '../dist/search-parameters.js'

test('defines one canonical claim and derives legacy coordinates without accepting them from a client', () => {
  const definition = defineFlatSearchParameter({
    claim: 'Immunization.vaccine-code',
    resourceType: 'Immunization',
    elementPath: 'Immunization.vaccineCode',
    type: 'token',
  })
  assert.deepEqual(legacyFieldCoordinates(definition), { resourceType: 'Immunization', field: 'vaccineCode' })
  assert.equal(definition.claim, 'Immunization.vaccine-code')
})
