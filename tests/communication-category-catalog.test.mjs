// Flow contract: FHIR owns standard Communication category codings; consumers receive explicit systems and codes without transport or authorization behavior.
import assert from 'node:assert/strict'
import test from 'node:test'
import * as fhir from '../dist/index.js'

test('exports the four standard Communication categories with immutable coding tokens',()=>{
  assert.equal(typeof fhir.CommunicationCategoryCodes,'object')
  assert.deepEqual(Object.values(fhir.CommunicationCategoryCodes).map(value=>value.code).sort(),['alert','instruction','notification','reminder'])
  for(const category of Object.values(fhir.CommunicationCategoryCodes)){
    assert.equal(category.system,fhir.FhirCodeSystems.CommunicationCategory)
    assert.equal(category.attributeValue,`${category.system}|${category.code}`)
    assert.equal(category.claim,category.attributeValue)
    assert.equal(Object.isFrozen(category),true)
  }
})
