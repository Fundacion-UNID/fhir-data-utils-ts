// Flow contract: explicit R4 document ancillary families retain recorded converter semantics and business identity without a generic fallback or authority from imported claims.
import assert from 'node:assert/strict'
import test from 'node:test'
import {readFileSync} from 'node:fs'
import {spawnSync} from 'node:child_process'
import {fileURLToPath} from 'node:url'
import * as fhir from '../dist/index.js'
const fixture=()=>JSON.parse(readFileSync(new URL('./fixtures/document-ancillary-recorded-wire.json',import.meta.url),'utf8'))
const options={profile:'document-support-r4-v1'}
const plain=value=>JSON.parse(JSON.stringify(value))
for(const type of ['Device','Location','Coverage','Appointment','AppointmentResponse'])test(`explicit document profile preserves recorded ${type} native projection and business token`,()=>{
 const row=fixture().rows.find(row=>row.resourceType===type),before=structuredClone(row.input)
 const claims=plain(fhir.documentSupportResourceToClaims(row.input,options))
 const expected={...row.legacyClaims}
 delete expected[`${type}.custom`]
 expected[`${type}.identifier`]=`${row.input.identifier[0].system}|${row.input.identifier[0].value}`
 // Existing owned converters retain zero coordinates and explicit scheduling search fields
 // that the recorded predecessor omitted; retain and assert those additive values.
 if(type==='Location')Object.assign(expected,{[fhir.LocationClaim.PositionLatitude]:'0',[fhir.LocationClaim.PositionLongitude]:'0'})
 if(type==='Appointment')Object.assign(expected,{[fhir.AppointmentClaim.Date]:row.input.start,[fhir.AppointmentClaim.Location]:'Location/synthetic-location',[fhir.AppointmentClaim.Patient]:'Patient/synthetic-document-patient'})
 assert.deepEqual(claims,expected)
 assert.deepEqual(row.input,before)
 assert.notEqual(claims[`${type}.identifier`],row.input.id)
 const withSource={...row.input,meta:{claims:{[`${type}.identifier`]:'untrusted-override'}}}
 assert.equal(fhir.documentSupportResourceToClaims(withSource,options)[`${type}.identifier`],expected[`${type}.identifier`])
 const missing={...row.input};delete missing.identifier
 assert.equal(fhir.documentSupportResourceToClaims(missing,options)[`${type}.identifier`],undefined)
})
test('document-only ancillary admission leaves GW semantic and structural families unchanged',()=>{
 assert.equal(fhir.DocumentSupportInputTypes.length,10)
 assert.equal(fhir.IndexedR4SemanticInputTypes.length,14)
 for(const row of fixture().rows){
  assert.throws(()=>fhir.indexedR4ResourceToClaims(row.input,{profile:'indexed-r4-semantic'}),/unsupported/)
  assert.throws(()=>fhir.documentSupportResourceToClaims(row.input,{profile:'indexed-r4-semantic'}),/profile/)
 }
 assert.throws(()=>fhir.documentSupportResourceToClaims({resourceType:'Goal'},options),/unsupported/)
})
test('root and indexed leaf expose the same document profile with typed five-family admission',async()=>{
 const leaf=await import('../dist/converters/indexed-r4-profile.js')
 assert.equal(leaf.documentSupportResourceToClaims,fhir.documentSupportResourceToClaims)
 const result=spawnSync(process.execPath,['node_modules/typescript/bin/tsc','--noEmit','--strict','--skipLibCheck','--target','ES2022','--module','NodeNext','--moduleResolution','NodeNext',fileURLToPath(new URL('./fixtures/document-ancillary-consumer.ts',import.meta.url))],{encoding:'utf8'})
 assert.equal(result.status,0,result.stdout+result.stderr)
})
