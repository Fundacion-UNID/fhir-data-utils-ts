// Flow contract: US Core race and ethnicity are FHIR-owned optional Patient extensions; portal DTO names and org.schema claims never define their persistence contract.
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  UsCorePatientDemographicClaim,
  UsCorePatientDemographicSearchClaim,
  UsCorePatientDemographicSearchParameters,
  deriveUsCorePatientDemographicSearchClaims,
  usCorePatientDemographicsFhirR4ToFlat,
  usCorePatientDemographicsFlatToFhirR4Extensions,
} from '../dist/index.js'

const OMB_SYSTEM = 'urn:oid:2.16.840.1.113883.6.238'

test('publishes canonical US Core Patient extension flat claims', () => {
  assert.deepEqual(UsCorePatientDemographicClaim, {
    RaceOmbCategory: 'Patient.extension:us-core-race.extension:ombCategory',
    RaceDetailed: 'Patient.extension:us-core-race.extension:detailed',
    RaceText: 'Patient.extension:us-core-race.extension:text',
    EthnicityOmbCategory: 'Patient.extension:us-core-ethnicity.extension:ombCategory',
    EthnicityDetailed: 'Patient.extension:us-core-ethnicity.extension:detailed',
    EthnicityText: 'Patient.extension:us-core-ethnicity.extension:text',
  })
})

test('round trips optional US Core race and ethnicity extensions', () => {
  const claims = {
    [UsCorePatientDemographicClaim.RaceOmbCategory]: `${OMB_SYSTEM}|2028-9`,
    [UsCorePatientDemographicClaim.RaceDetailed]: `${OMB_SYSTEM}|2036-2,${OMB_SYSTEM}|2106-3`,
    [UsCorePatientDemographicClaim.RaceText]: 'Asian and White',
    [UsCorePatientDemographicClaim.EthnicityOmbCategory]: `${OMB_SYSTEM}|2135-2`,
    [UsCorePatientDemographicClaim.EthnicityDetailed]: `${OMB_SYSTEM}|2148-5`,
    [UsCorePatientDemographicClaim.EthnicityText]: 'Hispanic or Latino',
  }
  const extension = usCorePatientDemographicsFlatToFhirR4Extensions(claims)

  assert.equal(extension.length, 2)
  assert.equal(extension[0].url, 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-race')
  assert.equal(extension[1].url, 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity')
  assert.deepEqual(usCorePatientDemographicsFhirR4ToFlat({ resourceType: 'Patient', extension }), claims)
  assert.deepEqual(deriveUsCorePatientDemographicSearchClaims(claims), {
    [UsCorePatientDemographicSearchClaim.Race]: `${OMB_SYSTEM}|2028-9,${OMB_SYSTEM}|2036-2,${OMB_SYSTEM}|2106-3`,
    [UsCorePatientDemographicSearchClaim.Ethnicity]: `${OMB_SYSTEM}|2135-2,${OMB_SYSTEM}|2148-5`,
  })
})

test('defines the official optional US Core token SearchParameters', () => {
  assert.deepEqual(UsCorePatientDemographicSearchParameters.map(({ canonicalUrl, code, base, type, claim, multipleOr, multipleAnd }) => ({ canonicalUrl, code, base, type, claim, multipleOr, multipleAnd })), [
    { canonicalUrl: 'http://hl7.org/fhir/us/core/SearchParameter/us-core-race', code: 'race', base: 'Patient', type: 'token', claim: 'Patient.race', multipleOr: true, multipleAnd: true },
    { canonicalUrl: 'http://hl7.org/fhir/us/core/SearchParameter/us-core-ethnicity', code: 'ethnicity', base: 'Patient', type: 'token', claim: 'Patient.ethnicity', multipleOr: true, multipleAnd: true },
  ])
})

test('omits both jurisdictional extensions when no governed claims are present', () => {
  assert.deepEqual(usCorePatientDemographicsFlatToFhirR4Extensions({}), [])
  assert.deepEqual(usCorePatientDemographicsFhirR4ToFlat({ resourceType: 'Patient' }), {})
})

test('fails closed when a coded extension omits its required human-readable text', () => {
  assert.throws(() => usCorePatientDemographicsFlatToFhirR4Extensions({
    [UsCorePatientDemographicClaim.RaceOmbCategory]: `${OMB_SYSTEM}|2028-9`,
  }), /us_core_patient_race_text_required/)
})

test('enforces the single OMB ethnicity category cardinality', () => {
  assert.throws(() => usCorePatientDemographicsFlatToFhirR4Extensions({
    [UsCorePatientDemographicClaim.EthnicityOmbCategory]: `${OMB_SYSTEM}|2135-2,${OMB_SYSTEM}|2186-2`,
    [UsCorePatientDemographicClaim.EthnicityText]: 'Conflicting categories',
  }), /us_core_patient_ethnicity_omb_category_cardinality/)
})
