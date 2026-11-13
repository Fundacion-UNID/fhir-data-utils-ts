// Flow contract: clinical vocabulary and deterministic FHIR canonicalization remain in the neutral standards package, without occupation catalogs or downstream dependencies.
import assert from 'node:assert/strict'
import test from 'node:test'
import * as fhir from '../dist/index.js'

test('owns the IPS document code independently of its clinical section codes',()=>{
  assert.equal(fhir.FHIR_IPS_DOCUMENT_CODE,'60591-5')
  assert.equal(Object.values(fhir.FHIR_IPS_SECTION_CODES).includes(fhir.FHIR_IPS_DOCUMENT_CODE),false)
})

test('canonicalizes keys while preserving significant array order and the input',()=>{
  assert.equal(typeof fhir.canonicalizeFhirResource,'function')
  const input={resourceType:'Patient',id:'root',meta:{versionId:'old',source:'source'},name:[{id:'name',text:'Z'},{text:'A'}]}
  const canonical=fhir.canonicalizeFhirResource(input)
  assert.equal(canonical,'{"id":"root","meta":{"source":"source"},"name":[{"id":"name","text":"Z"},{"text":"A"}],"resourceType":"Patient"}')
  assert.equal(input.meta.versionId,'old')
  const minimized=JSON.parse(fhir.canonicalizeFhirResource({...input,text:{status:'generated'}},{stripNestedElementIds:true,stripNarrativeText:true}))
  assert.equal(minimized.id,'root')
  assert.equal(minimized.name[0].id,undefined)
  assert.equal(minimized.text,undefined)
  assert.equal(JSON.parse(fhir.canonicalizeFhirResource(input,{stripMetaVersionId:false})).meta.versionId,'old')
})

test('keeps functional RelatedPerson coding systems explicit without granting authority',()=>{
  assert.ok(Array.isArray(fhir.HL7_RELATED_PERSON_FUNCTIONAL_ROLES))
  const contact=fhir.HL7_RELATED_PERSON_FUNCTIONAL_ROLES.find(role=>role.code==='ECON')
  const representative=fhir.HL7_RELATED_PERSON_FUNCTIONAL_ROLES.find(role=>role.code==='RESPRSN')
  assert.equal(contact.codingSystem,'http://terminology.hl7.org/CodeSystem/v3-RoleClass')
  assert.equal(representative.codingSystem,'http://terminology.hl7.org/CodeSystem/v3-RoleCode')
  assert.equal(Object.hasOwn(representative,'authorized'),false)
})
