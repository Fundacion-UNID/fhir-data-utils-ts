// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  FHIR_IPS_ALL_SECTIONS_DEMO_DATA,
  FHIR_IPS_CLINICAL_ARTIFACT_SCHEMAS,
  FhirIpsClinicalArtifactTypes,
  canonicalClinicalSubjectReference,
  clinicalArtifactEditorClaimsFromFhirR4,
  clinicalArtifactFhirR4FromEditorClaims,
  clinicalArtifactSubjectClaims,
} from '../dist/index.js'

const supportedTypes = new Set(Object.values(FhirIpsClinicalArtifactTypes))
const resources = FHIR_IPS_ALL_SECTIONS_DEMO_DATA.bundle.entry
  .map(({ resource }) => resource)
  .filter(({ resourceType }) => supportedTypes.has(resourceType))
const canonicalSubjectReference = FHIR_IPS_ALL_SECTIONS_DEMO_DATA.bundle.entry
  .find(({ resource }) => resource.resourceType === FhirIpsClinicalArtifactTypes.Immunization)
  .resource.id
const subjectReference = `urn:uuid:${canonicalSubjectReference}`

test('canonicalizes native FHIR relative subject references before claims-first authoring', () => {
  assert.equal(
    canonicalClinicalSubjectReference(FHIR_IPS_ALL_SECTIONS_DEMO_DATA.subject.reference),
    `urn:uuid:${FHIR_IPS_ALL_SECTIONS_DEMO_DATA.subject.reference.split('/').at(-1)}`,
  )
  assert.equal(canonicalClinicalSubjectReference(subjectReference), subjectReference)
  assert.deepEqual(
    clinicalArtifactSubjectClaims(
      FhirIpsClinicalArtifactTypes.Condition,
      FHIR_IPS_ALL_SECTIONS_DEMO_DATA.subject.reference,
    ),
    { 'Condition.subject': `urn:uuid:${FHIR_IPS_ALL_SECTIONS_DEMO_DATA.subject.reference.split('/').at(-1)}` },
  )
  assert.throws(() => canonicalClinicalSubjectReference(''), /clinical_artifact_subject_reference_invalid/)
})

test('hydrates every shared IPS editor schema from a FHIR R4 resource and recreates equivalent claims', () => {
  for (const resource of resources) {
    const schema = FHIR_IPS_CLINICAL_ARTIFACT_SCHEMAS[resource.resourceType]
    const editorClaims = clinicalArtifactEditorClaimsFromFhirR4(resource, schema)

    assert.ok(schema.requiredClaims.every((claim) => editorClaims[claim] !== undefined), resource.resourceType)
    assert.ok(Object.keys(editorClaims).every((claim) =>
      schema.requiredClaims.includes(claim) || schema.optionalClaims.includes(claim)), resource.resourceType)

    const recreated = clinicalArtifactFhirR4FromEditorClaims(
      resource.resourceType,
      editorClaims,
      clinicalArtifactSubjectClaims(resource.resourceType, subjectReference),
    )
    assert.deepEqual(
      clinicalArtifactEditorClaimsFromFhirR4(recreated, schema),
      editorClaims,
      resource.resourceType,
    )
  }
})

test('fails closed when a resource is hydrated through another resource schema', () => {
  const immunization = resources.find(({ resourceType }) => resourceType === FhirIpsClinicalArtifactTypes.Immunization)
  assert.ok(immunization)
  assert.throws(
    () => clinicalArtifactEditorClaimsFromFhirR4(
      immunization,
      FHIR_IPS_CLINICAL_ARTIFACT_SCHEMAS[FhirIpsClinicalArtifactTypes.Condition],
    ),
    /clinical_artifact_schema_resource_type_mismatch/,
  )
})
