// Flow contract: the neutral reader projects native/claims-first IPS sections using canonical references, manual text and terminology identity without product policy or legacy packages.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as fhir from '../dist/index.js';

test('canonical clinical section reader resolves all sixteen FHIR-owned IPS sections',()=>{
  assert.equal(typeof fhir.toClinicalSectionViews,'function','FHIR must own the actual reader, with no legacy wrapper');
  const input=fhir.FHIR_IPS_ALL_SECTIONS_DEMO_DATA.bundle;
  const before=JSON.stringify(input);
  const sections=fhir.toClinicalSectionViews(input,{locale:'en'});
  assert.equal(sections.length,16);
  assert.ok(sections.every(section=>typeof section.title==='string'&&Array.isArray(section.resources)&&Array.isArray(section.unresolvedReferences)));
  assert.ok(sections.flatMap(section=>section.resources).every(resource=>resource.title&&!/^https?:\/\/[^|]+\|/u.test(resource.title)));
  assert.equal(JSON.stringify(input),before);
});

test('section membership, unresolved references, claims-first fields and localized coded titles remain independent',()=>{
  assert.equal(typeof fhir.toClinicalSectionViews,'function');
  const fixture=fhir.FHIR_IPS_ALL_SECTIONS_DEMO_DATA.bundle;
  const reference='Condition/clinical-condition';
  const claims={[fhir.ConditionClaim.Code]:`${fhir.ClinicalTerminologySystems.SnomedCt}|test-code`,[fhir.ConditionClaim.CodeText]:'Texto original',[fhir.ConditionClaim.CodeDisplay]:'International condition',[fhir.ConditionClaim.ClinicalStatus]:'active',[fhir.ConditionClaimsFhirApi.CodeText]:'Expanded text'};
  const bundle={resourceType:'Bundle',type:'document',data:[{resource:{resourceType:'Composition',section:[{title:'Parent',section:[{title:'Problems',entry:[{reference},{reference:'Condition/missing'}]}]}]}},{fullUrl:reference,resource:{resourceType:'Condition',id:'clinical-condition',language:'es',meta:{claims}}}]};
  const spanish=fhir.toClinicalSectionViews(bundle,{locale:'es'});
  const section=spanish.find(item=>item.title==='Problems');
  assert.deepEqual(section.unresolvedReferences,['Condition/missing']);
  assert.equal(section.resources[0].title,'Texto original');
  assert.equal(section.resources[0].status,'active');
  assert.equal(section.resources[0].fields.find(item=>item.claim===fhir.ConditionClaim.CodeText).value,'Texto original');
  const translated=[];
  const french=fhir.toClinicalSectionViews(bundle,{locale:'fr',translateCode:input=>{translated.push(input);return 'Condition traduite'}});
  assert.equal(french.find(item=>item.title==='Problems').resources[0].title,'Condition traduite');
  assert.equal(translated[0].token,claims[fhir.ConditionClaim.Code]);
  assert.equal(fhir.toClinicalSectionViews(fixture).length,16);
});

test('resource cards preserve quantitative values and every canonical editable field',()=>{
  assert.equal(typeof fhir.toClinicalResourceCardView,'function');
  const claims={[fhir.ObservationClaim.CodeText]:'Synthetic observation',[fhir.ObservationClaim.ValueQuantityNumber]:'98',[fhir.ObservationClaim.ValueQuantityUnit]:'%', [fhir.ObservationClaim.ReferenceRangeText]:'Synthetic reference range'};
  const card=fhir.toClinicalResourceCardView({resource:{resourceType:'Observation',meta:{claims}}});
  assert.equal(card.value,98);
  assert.equal(card.unit,'%');
  assert.equal(card.referenceRangeText,claims[fhir.ObservationClaim.ReferenceRangeText]);
  assert.equal(card.fields.length,Object.keys(claims).length);
});

test('minimal native Procedure and Immunization cards retain canonical coding tokens when labels are absent',()=>{
 for(const [resourceType,field,code] of [['Procedure','code','synthetic-procedure'],['Immunization','vaccineCode','synthetic-vaccine']]){
  const system='urn:synthetic:clinical-codes',resource={resourceType,[field]:{coding:[{system,code}]}},before=structuredClone(resource)
  assert.equal(fhir.toClinicalResourceCardView({resource},{locale:'en'}).title,system+'|'+code)
  assert.equal(fhir.toClinicalResourceCardView({resource}).title,system+'|'+code)
  assert.deepEqual(resource,before)
 }
})
test('English missing-label projection invokes the existing explicit terminology callback before a code/type fallback',()=>{
 const seen=[],resource={resourceType:'Procedure',code:{coding:[{system:'urn:synthetic:clinical-codes',code:'synthetic-procedure'}]}}
 const view=fhir.toClinicalResourceCardView({resource},{locale:'en',translateCode:input=>{seen.push(input);return 'Host-supplied procedure label'}})
 assert.equal(view.title,'Host-supplied procedure label')
 assert.deepEqual(seen,[{resourceType:'Procedure',system:'urn:synthetic:clinical-codes',code:'synthetic-procedure',token:'urn:synthetic:clinical-codes|synthetic-procedure',locale:'en'}])
})
test('native minimized Composition aliases reach the same code-only resource display without source rewriting',()=>{
 const bundle={resourceType:'Bundle',type:'document',entry:[{fullUrl:'resource:0',resource:{resourceType:'Composition',section:[{title:'Recorded synthetic care',entry:[{reference:'resource:1'}]}]}},{fullUrl:'resource:1',resource:{resourceType:'Procedure',code:{coding:[{system:'urn:synthetic:clinical-codes',code:'synthetic-procedure'}]}}}]},before=structuredClone(bundle)
 const views=fhir.toClinicalSectionViews(bundle,{locale:'en',translateCode:({token})=>token})
 assert.equal(views[0].resources[0].title,'urn:synthetic:clinical-codes|synthetic-procedure')
 assert.deepEqual(bundle,before)
})
test('known native labels, non-English translation precedence and uncoded resource fallbacks remain unchanged',()=>{
 const resource={resourceType:'Procedure',language:'es',code:{text:'Source manual wording',coding:[{system:'urn:synthetic:clinical-codes',code:'synthetic-procedure',display:'Known international wording'}]}},before=structuredClone(resource),calls=[]
 assert.equal(fhir.toClinicalResourceCardView({resource},{locale:'en',translateCode:input=>{calls.push(input);return 'Unexpected replacement'}}).title,'Known international wording')
 assert.equal(fhir.toClinicalResourceCardView({resource},{locale:'es',translateCode:input=>{calls.push(input);return 'Unexpected replacement'}}).title,'Source manual wording')
 assert.equal(calls.length,0)
 assert.equal(fhir.toClinicalResourceCardView({resource},{locale:'fr',translateCode:()=> 'Localized caller wording'}).title,'Localized caller wording')
 assert.equal(fhir.toClinicalResourceCardView({resource:{resourceType:'Procedure',title:'Existing manual title',code:{coding:[{system:'urn:synthetic:clinical-codes',code:'synthetic-procedure'}]}}},{locale:'en'}).title,'Existing manual title')
 assert.equal(fhir.toClinicalResourceCardView({resource:{resourceType:'Procedure'}},{locale:'en'}).title,'Procedure')
 assert.deepEqual(resource,before)
})
