// Flow contract: explicit R4 document inspection reports basic structural issues and resolves display names through documented compatibility aliases without mutating input or asserting identity, signatures or complete schema validity.
import assert from 'node:assert/strict'
import test from 'node:test'
import {spawnSync} from 'node:child_process'
import {fileURLToPath} from 'node:url'
const api=()=>import('../dist/document-bundle-r4.js')
const patient=(id,name)=>({fullUrl:`urn:uuid:${id}`,resource:{resourceType:'Patient',id,name}})
const document=(reference,patients)=>({resourceType:'Bundle',type:'document',entry:[{resource:{resourceType:'Composition',subject:{reference}}},...patients]})
const first=()=>patient('synthetic-first',[{use:'official',text:'First synthetic patient'}])
const second=()=>patient('synthetic-second',[{use:'usual',text:'Usual synthetic name'},{use:'official',text:'  Synthetic caf\u00e9 \u6c34  '}])

test('reports all four basic structure issues in stable order and accepts Composition-first documents',async()=>{
 const {validateR4DocumentBundleStructure:validate}=await api()
 const issues=['Bundle.resourceType must be Bundle.','Bundle.type must be document.','Bundle.entry must contain at least one entry.','Bundle.entry[0].resource must be Composition.']
 for(const input of [undefined,null,42,'document',[],{}])assert.deepEqual(validate(input),{ok:false,issues})
 assert.deepEqual(validate({resourceType:'Bundle',type:'collection',entry:[{resource:{resourceType:'Patient'}}]}),{ok:false,issues:[issues[1],issues[3]]})
 assert.deepEqual(validate(document('Patient/synthetic-first',[first()])),{ok:true,issues:[]})
 // The helper intentionally does not validate required Composition clinical/schema fields.
 assert.deepEqual(validate({resourceType:'Bundle',type:'document',entry:[{resource:{resourceType:'Composition'}}]}),{ok:true,issues:[]})
})

test('selects the referenced Patient among multiple entries using each documented reference alias',async()=>{
 const {getR4DocumentBundlePatientFullName:name}=await api()
 for(const reference of ['urn:uuid:synthetic-second','Patient/synthetic-second','synthetic-second','https://example.invalid/fhir/Patient/synthetic-second']){
  assert.equal(name(document(reference,[first(),second()])),'Synthetic caf\u00e9 \u6c34')
 }
 const target=second();target.fullUrl='https://example.invalid/fhir/Patient/synthetic-second'
 assert.equal(name(document('Patient/synthetic-second',[first(),target])),'Synthetic caf\u00e9 \u6c34')
})

test('keeps explicit first-Patient compatibility fallback without treating a name as identity',async()=>{
 const {getR4DocumentBundlePatientFullName:name}=await api()
 for(const reference of [undefined,'','Patient/not-present'])assert.equal(name(document(reference,[first(),second()])),'First synthetic patient')
 const emptyReferenced=patient('synthetic-second',[])
 assert.equal(name(document('Patient/synthetic-second',[first(),emptyReferenced])),undefined)
 assert.equal(name(document('Patient/synthetic-first',[])),undefined)
})

test('preserves official then usual then first name preference, text and ordered name parts',async()=>{
 const {getR4DocumentBundlePatientFullName:name}=await api()
 const extract=names=>name(document('Patient/synthetic-first',[patient('synthetic-first',names)]))
 assert.equal(extract([{text:'First'},{use:'usual',text:'Usual'},{use:'official',prefix:[' Dr. '],given:['Synthetic','\u6c34'],family:'Garc\u00eda',suffix:[' III ']}]),'Dr. Synthetic \u6c34 Garc\u00eda III')
 assert.equal(extract([{text:'First'},{use:'usual',text:' Usual name '}]),'Usual name')
 assert.equal(extract([{text:' First name '},{text:'Second name'}]),'First name')
 assert.equal(extract([{use:'official',text:'\tText wins\n',given:['Unused'],family:'Unused'}]),'Text wins')
 assert.equal(extract([{use:'official',text:' ',given:['Synthetic'],family:'Patient'}]),'Synthetic Patient')
 assert.equal(extract([{use:'official'}]),undefined)
})

test('handles absent or malformed names/entries without generic schema fallback or input changes',async()=>{
 const {getR4DocumentBundlePatientFullName:name,validateR4DocumentBundleStructure:validate}=await api()
 for(const input of [undefined,null,42,[],{}, {entry:[null,42,{resource:{resourceType:'Patient',name:'not-an-array'}}]}, {entry:[{resource:{resourceType:'Composition'}},{resource:{resourceType:'Patient',name:[null,42,{text:42,given:[{}]}]}}]}])assert.equal(name(input),undefined)
 const input=document('Patient/synthetic-second',[first(),second()]),before=structuredClone(input)
 const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value)}return value}
 freeze(input)
 assert.equal(name(input),'Synthetic caf\u00e9 \u6c34');assert.equal(validate(input).ok,true);assert.deepEqual(input,before)
})

test('public root and subpath resolve the same inspection functions',async()=>{
 const root=await import('../dist/index.js'),leaf=await api(),publicLeaf=await import('fhir-data-utils-ts/document-bundle-r4')
 assert.equal(root.validateR4DocumentBundleStructure,leaf.validateR4DocumentBundleStructure)
 assert.equal(publicLeaf.getR4DocumentBundlePatientFullName,leaf.getR4DocumentBundlePatientFullName)
})

test('public inspection types keep optional names, readonly issues and absent identity authority',()=>{
 const result=spawnSync(process.execPath,[fileURLToPath(new URL('../node_modules/typescript/bin/tsc',import.meta.url)),'--noEmit','--strict','--skipLibCheck','--module','NodeNext','--moduleResolution','NodeNext','--target','ES2022',fileURLToPath(new URL('./fixtures/document-bundle-r4-consumer.ts',import.meta.url))],{encoding:'utf8'})
 assert.equal(result.error,undefined);assert.equal(result.status,0,result.stdout+result.stderr)
})
