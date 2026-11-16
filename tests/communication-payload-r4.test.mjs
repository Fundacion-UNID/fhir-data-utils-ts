// Flow contract: Communication R4 payload parts preserve exact body bytes and typed references/attachments without conflating Narrative, notes or R5 coding; a declared aggregate profile retains multipart order or rejects loss.
import test from 'node:test'
import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {fileURLToPath} from 'node:url'
import * as fhir from '../dist/index.js'
const C=fhir.CommunicationClaim
const body='  Synthetic message, caf\u00e9\n\u6c34 and another line\n  '
const reference=fhir.FHIR_APPOINTMENT_COMMUNICATION_TEST_DATA.appointmentReference
const attachment=fhir.FHIR_APPOINTMENT_COMMUNICATION_TEST_DATA.communication.payload[0].contentAttachment
const api=()=>import('../dist/converters/convert-communication-payload.js')

test('owns a payload-string claim while retaining the independent Narrative and note wire keys',()=>{
 assert.equal(C.ContentString,'Communication.content-string')
 assert.notEqual(C.ContentString,C.Text);assert.notEqual(C.ContentString,C.NoteText)
})

test('round-trips one Unicode body without trimming, comma splitting or changing the input',async()=>{
 const p=await api(),claims=Object.freeze({[C.ContentString]:body,[C.Text]:'Narrative only',[C.NoteText]:'A separate note'})
 const native=p.communicationPayloadItemFlatToFhirR4(claims)
 assert.deepEqual(native,{contentString:body})
 assert.deepEqual(p.communicationPayloadItemFhirR4ToFlat(native),{[C.ContentString]:body})
 assert.equal(Object.isFrozen(native),true)
 for(const text of ['Synthetic\r\nline', '\tSynthetic \ud83d\ude00'])assert.equal(p.communicationPayloadItemFlatToFhirR4({[C.ContentString]:text}).contentString,text)
 assert.equal(claims[C.Text],'Narrative only');assert.equal(claims[C.NoteText],'A separate note')
 assert.equal(p.communicationPayloadItemFlatToFhirR4({[C.Text]:'Narrative only',[C.NoteText]:'A separate note'}),undefined)
})

test('round-trips the existing reference and reusable attachment fields separately',async()=>{
 const p=await api()
 for(const native of [{contentReference:{reference}},{contentAttachment:attachment}]){
  const before=structuredClone(native),claims=p.communicationPayloadItemFhirR4ToFlat(native)
  assert.deepEqual(p.communicationPayloadItemFlatToFhirR4(claims),native)
  assert.deepEqual(native,before)
 }
 const urlOnly={contentAttachment:{url:'https://example.invalid/attachment',title:'Synthetic title'}}
 assert.deepEqual(p.communicationPayloadItemFlatToFhirR4(p.communicationPayloadItemFhirR4ToFlat(urlOnly)),urlOnly)
})

test('the declared aggregate profile supports body then ordered references then attachment without loss',async()=>{
 const p=await api(),second=fhir.FHIR_APPOINTMENT_COMMUNICATION_TEST_DATA.recipientReference
 const native=[{contentString:body},{contentReference:{reference}},{contentReference:{reference:second}},{contentAttachment:attachment}]
 const claims=p.communicationPayloadProfileFhirR4ToFlat(native)
 assert.equal(claims[C.ContentString],body)
 assert.equal(claims[C.ContentReference],[reference,second].join(','))
 assert.deepEqual(p.communicationPayloadProfileFlatToFhirR4(claims),native)
 const textAndBundle=[{contentString:body},{contentReference:{reference:'Bundle/synthetic-message'}}]
 assert.deepEqual(p.communicationPayloadProfileFlatToFhirR4(p.communicationPayloadProfileFhirR4ToFlat(textAndBundle)),textAndBundle)
 assert.equal(Object.isFrozen(p.communicationPayloadProfileFlatToFhirR4(claims)),true)
 assert.throws(()=>p.communicationPayloadProfileFhirR4ToFlat({}),TypeError)
 assert.equal(p.communicationPayloadProfileFlatToFhirR4({}),undefined)
 assert.deepEqual(p.communicationPayloadProfileFhirR4ToFlat(undefined),{})
 assert.deepEqual(p.communicationPayloadProfileFhirR4ToFlat([]),{})
})

test('rejects conflicting choices, duplicate scalar parts and unrepresentable multipart order',async()=>{
 const p=await api()
 for(const native of [{},{contentString:body,contentReference:{reference}},{contentString:3},null,{contentAttachment:{}},{contentReference:{}},{contentReference:{display:'Synthetic'}}])assert.throws(()=>p.communicationPayloadItemFhirR4ToFlat(native),TypeError)
 assert.throws(()=>p.communicationPayloadItemFlatToFhirR4({[C.ContentString]:body,[C.ContentReference]:reference}),TypeError)
 assert.throws(()=>p.communicationPayloadItemFlatToFhirR4({[C.ContentReference]:'Patient/a,Patient/b'}),TypeError)
 for(const native of [[{contentReference:{reference}},{contentString:body}],[{contentString:body},{contentString:'Another part'}],[{contentAttachment:attachment},{contentAttachment:attachment}]])assert.throws(()=>p.communicationPayloadProfileFhirR4ToFlat(native),TypeError)
})

test('does not silently drop native fields or reinterpret R5 CodeableConcept payloads',async()=>{
 const p=await api()
 for(const native of [{contentCodeableConcept:{text:body}},{contentAttachment:{...attachment,creation:'2026-01-01'}},{contentReference:{reference,display:'Synthetic reference'}},{contentString:body,extension:[]}])assert.throws(()=>p.communicationPayloadItemFhirR4ToFlat(native),TypeError)
 assert.throws(()=>p.communicationPayloadProfileFlatToFhirR4({[C.ContentCode]:'synthetic-system|message'}),TypeError)
 assert.throws(()=>p.communicationPayloadItemFlatToFhirR4({[C.ContentString]:''}),TypeError)
 assert.throws(()=>p.communicationPayloadItemFhirR4ToFlat({contentReference:{reference:'Patient/a,Patient/b'}}),TypeError)
})

test('normalizes qualified payload keys without overwriting conflicting claims or mutating input',async()=>{
 const p=await api(),qualified='org.hl7.fhir.api.'+C.ContentString,claims=Object.freeze({[qualified]:body})
 assert.deepEqual(p.communicationPayloadItemFlatToFhirR4({...claims,'@context':'org.hl7.fhir.api',Other:'Ignored metadata'}),{contentString:body})
 assert.deepEqual(claims,{[qualified]:body})
 assert.throws(()=>p.communicationPayloadItemFlatToFhirR4({[C.ContentString]:body,[qualified]:'Conflicting body'}),TypeError)
 assert.throws(()=>p.communicationPayloadItemFlatToFhirR4({[C.ContentString]:42}),TypeError)
 assert.throws(()=>p.communicationPayloadItemFlatToFhirR4(null),TypeError)
 assert.throws(()=>p.communicationPayloadItemFlatToFhirR4({[C.ContentReference]:' Patient/a'}),TypeError)
 assert.throws(()=>p.communicationPayloadItemFlatToFhirR4({'org.hl7.fhir.r4.Communication.content-string':body}),TypeError)
})

test('public root/converters expose the same adapters and typed positive/negative consumers compile',async()=>{
 const p=await api(),publicConverters=await import('fhir-data-utils-ts/converters')
 for(const name of ['communicationPayloadItemFlatToFhirR4','communicationPayloadItemFhirR4ToFlat','communicationPayloadProfileFlatToFhirR4','communicationPayloadProfileFhirR4ToFlat']){assert.equal(fhir[name],p[name]);assert.equal(publicConverters[name],p[name])}
 execFileSync(process.execPath,[fileURLToPath(new URL('../node_modules/typescript/bin/tsc',import.meta.url)),'--noEmit','--strict','--skipLibCheck','--module','NodeNext',fileURLToPath(new URL('./fixtures/communication-payload-r4-consumer.ts',import.meta.url))],{stdio:'pipe'})
})
