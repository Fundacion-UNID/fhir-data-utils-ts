// Flow contract: active HL7 relationship and representative codes remain standard descriptive data, separate from occupation catalogs and authorization evidence.
import test from 'node:test'
import assert from 'node:assert/strict'
import * as fhir from '../dist/index.js'

test('exposes active personal relationships with their actual RoleCode system', () => {
  assert.equal(Array.isArray(fhir.HL7_PERSONAL_RELATIONSHIP_ROLES), true)
  const entries = fhir.HL7_PERSONAL_RELATIONSHIP_ROLES
  assert.equal(fhir.HL7_ROLE_CODE_VERSION, '4.0.0')
  assert.equal(fhir.HL7_PERSONAL_RELATIONSHIP_VALUE_SET, 'http://terminology.hl7.org/ValueSet/v3-PersonalRelationshipRoleType')
  const codes = new Set(entries.map(entry => entry.code))
  assert.equal(codes.size, entries.length)
  for (const code of ['ONESELF', 'MTH', 'FTH', 'SPS', 'CHILD']) assert.equal(codes.has(code), true)
  for (const code of ['MTHINLOAW', 'SISLINLAW', 'CAREGIVER', 'ECON', 'RESPRSN']) assert.equal(codes.has(code), false)
  assert.equal(Object.isFrozen(entries), true)
  for (const entry of entries) {
    assert.equal(entry.codingSystem, fhir.HL7_CODING_SYSTEM_V3_ROLE_CODE)
    assert.equal(Object.isFrozen(entry), true)
    assert.equal(typeof entry.display, 'string')
    assert.equal(Object.hasOwn(entry, 'authorized'), false)
  }
})

test('keeps representative descriptors separate without implying a legal grant', () => {
  assert.equal(Array.isArray(fhir.HL7_V3_ROLE_CODE_LEGAL_REPRESENTATIVE), true)
  const entries = fhir.HL7_V3_ROLE_CODE_LEGAL_REPRESENTATIVE
  assert.deepEqual(entries.map(entry => entry.code), ['RESPRSN', 'GUARD', 'GUADLTM', 'POWATT', 'DPOWATT'])
  for (const entry of entries) {
    assert.equal(entry.codingSystem, fhir.HL7_CODING_SYSTEM_V3_ROLE_CODE)
    assert.equal(Object.isFrozen(entry), true)
    assert.equal(Object.hasOwn(entry, 'authorized'), false)
  }
})
