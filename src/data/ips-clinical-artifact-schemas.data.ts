// Copyright 2026 Connecting Solution & Applications Ltd under the Apache License, Version 2.0.

import { AllergyIntoleranceClaim } from '../claims/allergy-intolerance-claims.js'
import { ConditionClaim } from '../claims/condition-claims.js'
import { ImmunizationClaim } from '../claims/immunization-claims.js'
import { MedicationStatementClaim } from '../claims/medication-statement-claims.js'
import { ProcedureClaim } from '../claims/procedure-claims.js'
import { ObservationCategoryCodes, ObservationClaim } from '../observation-claims.js'
import { FHIR_IPS_PRIMARY_AUTHORING_SECTION_CODE_BY_RESOURCE_TYPE, FHIR_IPS_SECTION_CODES } from './ips-all-sections.data.js'

export const FhirIpsClinicalArtifactTypes = Object.freeze({
  AllergyIntolerance: 'AllergyIntolerance',
  MedicationStatement: 'MedicationStatement',
  Immunization: 'Immunization',
  Condition: 'Condition',
  Procedure: 'Procedure',
  Observation: 'Observation',
} as const)

export type FhirIpsClinicalArtifactType =
  typeof FhirIpsClinicalArtifactTypes[keyof typeof FhirIpsClinicalArtifactTypes]

export type FhirIpsClinicalArtifactSchema = Readonly<{
  resourceType: FhirIpsClinicalArtifactType
  sectionCode: string
  requiredClaims: readonly string[]
  optionalClaims: readonly string[]
  /** Source-text claims for which a user may explicitly confirm a terminology candidate. */
  terminologyTextClaims: readonly string[]
  /** Canonical initial values used by every schema-driven editor. */
  initialClaims: Readonly<Record<string, string>>
}>

export const FhirIpsObservationArtifactKinds = Object.freeze({
  VitalSigns: 'vital-signs',
  Laboratory: 'laboratory',
  SocialHistory: 'social-history',
  PregnancyHistory: 'pregnancy-history',
} as const)

export type FhirIpsObservationArtifactKind =
  typeof FhirIpsObservationArtifactKinds[keyof typeof FhirIpsObservationArtifactKinds]

export type FhirIpsObservationArtifactSchema = FhirIpsClinicalArtifactSchema & Readonly<{
  kind: FhirIpsObservationArtifactKind
}>

const observationRequiredClaims = Object.freeze([
  ObservationClaim.Category,
  ObservationClaim.CodeText,
  ObservationClaim.Status,
])
const observationOptionalClaims = Object.freeze([
  ObservationClaim.Code,
  ObservationClaim.CodeDisplay,
  ObservationClaim.Date,
  ObservationClaim.EffectiveDateTime,
  ObservationClaim.Encounter,
  ObservationClaim.Performer,
  ObservationClaim.Method,
  ObservationClaim.Specimen,
  ObservationClaim.Device,
  ObservationClaim.ValueQuantityNumber,
  ObservationClaim.ValueQuantityUnit,
  ObservationClaim.ValueString,
  ObservationClaim.ValueConcept,
  ObservationClaim.ValueConceptText,
  ObservationClaim.ValueConceptDisplay,
  ObservationClaim.ReferenceRangeLowNumber,
  ObservationClaim.ReferenceRangeHighNumber,
  ObservationClaim.ReferenceRangeUnit,
  ObservationClaim.ReferenceRangeText,
  ObservationClaim.Note,
])

function observationSchema(
  kind: FhirIpsObservationArtifactKind,
  sectionCode: string,
  category: string,
): FhirIpsObservationArtifactSchema {
  return Object.freeze({
    kind,
    resourceType: FhirIpsClinicalArtifactTypes.Observation,
    sectionCode,
    requiredClaims: observationRequiredClaims,
    optionalClaims: observationOptionalClaims,
    terminologyTextClaims: Object.freeze([ObservationClaim.CodeText]),
    initialClaims: Object.freeze({
      [ObservationClaim.Category]: category,
      [ObservationClaim.Status]: 'final',
    }),
  })
}

/** Section-specific Observation authoring contracts; a resource type alone is not a sufficient selector. */
export const FHIR_IPS_OBSERVATION_ARTIFACT_SCHEMAS: Readonly<Record<FhirIpsObservationArtifactKind, FhirIpsObservationArtifactSchema>> = Object.freeze({
  [FhirIpsObservationArtifactKinds.VitalSigns]: observationSchema(FhirIpsObservationArtifactKinds.VitalSigns, FHIR_IPS_SECTION_CODES.VitalSigns, ObservationCategoryCodes.VitalSigns.claim),
  [FhirIpsObservationArtifactKinds.Laboratory]: observationSchema(FhirIpsObservationArtifactKinds.Laboratory, FHIR_IPS_SECTION_CODES.DiagnosticResults, ObservationCategoryCodes.Laboratory.claim),
  [FhirIpsObservationArtifactKinds.SocialHistory]: observationSchema(FhirIpsObservationArtifactKinds.SocialHistory, FHIR_IPS_SECTION_CODES.SocialHistory, ObservationCategoryCodes.SocialHistory.claim),
  [FhirIpsObservationArtifactKinds.PregnancyHistory]: observationSchema(FhirIpsObservationArtifactKinds.PregnancyHistory, FHIR_IPS_SECTION_CODES.PregnancyHistory, ObservationCategoryCodes.Survey.claim),
})

/**
 * Minimum reusable IPS authoring surface for Personal and Professional portals.
 *
 * These data-only schemas contain claim keys, not UI labels, authorization or
 * transport policy. Human and veterinary portals use the same core resource
 * contracts; a veterinary terminology adapter may additionally receive the
 * subject taxonomy without changing the stored FHIR claim names.
 */
export const FHIR_IPS_CLINICAL_ARTIFACT_SCHEMAS: Readonly<Record<FhirIpsClinicalArtifactType, FhirIpsClinicalArtifactSchema>> = Object.freeze({
  [FhirIpsClinicalArtifactTypes.AllergyIntolerance]: Object.freeze({
    resourceType: FhirIpsClinicalArtifactTypes.AllergyIntolerance,
    sectionCode: FHIR_IPS_PRIMARY_AUTHORING_SECTION_CODE_BY_RESOURCE_TYPE.AllergyIntolerance,
    requiredClaims: Object.freeze([AllergyIntoleranceClaim.CodeText, AllergyIntoleranceClaim.ClinicalStatus]),
    optionalClaims: Object.freeze([AllergyIntoleranceClaim.Code, AllergyIntoleranceClaim.CodeDisplay, AllergyIntoleranceClaim.Category, AllergyIntoleranceClaim.VerificationStatus, AllergyIntoleranceClaim.Criticality, AllergyIntoleranceClaim.OnsetDateTime, AllergyIntoleranceClaim.Recorder]),
    terminologyTextClaims: Object.freeze([AllergyIntoleranceClaim.CodeText]),
    initialClaims: Object.freeze({ [AllergyIntoleranceClaim.ClinicalStatus]: 'active' }),
  }),
  [FhirIpsClinicalArtifactTypes.MedicationStatement]: Object.freeze({
    resourceType: FhirIpsClinicalArtifactTypes.MedicationStatement,
    sectionCode: FHIR_IPS_PRIMARY_AUTHORING_SECTION_CODE_BY_RESOURCE_TYPE.MedicationStatement,
    requiredClaims: Object.freeze([MedicationStatementClaim.CodeText, MedicationStatementClaim.Status]),
    optionalClaims: Object.freeze([MedicationStatementClaim.Code, MedicationStatementClaim.CodeDisplay, MedicationStatementClaim.Category, MedicationStatementClaim.Effective, MedicationStatementClaim.DosageInstruction, MedicationStatementClaim.DosageRoute, MedicationStatementClaim.TimingFrequency, MedicationStatementClaim.TimingPeriod, MedicationStatementClaim.TimingPeriodUnit, MedicationStatementClaim.Note]),
    terminologyTextClaims: Object.freeze([MedicationStatementClaim.CodeText]),
    initialClaims: Object.freeze({ [MedicationStatementClaim.Status]: 'active' }),
  }),
  [FhirIpsClinicalArtifactTypes.Immunization]: Object.freeze({
    resourceType: FhirIpsClinicalArtifactTypes.Immunization,
    sectionCode: FHIR_IPS_PRIMARY_AUTHORING_SECTION_CODE_BY_RESOURCE_TYPE.Immunization,
    requiredClaims: Object.freeze([ImmunizationClaim.VaccineCodeText, ImmunizationClaim.Status]),
    optionalClaims: Object.freeze([ImmunizationClaim.VaccineCode, ImmunizationClaim.VaccineCodeDisplay, ImmunizationClaim.Date, ImmunizationClaim.LotNumber, ImmunizationClaim.DoseSequence, ImmunizationClaim.Manufacturer, ImmunizationClaim.Performer, ImmunizationClaim.Location, ImmunizationClaim.Route, ImmunizationClaim.RouteDisplay, ImmunizationClaim.Site, ImmunizationClaim.SiteDisplay, ImmunizationClaim.Series, ImmunizationClaim.TargetDisease, ImmunizationClaim.TargetDiseaseText, ImmunizationClaim.TargetDiseaseDisplay, ImmunizationClaim.ReactionDate, ImmunizationClaim.Note]),
    terminologyTextClaims: Object.freeze([ImmunizationClaim.VaccineCodeText, ImmunizationClaim.TargetDiseaseText]),
    initialClaims: Object.freeze({ [ImmunizationClaim.Status]: 'completed' }),
  }),
  [FhirIpsClinicalArtifactTypes.Condition]: Object.freeze({
    resourceType: FhirIpsClinicalArtifactTypes.Condition,
    sectionCode: FHIR_IPS_PRIMARY_AUTHORING_SECTION_CODE_BY_RESOURCE_TYPE.Condition,
    requiredClaims: Object.freeze([ConditionClaim.CodeText, ConditionClaim.ClinicalStatus]),
    optionalClaims: Object.freeze([ConditionClaim.Code, ConditionClaim.CodeDisplay, ConditionClaim.Category, ConditionClaim.VerificationStatus, ConditionClaim.Severity, ConditionClaim.OnsetDateTime, ConditionClaim.RecordedDate, ConditionClaim.Asserter, ConditionClaim.Recorder]),
    terminologyTextClaims: Object.freeze([ConditionClaim.CodeText]),
    initialClaims: Object.freeze({ [ConditionClaim.ClinicalStatus]: 'active' }),
  }),
  [FhirIpsClinicalArtifactTypes.Procedure]: Object.freeze({
    resourceType: FhirIpsClinicalArtifactTypes.Procedure,
    sectionCode: FHIR_IPS_PRIMARY_AUTHORING_SECTION_CODE_BY_RESOURCE_TYPE.Procedure,
    requiredClaims: Object.freeze([ProcedureClaim.CodeText, ProcedureClaim.Status]),
    optionalClaims: Object.freeze([ProcedureClaim.Code, ProcedureClaim.CodeDisplay, ProcedureClaim.Date, ProcedureClaim.Performer, ProcedureClaim.Location, ProcedureClaim.BodySite, ProcedureClaim.ReasonCode, ProcedureClaim.ReasonReference, ProcedureClaim.Note]),
    terminologyTextClaims: Object.freeze([ProcedureClaim.CodeText]),
    initialClaims: Object.freeze({ [ProcedureClaim.Status]: 'completed' }),
  }),
  [FhirIpsClinicalArtifactTypes.Observation]: Object.freeze({
    ...FHIR_IPS_OBSERVATION_ARTIFACT_SCHEMAS[FhirIpsObservationArtifactKinds.VitalSigns],
  }),
})
