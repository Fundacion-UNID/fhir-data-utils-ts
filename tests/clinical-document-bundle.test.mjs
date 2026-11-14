// Flow contract: the pure FHIR document builder assembles an explicit Composition, exact section-linked flat claims and attester provenance without persistence, registries or occupation policy.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as fhir from '../dist/index.js';

test('clinical document builder preserves exact subject, provenance and section membership',()=>{
  assert.equal(typeof fhir.buildClinicalDocumentBundle,'function','FHIR must own deterministic document construction');
  const subjectReference=fhir.FHIR_IPS_ALL_SECTIONS_DEMO_DATA.subject.reference;
  const authorReference='Practitioner/clinical-document-author';
  const input={documentId:'clinical-document',compositionId:'clinical-composition',subjectReference,title:'Synthetic clinical draft',documentType:fhir.FHIR_IPS_DOCUMENT_TYPE_CLAIM,status:'final',sectionCodeSystem:fhir.ClinicalTerminologySystems.Loinc,date:'2026-01-01T00:00:00Z',authorReferences:[authorReference],attesters:[{reference:authorReference,mode:'professional',time:'2026-01-01T00:00:00Z'}],entries:[{resourceType:'Condition',entryId:'clinical-condition',claims:{[fhir.ConditionClaim.CodeText]:'Synthetic condition'},sectionCodes:[fhir.FHIR_IPS_SECTION_CODES.Problems]}]};
  const result=fhir.buildClinicalDocumentBundle(input);
  assert.equal(result.resourceType,'Bundle');
  assert.equal(result.type,'document');
  const composition=result.entry[0].resource;
  assert.equal(composition.resourceType,'Composition');
  assert.equal(composition.status,'final');
  assert.equal(composition.meta.claims[fhir.CompositionClaim.Type],fhir.FHIR_IPS_DOCUMENT_TYPE_CLAIM);
  assert.equal(composition.type.coding[0].system,fhir.ClinicalTerminologySystems.Loinc);
  assert.equal(composition.section[0].code.coding[0].system,fhir.ClinicalTerminologySystems.Loinc);
  assert.deepEqual(composition.subject,{reference:subjectReference});
  assert.deepEqual(composition.author,[{reference:authorReference}]);
  assert.deepEqual(composition.attester,[{party:{reference:authorReference},mode:'professional',time:input.attesters[0].time}]);
  assert.deepEqual(composition.section[0].entry,[{reference:'Condition/clinical-condition'}]);
  assert.equal(result.entry.find(entry=>entry.resource.resourceType==='Condition').resource.meta.claims[fhir.ConditionClaim.CodeText],'Synthetic condition');
  assert.deepEqual(result,fhir.buildClinicalDocumentBundle(input));
});
