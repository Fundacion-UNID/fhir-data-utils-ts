// Copyright 2026 Connecting Solution & Applications Ltd under the Apache License, Version 2.0.

import {
  allergyIntoleranceFhirR4ToFlat,
  allergyIntoleranceFlatToFhirR4,
  conditionFhirR4ToFlat,
  conditionFlatToFhirR4,
  immunizationFhirR4ToFlat,
  immunizationFlatToFhirR4,
  medicationStatementFhirR4ToFlat,
  medicationStatementFlatToFhirR4,
  observationFromFlatToFhirR4,
  observationToFlatFhirR4,
  procedureFhirR4ToFlat,
  procedureFlatToFhirR4,
} from './converters/index.js'
import {
  FhirIpsClinicalArtifactTypes,
  type FhirIpsClinicalArtifactSchema,
  type FhirIpsClinicalArtifactType,
} from './data/ips-clinical-artifact-schemas.data.js'
import { AllergyIntoleranceClaim } from './claims/allergy-intolerance-claims.js'
import { ConditionClaim } from './claims/condition-claims.js'
import { ImmunizationClaim } from './claims/immunization-claims.js'
import { MedicationStatementClaim } from './claims/medication-statement-claims.js'
import { ProcedureClaim } from './claims/procedure-claims.js'
import { ObservationClaim } from './observation-claims.js'

export type ClinicalArtifactFhirR4Resource = Readonly<Record<string, unknown> & {
  resourceType: FhirIpsClinicalArtifactType
}>

/**
 * Converts a native FHIR relative subject reference into the canonical actor
 * reference accepted by claims-first persistence. Existing governed URNs and
 * did:web identifiers pass through unchanged.
 */
export function canonicalClinicalSubjectReference(subjectReference: string): string {
  const normalized = subjectReference.trim()
  if (/^(?:urn:[^\s]+|did:web:[^\s]+)$/.test(normalized)) return normalized
  const relativeReference = /^[A-Z][A-Za-z]+\/([^/\s]+)$/.exec(normalized)
  if (!relativeReference) throw new TypeError('clinical_artifact_subject_reference_invalid')
  return `urn:uuid:${relativeReference[1]}`
}

/** Host-owned subject claims added only at the trusted materialization boundary. */
export function clinicalArtifactSubjectClaims(
  resourceType: FhirIpsClinicalArtifactType,
  subjectReference: string,
): Readonly<Record<string, string>> {
  const claim = {
    [FhirIpsClinicalArtifactTypes.AllergyIntolerance]: AllergyIntoleranceClaim.Subject,
    [FhirIpsClinicalArtifactTypes.MedicationStatement]: MedicationStatementClaim.Subject,
    [FhirIpsClinicalArtifactTypes.Immunization]: ImmunizationClaim.Subject,
    [FhirIpsClinicalArtifactTypes.Condition]: ConditionClaim.Subject,
    [FhirIpsClinicalArtifactTypes.Procedure]: ProcedureClaim.Subject,
    [FhirIpsClinicalArtifactTypes.Observation]: ObservationClaim.Subject,
  }[resourceType]
  return Object.freeze({ [claim]: canonicalClinicalSubjectReference(subjectReference) })
}

/**
 * Hydrates one schema-driven editor from a native FHIR R4 resource.
 *
 * Only claims explicitly owned by the selected authoring schema are returned;
 * subject, provenance and authorization claims remain host-owned.
 */
export function clinicalArtifactEditorClaimsFromFhirR4(
  resource: ClinicalArtifactFhirR4Resource,
  schema: FhirIpsClinicalArtifactSchema,
): Readonly<Record<string, string>> {
  if (resource.resourceType !== schema.resourceType) {
    throw new TypeError('clinical_artifact_schema_resource_type_mismatch')
  }
  const acceptedClaims = new Set([...schema.requiredClaims, ...schema.optionalClaims])
  const flatClaims = clinicalArtifactFhirR4ToFlat(resource)
  const definedFlatClaims = Object.fromEntries(
    Object.entries(flatClaims).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  )
  return Object.freeze(Object.fromEntries(
    Object.entries({ ...schema.initialClaims, ...definedFlatClaims })
      .filter(([claim, value]) => acceptedClaims.has(claim) && value !== undefined && value !== null && value !== '')
      .map(([claim, value]) => [claim, String(value)]),
  ))
}

/** Materializes a native FHIR R4 resource at the explicit editor/import boundary. */
export function clinicalArtifactFhirR4FromEditorClaims(
  resourceType: FhirIpsClinicalArtifactType,
  editorClaims: Readonly<Record<string, unknown>>,
  hostClaims: Readonly<Record<string, unknown>> = {},
): ClinicalArtifactFhirR4Resource {
  const normalizedClaims = Object.fromEntries(
    Object.entries({ ...hostClaims, ...editorClaims })
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([claim, value]) => [claim, String(value)]),
  )
  switch (resourceType) {
    case FhirIpsClinicalArtifactTypes.AllergyIntolerance:
      return allergyIntoleranceFlatToFhirR4(normalizedClaims) as ClinicalArtifactFhirR4Resource
    case FhirIpsClinicalArtifactTypes.MedicationStatement:
      return medicationStatementFlatToFhirR4(normalizedClaims) as ClinicalArtifactFhirR4Resource
    case FhirIpsClinicalArtifactTypes.Immunization:
      return immunizationFlatToFhirR4(normalizedClaims) as ClinicalArtifactFhirR4Resource
    case FhirIpsClinicalArtifactTypes.Condition:
      return conditionFlatToFhirR4(normalizedClaims) as ClinicalArtifactFhirR4Resource
    case FhirIpsClinicalArtifactTypes.Procedure:
      return procedureFlatToFhirR4(normalizedClaims) as ClinicalArtifactFhirR4Resource
    case FhirIpsClinicalArtifactTypes.Observation:
      return observationFromFlatToFhirR4(normalizedClaims) as ClinicalArtifactFhirR4Resource
  }
}

/** Converts a supported native FHIR R4 resource to its canonical flat claims. */
export function clinicalArtifactFhirR4ToFlat(
  resource: ClinicalArtifactFhirR4Resource,
): Readonly<Record<string, unknown>> {
  switch (resource.resourceType) {
    case FhirIpsClinicalArtifactTypes.AllergyIntolerance:
      return allergyIntoleranceFhirR4ToFlat(resource as never)
    case FhirIpsClinicalArtifactTypes.MedicationStatement:
      return medicationStatementFhirR4ToFlat(resource as never)
    case FhirIpsClinicalArtifactTypes.Immunization:
      return immunizationFhirR4ToFlat(resource as never)
    case FhirIpsClinicalArtifactTypes.Condition:
      return conditionFhirR4ToFlat(resource as never)
    case FhirIpsClinicalArtifactTypes.Procedure:
      return procedureFhirR4ToFlat(resource as never)
    case FhirIpsClinicalArtifactTypes.Observation:
      return observationToFlatFhirR4(resource as never)
  }
}
