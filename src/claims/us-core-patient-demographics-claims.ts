import type { ClaimSpec } from './claim-types.js'

/** Canonical claims for the optional US Core Patient race and ethnicity extensions. */
export const UsCorePatientDemographicClaim = Object.freeze({
  RaceOmbCategory: 'Patient.extension:us-core-race.extension:ombCategory',
  RaceDetailed: 'Patient.extension:us-core-race.extension:detailed',
  RaceText: 'Patient.extension:us-core-race.extension:text',
  EthnicityOmbCategory: 'Patient.extension:us-core-ethnicity.extension:ombCategory',
  EthnicityDetailed: 'Patient.extension:us-core-ethnicity.extension:detailed',
  EthnicityText: 'Patient.extension:us-core-ethnicity.extension:text',
} as const)

/** Derived claims backed by the two official optional US Core SearchParameters. */
export const UsCorePatientDemographicSearchClaim = Object.freeze({
  Race: 'Patient.race',
  Ethnicity: 'Patient.ethnicity',
} as const)

export type UsCorePatientDemographicClaimKey = typeof UsCorePatientDemographicClaim[keyof typeof UsCorePatientDemographicClaim]
export type UsCorePatientDemographicSearchClaimKey = typeof UsCorePatientDemographicSearchClaim[keyof typeof UsCorePatientDemographicSearchClaim]

export const UsCorePatientDemographicClaimSpecs: readonly ClaimSpec[] = Object.freeze([
  { key: UsCorePatientDemographicClaim.RaceOmbCategory, meaning: 'Comma-separated OMB race Coding tokens.', example: 'urn:oid:2.16.840.1.113883.6.238|2028-9' },
  { key: UsCorePatientDemographicClaim.RaceDetailed, meaning: 'Comma-separated detailed race Coding tokens.', example: 'urn:oid:2.16.840.1.113883.6.238|2036-2' },
  { key: UsCorePatientDemographicClaim.RaceText, meaning: 'Patient-supplied race text required when the US Core race extension is present.', example: 'Asian' },
  { key: UsCorePatientDemographicClaim.EthnicityOmbCategory, meaning: 'OMB ethnicity Coding token.', example: 'urn:oid:2.16.840.1.113883.6.238|2135-2' },
  { key: UsCorePatientDemographicClaim.EthnicityDetailed, meaning: 'Comma-separated detailed ethnicity Coding tokens.', example: 'urn:oid:2.16.840.1.113883.6.238|2148-5' },
  { key: UsCorePatientDemographicClaim.EthnicityText, meaning: 'Patient-supplied ethnicity text required when the US Core ethnicity extension is present.', example: 'Hispanic or Latino' },
])

export const UsCorePatientDemographicSearchClaimSpecs: readonly ClaimSpec[] = Object.freeze([
  { key: UsCorePatientDemographicSearchClaim.Race, meaning: 'Derived token list for the official optional US Core race SearchParameter.', example: 'urn:oid:2.16.840.1.113883.6.238|2028-9' },
  { key: UsCorePatientDemographicSearchClaim.Ethnicity, meaning: 'Derived token list for the official optional US Core ethnicity SearchParameter.', example: 'urn:oid:2.16.840.1.113883.6.238|2135-2' },
])
