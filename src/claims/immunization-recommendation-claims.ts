import type { ClaimSpec } from './claim-types.js'

/** Canonical flat claims used by a FHIR ImmunizationRecommendation graph entry. */
export const ImmunizationRecommendationClaim = Object.freeze({
  Identifier: 'ImmunizationRecommendation.identifier',
  Patient: 'ImmunizationRecommendation.patient',
  Date: 'ImmunizationRecommendation.date',
  VaccineCode: 'ImmunizationRecommendation.vaccine-code',
  ForecastStatus: 'ImmunizationRecommendation.forecast-status',
  DateCriterionCode: 'ImmunizationRecommendation.date-criterion-code',
  DateCriterionValue: 'ImmunizationRecommendation.date-criterion-value',
  SupportingImmunization: 'ImmunizationRecommendation.supporting-immunization',
} as const)

export type ImmunizationRecommendationClaimKey =
  typeof ImmunizationRecommendationClaim[keyof typeof ImmunizationRecommendationClaim]

/** Governed coding tokens authored by the neutral recommendation builder. */
export const ImmunizationRecommendationCodes = Object.freeze({
  ForecastDue: 'http://terminology.hl7.org/CodeSystem/immunization-recommendation-status|due',
  RecommendedDate: 'http://loinc.org|30980-7',
} as const)

export const ImmunizationRecommendationClaimSpecs: readonly ClaimSpec[] = Object.freeze([
  { key: ImmunizationRecommendationClaim.Identifier, meaning: 'Recommendation business identifier.', example: 'urn:uuid:recommendation-1' },
  { key: ImmunizationRecommendationClaim.Patient, meaning: 'Subject reference.', example: 'Patient/subject-1' },
  { key: ImmunizationRecommendationClaim.Date, meaning: 'Recommendation creation date.', example: '2026-09-22' },
  { key: ImmunizationRecommendationClaim.VaccineCode, meaning: 'Recommended vaccine coding token.', example: 'http://www.whocc.no/atc|J07BB02' },
  { key: ImmunizationRecommendationClaim.ForecastStatus, meaning: 'FHIR forecast status coding token.', example: 'http://terminology.hl7.org/CodeSystem/immunization-recommendation-status|due' },
  { key: ImmunizationRecommendationClaim.DateCriterionCode, meaning: 'Date criterion coding token.', example: 'http://loinc.org|30980-7' },
  { key: ImmunizationRecommendationClaim.DateCriterionValue, meaning: 'Date criterion value.', example: '2026-12-21' },
  { key: ImmunizationRecommendationClaim.SupportingImmunization, meaning: 'Supporting Immunization reference.', example: 'Immunization/immunization-1' },
])
