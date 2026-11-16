// Flow contract: the explicitly selected indexed R4 semantic profile preserves recorded stored claims, parent Observation component columns and business identifiers without a generic fallback, native R5 claim or authority from embedded metadata.
import assert from 'node:assert/strict'
import test from 'node:test'
import {readFileSync} from 'node:fs'
import {spawnSync} from 'node:child_process'
import {fileURLToPath} from 'node:url'
import * as fhir from '../dist/index.js'
const fixture=JSON.parse(readFileSync(new URL('./fixtures/indexed-r4-recorded-wire.json',import.meta.url),'utf8'))
const api=()=>import('../dist/converters/indexed-r4-profile.js')
const options=Object.freeze({profile:'indexed-r4-semantic'})
const plain=value=>JSON.parse(JSON.stringify(value))

for(const type of fixture.incoming)test(`indexed semantic import preserves recorded ${type} stored claims`,async()=>{
 const p=await api(),row=fixture.rows.find(item=>item.resourceType===type),before=structuredClone(row.input)
 assert.deepEqual(plain(p.indexedR4ResourceToClaims(row.input,options)),row.claims)
 assert.deepEqual(row.input,before)
})
for(const type of fixture.outgoing)test(`indexed semantic export preserves recorded ${type} native compatibility`,async()=>{
 const p=await api(),row=fixture.rows.find(item=>item.resourceType===type),before=structuredClone(row.claims)
 assert.deepEqual(plain(p.indexedR4ClaimsToResource(type,row.claims,options)),row.native)
 assert.deepEqual(row.claims,before)
})

test('the parent Observation profile keeps aligned JSON component cells rather than creating child resources',async()=>{
 const p=await api(),O=fhir.ObservationClaim,source=structuredClone(fixture.components.input)
 const before=structuredClone(source),claims=p.indexedR4ResourceToClaims(source,options)
 assert.deepEqual(plain(claims),fixture.components.claims)
 assert.deepEqual(JSON.parse(claims[O.ComponentCode]),source.component.map(item=>`${item.code.coding[0].system}|${item.code.coding[0].code}`))
 assert.deepEqual(JSON.parse(claims[O.ComponentCodeDisplay]),['Synthetic systolic, seated','','Synthetic temperature'])
 assert.deepEqual(JSON.parse(claims[O.ComponentValueQuantityNumber]),['120','0',''])
 assert.deepEqual(JSON.parse(claims[O.ComponentValueQuantityUnit]),[`${fhir.FhirCodeSystem.Ucum}|mm[Hg]`,'Synthetic unit',''])
 const projected=p.indexedR4ClaimsToResource('Observation',claims,options)
 assert.deepEqual(plain(projected),fixture.components.native)
 assert.equal(projected.component.length,3);assert.equal(projected.component[1].valueQuantity.value,0)
 assert.equal(projected.component[2].valueQuantity,undefined)
 assert.equal(projected.hasMember,undefined);assert.equal(Array.isArray(claims),false)
 assert.deepEqual(source,before)
 for(const bad of ['not-json',JSON.stringify(['one'])])assert.throws(()=>p.indexedR4ClaimsToResource('Observation',{...claims,[O.ComponentCodeDisplay]:bad},options),/component/i)
 assert.throws(()=>p.indexedR4ResourceToClaims({...source,component:[{code:source.component[0].code,valueString:'Unsupported component value'}]},options),/component/i)
})

test('preserves multiple coding identities while keeping a primary business identifier separate from internal id',async()=>{
 const p=await api()
 for(const type of fixture.incoming){
  const source=structuredClone(fixture.rows.find(row=>row.resourceType===type).input)
  source.identifier=[{system:'urn:synthetic:business-identifiers',value:'synthetic-business-id'},{value:'unused-secondary-id'}]
  const claims=p.indexedR4ResourceToClaims(source,options)
  assert.equal(claims[`${type}.identifier`],'urn:synthetic:business-identifiers|synthetic-business-id')
  assert.notEqual(claims[`${type}.identifier`],source.id)
  const absent={...source,identifier:undefined}
  assert.equal(p.indexedR4ResourceToClaims(absent,options)[`${type}.identifier`],undefined)
  if(fixture.outgoing.includes(type))assert.deepEqual(p.indexedR4ClaimsToResource(type,claims,options).identifier,[source.identifier[0]])
 }
 for(const [type,key] of [['Observation','code'],['Condition','code'],['AllergyIntolerance','code'],['MedicationStatement','medicationCodeableConcept'],['Immunization','vaccineCode'],['DiagnosticReport','code'],['Procedure','code'],['DocumentReference','type']]){
  const source=structuredClone(fixture.rows.find(row=>row.resourceType===type).input)
  source[key]={coding:[{system:fhir.FhirCodeSystem.Loinc,code:'synthetic-a'},{system:fhir.FhirCodeSystem.Ucum,code:'synthetic-b'}],text:'Synthetic concept text'}
  const projected=p.indexedR4ClaimsToResource(type,p.indexedR4ResourceToClaims(source,options),options)
  assert.deepEqual(projected[key].coding.map(({system,code})=>({system,code})),source[key].coding)
 }
 for(const [type,key] of [['CarePlan','category'],['Consent','category'],['Flag','category'],['DeviceUseStatement','reasonCode']]){
  const source=structuredClone(fixture.rows.find(row=>row.resourceType===type).input)
  source[key]=[{coding:[{system:fhir.FhirCodeSystem.Loinc,code:'synthetic-a'},{system:fhir.FhirCodeSystem.Ucum,code:'synthetic-b'}]}]
  const projected=p.indexedR4ClaimsToResource(type,p.indexedR4ResourceToClaims(source,options),options)
  assert.deepEqual(projected[key][0].coding.map(({system,code})=>({system,code})),source[key][0].coding)
 }
})

test('keeps medication dose unit text separate from coded quantity and reads historical coded units',async()=>{
 const p=await api(),source=structuredClone(fixture.rows.find(row=>row.resourceType==='MedicationStatement').input),M=fhir.MedicationStatementClaim
 source.dosage=[{text:'Synthetic dose instruction',doseAndRate:[{doseQuantity:{value:1,unit:'tablet',system:fhir.FhirCodeSystem.Ucum,code:'{tbl}'}}]}]
 const claims=p.indexedR4ResourceToClaims(source,options),projected=p.indexedR4ClaimsToResource('MedicationStatement',claims,options)
 assert.deepEqual(projected.dosage[0].doseAndRate[0].doseQuantity,source.dosage[0].doseAndRate[0].doseQuantity)
 const legacy={...claims,[M.DoseQuantityUnit]:`${fhir.FhirCodeSystem.Ucum}|{tbl}`}
 delete legacy[fhir.MedicationStatementClaimsFhirApiExtended.DoseQuantity]
 assert.equal(p.indexedR4ClaimsToResource('MedicationStatement',legacy,options).dosage[0].doseAndRate[0].doseQuantity.code,'{tbl}')
})

test('keeps uncoded native concept text separate from an invented code identity',async()=>{
 const p=await api(),source=structuredClone(fixture.rows.find(row=>row.resourceType==='AllergyIntolerance').input)
 source.code={text:'Synthetic uncoded finding'}
 const claims=p.indexedR4ResourceToClaims(source,options)
 assert.equal(claims[fhir.AllergyIntoleranceClaim.Code],undefined)
 assert.equal(claims[fhir.AllergyIntoleranceClaim.CodeText],source.code.text)
 const projected=p.indexedR4ClaimsToResource('AllergyIntolerance',claims,options)
 assert.deepEqual(projected.code,{text:source.code.text})
})

test('semantic namespace/profile boundaries reject versions, unknown types and silent structural fallback',async()=>{
 const p=await api(),row=fixture.rows.find(item=>item.resourceType==='Observation')
 for(const context of ['org.hl7.fhir.r4','org.hl7.fhir.r5','foreign']){
  assert.throws(()=>p.indexedR4ResourceToClaims(row.input,{...options,context}),/context/i)
  assert.throws(()=>p.indexedR4ClaimsToResource('Observation',{...row.claims,'@context':context},options),/context/i)
 }
 assert.throws(()=>p.indexedR4ClaimsToResource('Observation',{'org.hl7.fhir.r5.Observation.status':'final'},options),/context|namespace/i)
 assert.throws(()=>p.indexedR4ResourceToClaims(row.input,{profile:'indexed-r5-semantic'}),/profile/i)
 for(const type of ['ImagingStudy','ImmunizationRecommendation','Medication','EncounterHistory','AdverseEvent','Goal','Patient'])assert.throws(()=>p.indexedR4ResourceToClaims({resourceType:type},options),/unsupported/i)
 assert.throws(()=>p.indexedR4ClaimsToResource('Encounter',{},options),/unsupported/i)
 const resource={...row.input,meta:{claims:{[fhir.ObservationClaim.Subject]:'Patient/foreign','@context':'foreign'}}}
 assert.equal(p.indexedR4ResourceToClaims(resource,options)[fhir.ObservationClaim.Subject],row.claims[fhir.ObservationClaim.Subject])
 const foreignComposition={...row.claims,[fhir.CompositionClaim.Subject]:'Patient/foreign'}
 assert.equal(p.indexedR4ClaimsToResource('Observation',foreignComposition,options).subject.reference,row.input.subject.reference)
})

test('only an explicit structural compatibility profile admits its five historical families',async()=>{
 const p=await api(),profile={profile:'indexed-structural-compat-v1'}
 for(const type of ['ImagingStudy','ImmunizationRecommendation','Medication','EncounterHistory','AdverseEvent']){
  const source={resourceType:type,id:'synthetic-structural',active:true,custom:{value:42},meta:{claims:{untrusted:'not-projected'}}},before=structuredClone(source)
  const claims=p.indexedStructuralResourceToClaims(source,profile)
  const projected=p.indexedStructuralClaimsToResource(type,claims,profile)
  assert.deepEqual(projected,{resourceType:type,id:source.id,active:true,custom:{value:42}})
  assert.deepEqual(source,before)
 }
 assert.throws(()=>p.indexedStructuralResourceToClaims({resourceType:'Observation'},profile),/unsupported/i)
 assert.throws(()=>p.indexedStructuralResourceToClaims({resourceType:'Medication'},options),/profile/i)
})

test('document support is a separate explicit profile for proven composition and demographic/provenance entries',async()=>{
 const p=await api(),profile={profile:'document-support-r4-v1'}
 for(const type of ['Patient','Practitioner','Organization','PractitionerRole','Composition']){
  const source=type==='Composition'?fixture.rows.find(item=>item.resourceType===type).input:{resourceType:type,id:'synthetic-support',identifier:[{value:'synthetic-support-business'}]}
  const before=structuredClone(source),claims=p.documentSupportResourceToClaims(source,profile)
  assert.equal(claims['@context'],'org.hl7.fhir.api');assert.deepEqual(source,before)
 }
 assert.throws(()=>p.documentSupportResourceToClaims({resourceType:'Goal'},profile),/unsupported/i)
})

test('public root and leaf resolve the same explicitly owned functions',async()=>{
 const p=await api(),root=await import('../dist/index.js'),leaf=await import('fhir-data-utils-ts/indexed-r4')
 assert.equal(root.indexedR4ResourceToClaims,p.indexedR4ResourceToClaims);assert.equal(leaf.indexedStructuralResourceToClaims,p.indexedStructuralResourceToClaims)
})

test('typed consumers keep semantic, structural and supporting unions explicit',()=>{
 const result=spawnSync(process.execPath,[fileURLToPath(new URL('../node_modules/typescript/bin/tsc',import.meta.url)),'--noEmit','--strict','--skipLibCheck','--module','NodeNext','--moduleResolution','NodeNext','--target','ES2022',fileURLToPath(new URL('./fixtures/indexed-r4-consumer.ts',import.meta.url))],{encoding:'utf8'})
 assert.equal(result.error,undefined);assert.equal(result.status,0,result.stdout+result.stderr)
})
