/** Repository-safe synthetic IPS document used by portal demos and visual tests. */

const LOINC_SYSTEM = 'http://loinc.org'
const SNOMED_SYSTEM = 'http://snomed.info/sct'
const SUBJECT_REFERENCE = 'Patient/jane-doe-demo'

const sectionDefinitions = Object.freeze([
  ['11450-4', 'Problem list', 'Condition', 'Hypertensive disorder'],
  ['48765-2', 'Allergies and adverse reactions', 'AllergyIntolerance', 'Penicillin allergy'],
  ['10160-0', 'History of medication use', 'MedicationStatement', 'Metformin therapy'],
  ['11369-6', 'History of immunization', 'Immunization', 'Influenza immunization'],
  ['30954-2', 'Relevant diagnostic tests and laboratory data', 'DiagnosticReport', 'Emergency laboratory panel'],
  ['47519-4', 'History of procedures', 'Procedure', 'Appendectomy'],
  ['46264-8', 'History of medical device use', 'DeviceUseStatement', 'Corrective lens use'],
  ['8716-3', 'Vital signs', 'Observation', 'Oxygen saturation'],
  ['29762-2', 'Social history', 'Observation', 'Tobacco use assessment'],
  ['104605-1', 'Alerts', 'Flag', 'Fall risk'],
  ['81338-6', 'Goals and preferences', 'Goal', 'Maintain independent mobility'],
  ['42348-3', 'Advance directives', 'Consent', 'Advance care directive'],
  ['47420-5', 'Functional status', 'ClinicalImpression', 'Independent daily activities'],
  ['11348-0', 'History of past illness', 'Condition', 'Resolved viral infection'],
  ['10162-6', 'Pregnancy history', 'Observation', 'Not pregnant'],
  ['18776-5', 'Plan of care', 'CarePlan', 'Emergency follow-up plan'],
] as const)

/** Canonical LOINC section codes used by the reusable IPS reader and editors. */
export const FHIR_IPS_SECTION_CODES = Object.freeze({
  Problems: sectionDefinitions[0][0],
  Allergies: sectionDefinitions[1][0],
  Medications: sectionDefinitions[2][0],
  Immunizations: sectionDefinitions[3][0],
  DiagnosticResults: sectionDefinitions[4][0],
  Procedures: sectionDefinitions[5][0],
  MedicalDevices: sectionDefinitions[6][0],
  VitalSigns: sectionDefinitions[7][0],
  SocialHistory: sectionDefinitions[8][0],
  Alerts: sectionDefinitions[9][0],
  Goals: sectionDefinitions[10][0],
  AdvanceDirectives: sectionDefinitions[11][0],
  FunctionalStatus: sectionDefinitions[12][0],
  PastIllness: sectionDefinitions[13][0],
  PregnancyHistory: sectionDefinitions[14][0],
  PlanOfCare: sectionDefinitions[15][0],
} as const)

/** Primary IPS section placement for the minimum shared clinical authoring forms. */
export const FHIR_IPS_PRIMARY_AUTHORING_SECTION_CODE_BY_RESOURCE_TYPE = Object.freeze({
  Condition: FHIR_IPS_SECTION_CODES.Problems,
  AllergyIntolerance: FHIR_IPS_SECTION_CODES.Allergies,
  MedicationStatement: FHIR_IPS_SECTION_CODES.Medications,
  Immunization: FHIR_IPS_SECTION_CODES.Immunizations,
  Procedure: FHIR_IPS_SECTION_CODES.Procedures,
  Observation: FHIR_IPS_SECTION_CODES.VitalSigns,
} as const)

type SectionDefinition = typeof sectionDefinitions[number]

function concept(text: string, code: string) {
  return { text, coding: [{ system: SNOMED_SYSTEM, code, display: text }] }
}

function clinicalResource([sectionCode, , resourceType, title]: SectionDefinition, index: number) {
  const id = `ips-demo-${sectionCode.replace(/\D/g, '')}-${index + 1}`
  const common = { resourceType, id, status: resourceType === 'Goal' ? 'active' : 'final', subject: { reference: SUBJECT_REFERENCE } }
  const coded = concept(title, String(100000 + index))

  switch (resourceType) {
    case 'AllergyIntolerance':
      return { ...common, patient: common.subject, clinicalStatus: { text: 'Active' }, verificationStatus: { text: 'Confirmed' }, code: coded }
    case 'MedicationStatement':
      return { ...common, status: 'active', medicationCodeableConcept: coded, effectiveDateTime: '2026-09-01T08:00:00Z' }
    case 'Immunization':
      return { ...common, status: 'completed', patient: common.subject, vaccineCode: coded, occurrenceDateTime: '2026-04-10T10:00:00Z' }
    case 'DiagnosticReport':
      return { ...common, status: 'final', code: coded, effectiveDateTime: '2026-09-30T09:20:00Z' }
    case 'Procedure':
      return { ...common, status: 'completed', code: coded, performedDateTime: '2019-06-12T10:00:00Z' }
    case 'DeviceUseStatement':
      return { ...common, status: 'active', device: { display: title } }
    case 'Observation':
      return sectionCode === '8716-3'
        ? { ...common, code: coded, effectiveDateTime: '2026-09-30T10:15:00Z', valueQuantity: { value: 97, unit: '%', system: 'http://unitsofmeasure.org', code: '%' } }
        : { ...common, code: coded, effectiveDateTime: '2026-09-01T08:00:00Z', valueCodeableConcept: concept(title, String(200000 + index)) }
    case 'Flag':
      return { ...common, status: 'active', code: coded }
    case 'Goal':
      return { ...common, lifecycleStatus: 'active', description: coded }
    case 'Consent':
      return { ...common, status: 'active', scope: concept('Advance care', '385431004'), category: [coded], patient: common.subject }
    case 'ClinicalImpression':
      return { ...common, status: 'completed', description: title, summary: title }
    case 'CarePlan':
      return { ...common, status: 'active', intent: 'plan', title, category: [coded] }
    default:
      return { ...common, clinicalStatus: { text: sectionCode === '11348-0' ? 'Resolved' : 'Active' }, code: coded }
  }
}

const clinicalResources = sectionDefinitions.map(clinicalResource)

const composition = Object.freeze({
  resourceType: 'Composition',
  id: 'ips-all-sections-demo',
  status: 'final',
  type: { coding: [{ system: LOINC_SYSTEM, code: '60591-5', display: 'Patient summary document' }] },
  subject: { reference: SUBJECT_REFERENCE },
  date: '2026-09-30T10:20:00Z',
  author: [{ reference: 'Organization/demo-hospital' }],
  title: 'International Patient Summary',
  section: sectionDefinitions.map(([code, title], index) => ({
    title,
    code: { coding: [{ system: LOINC_SYSTEM, code, display: title }] },
    entry: [{ reference: `${clinicalResources[index].resourceType}/${clinicalResources[index].id}` }],
  })),
})

/**
 * Complete synthetic IPS screen fixture.
 *
 * It intentionally uses `Doe`, contains no telephone number, and covers the
 * sixteen clinical sections in the official IPS all-sections order. It is
 * presentation/test data only and never represents authorization or consent.
 */
export const FHIR_IPS_ALL_SECTIONS_DEMO_DATA = Object.freeze({
  subject: Object.freeze({
    reference: SUBJECT_REFERENCE,
    givenName: 'Jane',
    familyName: 'Doe',
    displayName: 'Jane Doe',
  }),
  sectionCount: sectionDefinitions.length,
  bundle: Object.freeze({
    resourceType: 'Bundle',
    id: 'bundle-ips-all-sections-demo',
    type: 'document',
    timestamp: '2026-09-30T10:20:00Z',
    entry: Object.freeze([
      { fullUrl: 'Composition/ips-all-sections-demo', resource: composition },
      {
        fullUrl: SUBJECT_REFERENCE,
        resource: {
          resourceType: 'Patient',
          id: 'jane-doe-demo',
          name: [{ given: ['Jane'], family: 'Doe' }],
        },
      },
      {
        fullUrl: 'Organization/demo-hospital',
        resource: { resourceType: 'Organization', id: 'demo-hospital', name: 'Demo Hospital' },
      },
      ...clinicalResources.map(resource => ({ fullUrl: `${resource.resourceType}/${resource.id}`, resource })),
    ]),
  }),
})
