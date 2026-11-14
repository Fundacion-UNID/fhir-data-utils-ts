// Flow contract: clinical summaries retain local text and international display as separate data, composing a readable label without translating or confirming a coding.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as view from '../dist/clinical-resource-view.js';
import {ConditionClaim,ConditionClaimsFhirApi,ImmunizationClaim} from '../dist/index.js';

const labels=resource=>{
  assert.equal(typeof view.getLocalTextAndIntDisplay,'function','the canonical clinical view must expose its bilingual-label reader');
  return view.getLocalTextAndIntDisplay(resource);
};

test('native local text and international coding display remain distinct and input is unchanged',()=>{
  const resource={resourceType:'Condition',code:{text:' Texto original ',coding:[{code:'synthetic-code'},{display:' International label '}]}};
  const before=JSON.stringify(resource);
  assert.deepEqual(labels(resource),{localText:'Texto original',internationalDisplay:'International label',combined:'Texto original (International label)'});
  assert.equal(JSON.stringify(resource),before);
});

test('canonical short and qualified flat claims retain their labels with short claims taking precedence',()=>{
  const resource={resourceType:'Condition',meta:{claims:{[ConditionClaimsFhirApi.CodeText]:'Qualified text',[ConditionClaim.CodeText]:'Texto original',[ConditionClaim.CodeDisplay]:'International label'}}};
  assert.deepEqual(labels(resource),{localText:'Texto original',internationalDisplay:'International label',combined:'Texto original (International label)'});
});

test('identical labels are not repeated and manual text does not require a terminology code',()=>{
  assert.deepEqual(labels({resourceType:'Condition',code:{text:'Same label',coding:[{display:'Same label'}]}}),{localText:'Same label',internationalDisplay:'Same label',combined:'Same label'});
  assert.deepEqual(labels({resourceType:'Condition',meta:{claims:{[ConditionClaim.CodeText]:'Uncoded manual text'}}}),{localText:'Uncoded manual text',combined:'Uncoded manual text'});
});

test('resource-specific vaccine flat labels are read without treating a coding token as a display',()=>{
  assert.deepEqual(labels({resourceType:'Immunization',meta:{claims:{[ImmunizationClaim.VaccineCodeText]:'Vacuna de ejemplo',[ImmunizationClaim.VaccineCodeDisplay]:'Synthetic vaccine'}}}),{localText:'Vacuna de ejemplo',internationalDisplay:'Synthetic vaccine',combined:'Vacuna de ejemplo (Synthetic vaccine)'});
  assert.deepEqual(labels({resourceType:'Condition',meta:{claims:{[ConditionClaim.Code]:'synthetic-system|synthetic-code'}}}),{localText:'Condition',combined:'Condition'});
});
