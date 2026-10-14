/** Canonical HL7 v2-0203 CodeSystem used by FHIR Identifier.type coding. */
export const HL7_V2_0203_IDENTIFIER_TYPE_SYSTEM =
  'http://terminology.hl7.org/CodeSystem/v2-0203' as const

/** Published FHIR value set that selects commonly used Identifier.type codes. */
export const FHIR_IDENTIFIER_TYPE_VALUE_SET_URL =
  'https://hl7.org/fhir/valueset-identifier-type.html' as const

/** Normative registries used to validate the shared catalog. */
export const HL7_IDENTIFIER_REGISTRY_SOURCES = Object.freeze({
  CodeSystem: HL7_V2_0203_IDENTIFIER_TYPE_SYSTEM,
  FhirIdentifierTypeValueSet: FHIR_IDENTIFIER_TYPE_VALUE_SET_URL,
  Hl7TerminologySource:
    'https://terminology.hl7.org/6.5.0/CodeSystem-v2-0203.html' as const,
})

/**
 * Product-neutral person and healthcare identifier codes used by the shared
 * FHIR adapters. Contact points and veterinary identifiers belong to their
 * own standards and are deliberately absent.
 */
export const HL7_V2_0203_IDENTIFIER_CODES = Object.freeze({
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
} as const)

export type Hl7V20203IdentifierCode =
  typeof HL7_V2_0203_IDENTIFIER_CODES[keyof typeof HL7_V2_0203_IDENTIFIER_CODES]

/** Product-neutral organization identifier codes from the same CodeSystem. */
export const HL7_V2_0203_ORGANIZATION_IDENTIFIER_CODES = Object.freeze({
  TaxIdentifier: 'TAX',
  EmployerNumber: 'EN',
} as const)

export type Hl7V20203OrganizationIdentifierCode =
  typeof HL7_V2_0203_ORGANIZATION_IDENTIFIER_CODES[
    keyof typeof HL7_V2_0203_ORGANIZATION_IDENTIFIER_CODES
  ]
