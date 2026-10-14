// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  FHIR_IDENTIFIER_TYPE_VALUE_SET_URL,
  HL7_IDENTIFIER_REGISTRY_SOURCES,
  HL7_V2_0203_IDENTIFIER_CODES,
  HL7_V2_0203_IDENTIFIER_TYPE_SYSTEM,
  HL7_V2_0203_ORGANIZATION_IDENTIFIER_CODES,
} from '../dist/hl7-v2-0203-identifier-types.js'
import * as publicSurface from 'fhir-data-utils-ts/hl7-v2-0203-identifier-types'

test('owns the canonical HL7 v2-0203 person and healthcare identifier codes', () => {
  // These exact standard codes are the interoperability contract under test.
  assert.deepEqual(HL7_V2_0203_IDENTIFIER_CODES, {
    DriverLicense: 'DL',
    CitizenshipCard: 'CZ',
    NationalNumber: 'NN',
    PassportNumber: 'PPN',
    JurisdictionalHealthNumber: 'JHN',
    PermanentResidentCard: 'PRC',
    WorkPermit: 'WP',
    StudyPermit: 'SP',
    Visa: 'VS',
    VisitorPermit: 'VP',
    TemporaryPermanentResident: 'TPR',
    HealthCard: 'HC',
    MemberNumber: 'MB',
    SubscriberNumber: 'SN',
    DonorRecord: 'DR',
    PatientIdentifier: 'PI',
  })
  assert.equal(HL7_V2_0203_IDENTIFIER_TYPE_SYSTEM, 'http://terminology.hl7.org/CodeSystem/v2-0203')
  assert.equal(FHIR_IDENTIFIER_TYPE_VALUE_SET_URL, 'https://hl7.org/fhir/valueset-identifier-type.html')
  assert.deepEqual(HL7_V2_0203_ORGANIZATION_IDENTIFIER_CODES, {
    TaxIdentifier: 'TAX',
    EmployerNumber: 'EN',
  })
  assert.deepEqual(HL7_IDENTIFIER_REGISTRY_SOURCES, {
    CodeSystem: 'http://terminology.hl7.org/CodeSystem/v2-0203',
    FhirIdentifierTypeValueSet: 'https://hl7.org/fhir/valueset-identifier-type.html',
    Hl7TerminologySource: 'https://terminology.hl7.org/6.5.0/CodeSystem-v2-0203.html',
  })
})

test('publishes the same canonical objects through the supported package subpath', () => {
  assert.equal(publicSurface.HL7_V2_0203_IDENTIFIER_CODES, HL7_V2_0203_IDENTIFIER_CODES)
  assert.equal(publicSurface.HL7_V2_0203_IDENTIFIER_TYPE_SYSTEM, HL7_V2_0203_IDENTIFIER_TYPE_SYSTEM)
  assert.equal(
    publicSurface.HL7_V2_0203_ORGANIZATION_IDENTIFIER_CODES,
    HL7_V2_0203_ORGANIZATION_IDENTIFIER_CODES,
  )
})
