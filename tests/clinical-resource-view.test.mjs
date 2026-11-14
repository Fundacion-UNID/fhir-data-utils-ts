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
