import { UsCorePatientDemographicClaim, UsCorePatientDemographicSearchClaim } from '../claims/us-core-patient-demographics-claims.js'
import type { UsCorePatientDemographicSearchClaimKey } from '../claims/us-core-patient-demographics-claims.js'
import type { FhirCoding, FhirResource } from '../fhir-types.js'
import type { FlatClaims } from './convert-shared.js'
import { codingListFromCsv, codingListToCsv } from './convert-shared.js'

export const UsCorePatientRaceExtensionUrl = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-race'
export const UsCorePatientEthnicityExtensionUrl = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity'

export type UsCorePatientSearchParameterDefinition = Readonly<{
  canonicalUrl: string
  code: 'race' | 'ethnicity'
  base: 'Patient'
  type: 'token'
  expression: string
  claim: UsCorePatientDemographicSearchClaimKey
  sourceClaims: readonly string[]
  multipleOr: true
  multipleAnd: true
}>

export const UsCorePatientDemographicSearchParameters: readonly UsCorePatientSearchParameterDefinition[] = Object.freeze([
  Object.freeze({
    canonicalUrl: 'http://hl7.org/fhir/us/core/SearchParameter/us-core-race',
    code: 'race', base: 'Patient', type: 'token',
    expression: `Patient.extension.where(url = '${UsCorePatientRaceExtensionUrl}').extension.value.code`,
    claim: UsCorePatientDemographicSearchClaim.Race,
    sourceClaims: Object.freeze([UsCorePatientDemographicClaim.RaceOmbCategory, UsCorePatientDemographicClaim.RaceDetailed]),
    multipleOr: true, multipleAnd: true,
  }),
  Object.freeze({
    canonicalUrl: 'http://hl7.org/fhir/us/core/SearchParameter/us-core-ethnicity',
    code: 'ethnicity', base: 'Patient', type: 'token',
    expression: `Patient.extension.where(url = '${UsCorePatientEthnicityExtensionUrl}').extension.value.code`,
    claim: UsCorePatientDemographicSearchClaim.Ethnicity,
    sourceClaims: Object.freeze([UsCorePatientDemographicClaim.EthnicityOmbCategory, UsCorePatientDemographicClaim.EthnicityDetailed]),
    multipleOr: true, multipleAnd: true,
  }),
])

export type FhirExtension = Readonly<{
  url: string
  extension?: readonly FhirExtension[]
  valueCoding?: FhirCoding
  valueString?: string
}>

/** Materializes only the optional US Core extensions enabled by canonical claims. */
export function usCorePatientDemographicsFlatToFhirR4Extensions(claims: FlatClaims): readonly FhirExtension[] {
  return [
    buildExtension({
      url: UsCorePatientRaceExtensionUrl,
      omb: claims[UsCorePatientDemographicClaim.RaceOmbCategory],
      detailed: claims[UsCorePatientDemographicClaim.RaceDetailed],
      text: claims[UsCorePatientDemographicClaim.RaceText],
      textError: 'us_core_patient_race_text_required',
    }),
    buildExtension({
      url: UsCorePatientEthnicityExtensionUrl,
      omb: claims[UsCorePatientDemographicClaim.EthnicityOmbCategory],
      detailed: claims[UsCorePatientDemographicClaim.EthnicityDetailed],
      text: claims[UsCorePatientDemographicClaim.EthnicityText],
      textError: 'us_core_patient_ethnicity_text_required',
      singleOmbCategory: true,
    }),
  ].filter((extension): extension is FhirExtension => Boolean(extension))
}

/** Reads the two governed US Core extensions without treating them as universal demographics. */
export function usCorePatientDemographicsFhirR4ToFlat(resource: FhirResource): FlatClaims {
  if (resource.resourceType !== 'Patient') throw new TypeError('us_core_patient_resource_required')
  const extensions = Array.isArray(resource.extension) ? resource.extension as FhirExtension[] : []
  return {
    ...readExtension(extensions, UsCorePatientRaceExtensionUrl, {
      omb: UsCorePatientDemographicClaim.RaceOmbCategory,
      detailed: UsCorePatientDemographicClaim.RaceDetailed,
      text: UsCorePatientDemographicClaim.RaceText,
      textError: 'us_core_patient_race_text_required',
    }),
    ...readExtension(extensions, UsCorePatientEthnicityExtensionUrl, {
      omb: UsCorePatientDemographicClaim.EthnicityOmbCategory,
      detailed: UsCorePatientDemographicClaim.EthnicityDetailed,
      text: UsCorePatientDemographicClaim.EthnicityText,
      textError: 'us_core_patient_ethnicity_text_required',
      singleOmbCategory: true,
    }),
  }
}

/** Derives the official token-search claims; callers never submit these independently. */
export function deriveUsCorePatientDemographicSearchClaims(claims: FlatClaims): FlatClaims {
  return {
    [UsCorePatientDemographicSearchClaim.Race]: mergeTokenClaims(
      claims[UsCorePatientDemographicClaim.RaceOmbCategory],
      claims[UsCorePatientDemographicClaim.RaceDetailed],
    ),
    [UsCorePatientDemographicSearchClaim.Ethnicity]: mergeTokenClaims(
      claims[UsCorePatientDemographicClaim.EthnicityOmbCategory],
      claims[UsCorePatientDemographicClaim.EthnicityDetailed],
    ),
  }
}

function buildExtension(input: Readonly<{
  url: string
  omb?: string
  detailed?: string
  text?: string
  textError: string
  singleOmbCategory?: boolean
}>): FhirExtension | undefined {
  const omb = codingListFromCsv(input.omb) ?? []
  const detailed = codingListFromCsv(input.detailed) ?? []
  const text = String(input.text || '').trim()
  if (!omb.length && !detailed.length && !text) return undefined
  if (!text) throw new TypeError(input.textError)
  if (input.singleOmbCategory && omb.length > 1) throw new TypeError('us_core_patient_ethnicity_omb_category_cardinality')
  return Object.freeze({
    url: input.url,
    extension: Object.freeze([
      ...omb.map((valueCoding) => Object.freeze({ url: 'ombCategory', valueCoding })),
      ...detailed.map((valueCoding) => Object.freeze({ url: 'detailed', valueCoding })),
      Object.freeze({ url: 'text', valueString: text }),
    ]),
  })
}

function readExtension(
  extensions: readonly FhirExtension[],
  url: string,
  keys: Readonly<{ omb: string; detailed: string; text: string; textError: string; singleOmbCategory?: boolean }>,
): FlatClaims {
  const matches = extensions.filter((extension) => extension.url === url)
  if (!matches.length) return {}
  if (matches.length > 1) throw new TypeError('us_core_patient_extension_cardinality')
  const children = matches[0]?.extension ?? []
  const omb = children.filter((extension) => extension.url === 'ombCategory' && extension.valueCoding).map((extension) => extension.valueCoding!)
  const detailed = children.filter((extension) => extension.url === 'detailed' && extension.valueCoding).map((extension) => extension.valueCoding!)
  const texts = children.filter((extension) => extension.url === 'text' && extension.valueString).map((extension) => extension.valueString!.trim()).filter(Boolean)
  if (texts.length !== 1) throw new TypeError(keys.textError)
  if (keys.singleOmbCategory && omb.length > 1) throw new TypeError('us_core_patient_ethnicity_omb_category_cardinality')
  return {
    [keys.omb]: codingListToCsv(omb),
    [keys.detailed]: codingListToCsv(detailed),
    [keys.text]: texts[0],
  }
}

function mergeTokenClaims(...values: Array<string | undefined>): string | undefined {
  const tokens = values.flatMap((value) => String(value || '').split(',')).map((value) => value.trim()).filter(Boolean)
  const unique = [...new Set(tokens)]
  return unique.length ? unique.join(',') : undefined
}
