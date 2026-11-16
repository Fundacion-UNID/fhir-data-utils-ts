// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import assert from 'node:assert/strict'
import test from 'node:test'
import * as f from '../dist/index.js'
const C=f.CommunicationClaim,O=f.ObservationClaim
const subject=f.FHIR_IPS_ALL_SECTIONS_DEMO_DATA.subject.reference

test('imports semantic native Communication claims, keeps existing claims and primary business identity without mutation',()=>{
 assert.equal(typeof f.normalizeClaimsFromFhirResource,'function')
 const resource={resourceType:'Communication',id:'technical-only',identifier:[{value:'business-communication'}],status:'completed',language:'es',subject:{reference:subject},payload:[{contentString:'Synthetic communication'}],meta:{claims:{[C.Subject]:subject,[C.Text]:'Preserved text'}}}
 const copy=structuredClone(resource),claims=f.normalizeClaimsFromFhirResource(resource,{identifierClaimKey:C.Identifier})
 assert.equal(claims[C.Identifier],'business-communication');assert.equal(claims[C.Text],'Preserved text');assert.equal(claims[C.Subject],subject);assert.deepEqual(resource,copy)
})
test('exports explicit R4 claims through existing converters, honors short-key precedence and rejects version namespaces',()=>{
 assert.equal(typeof f.convertClaimsToFhirResource,'function')
 const claims={'@context':'org.hl7.fhir.api',[O.Identifier]:'adapter-observation',[O.Subject]:subject,[O.Code]:f.VitalSignsCodes.BodyTemperature.claim,[O.ValueQuantityNumber]:'37.1',[O.ValueQuantityUnit]:f.VitalSignsUnits.Celsius.claim,[`org.hl7.fhir.api.${O.Status}`]:'preliminary',[O.Status]:'final','Observation.language':'es'}
 const copy=structuredClone(claims),native=f.convertClaimsToFhirResource(claims)
 assert.equal(native.resourceType,'Observation');assert.equal(native.status,'final');assert.equal(native.valueQuantity.value,37.1);assert.equal(native.language,'es');assert.deepEqual(claims,copy)
 assert.throws(()=>f.convertClaimsToFhirResource({...claims,'@context':'org.hl7.fhir.r4'}))
 assert.throws(()=>f.convertClaimsToFhirResource({...claims,'org.hl7.fhir.r5.Observation.status':'final'}))
 const unknown={resourceType:'Basic',identifier:[{value:'business-basic'}],code:{text:'Synthetic record'}}
 const imported=f.normalizeClaimsFromFhirResource(unknown,{})
 assert.equal(imported['Basic.identifier'],'business-basic')
})
test('indexes and matches typed Communication participants without treating filter matching as authority',()=>{
 assert.equal(typeof f.parseCommunicationParticipantSearchCriteria,'function')
 const projection={subject,sender:'mailto:person@example.invalid',recipients:['tel:+12025550123'],sent:'2026-01-01T00:00:00Z'}
 const criteria=f.parseCommunicationParticipantSearchCriteria({resourceType:'Parameters',parameter:[{name:'sender',valueString:'PERSON@example.invalid'},{name:'recipient',valueString:'phone:+1 (202) 555-0123'},{name:'period-start',valueString:'2025-12-31T00:00:00Z'}]})
 assert.equal(f.matchesCommunicationParticipantSearch(projection,criteria),true)
 assert.equal(f.matchesCommunicationParticipantSearch({...projection,sender:'other@example.invalid'},criteria),false)
 assert.equal(f.matchesCommunicationParticipantSearch({...projection,sent:'2025-01-01T00:00:00Z'},criteria),false)
 assert.ok(f.buildCommunicationParticipantIndexAttributes(projection).some(item=>item.name===f.CommunicationParticipantIndexNames.Sender&&item.value==='email:person@example.invalid'))
 assert.deepEqual(f.paginateCommunicationParticipantMatches(['first','second'],{page:2,count:1}),['second'])
})
test('authors a scalar vital-sign entry through owned code/unit catalogs and native converter',()=>{
 assert.equal(typeof f.buildVitalSignObservationEntry,'function')
 const entry=f.buildVitalSignObservationEntry({identifier:'vital-entry',subject,code:f.VitalSignsCodes.SystolicBloodPressure,unit:f.VitalSignsUnits.MillimeterOfMercury,valueQuantity:120,effectiveDateTime:'2026-01-01T00:00:00Z'})
 assert.equal(entry.resource.resourceType,'Observation');assert.equal(entry.resource.valueQuantity.value,120);assert.equal(entry.resource.code.coding[0].code,f.VitalSignsCodes.SystolicBloodPressure.code)
 assert.equal(entry.resource.meta.claims[O.Code],f.VitalSignsCodes.SystolicBloodPressure.claim)
 assert.equal(entry.resource.meta.claims[O.EffectiveDateTime],'2026-01-01T00:00:00Z')
 assert.equal(entry.resource.meta.claims[O.CodeSystem],undefined)
 assert.throws(()=>f.buildVitalSignObservationEntry({identifier:'vital-entry',subject,code:f.VitalSignsCodes.SystolicBloodPressure,valueQuantity:Number.NaN}))
})

test('roundtrips repeated participant controls and typed paging through native Parameters',()=>{
 assert.equal(typeof f.buildCommunicationParticipantSearchParameters,'function')
 const resource=f.buildCommunicationParticipantSearchParameters({subject,senderActorId:'mailto:person@example.invalid',recipientActorId:['tel:+12025550123'],page:2,count:1,searchParams:{[C.Category]:'notification'}})
 assert.equal(resource.resourceType,'Parameters')
 assert.ok(resource.parameter.some(parameter=>parameter.name==='page'&&parameter.valueInteger===2))
 const criteria=f.parseCommunicationParticipantSearchCriteria(resource)
 assert.equal(criteria.page,2);assert.equal(criteria.count,1)
 assert.deepEqual(criteria.senderActorIds,['email:person@example.invalid'])
 assert.deepEqual(criteria.recipientActorIds,['tel:+12025550123'])
})
