// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import assert from 'node:assert/strict'
import test from 'node:test'
import * as fhir from '../dist/index.js'

const REQUIRED_CLAIM_CATALOGS = Object.freeze([
  'AllergyIntoleranceClaim',
  'AppointmentClaim',
  'AppointmentResponseClaim',
  'CarePlanClaim',
  'ClinicalImpressionClaim',
  'CommunicationClaim',
  'CommunicationRequestClaim',
  'CompositionClaim',
  'ConsentClaim',
  'ConditionClaim',
  'CoverageClaim',
  'DeviceClaim',
  'DeviceUseStatementClaim',
  'DiagnosticReportClaim',
  'DocumentReferenceClaim',
  'EncounterClaim',
  'FlagClaim',
  'ImmunizationClaim',
  'InvoiceClaim',
  'HealthcareServiceClaim',
  'LocationClaim',
  'MedicationStatementClaim',
  'ObservationClaim',
  'OrganizationClaim',
  'PractitionerRoleClaim',
  'ProcedureClaim',
  'RelatedPersonClaim',
  'ResearchSubjectClaim',
  'ServiceRequestClaim',
  'TaskClaim',
])

test('exports the complete product-neutral claims-first resource catalog', () => {
  for (const exportName of REQUIRED_CLAIM_CATALOGS) {
    assert.ok(fhir[exportName], `missing ${exportName}`)
  }
})

test('round-trips coded medication without dropping its research meaning', () => {
  // Exact FHIR wire fields and example values are the behavior under test.
  const resource = {
    resourceType: 'MedicationStatement',
    status: 'active',
    subject: { reference: 'Patient/research-subject' },
    medicationCodeableConcept: {
      coding: [{ system: 'http://www.whocc.no/atc', code: 'A10BA02', display: 'Metformin' }],
    },
  }
  const claims = fhir.medicationStatementFhirR4ToFlat(resource)
  assert.equal(claims[fhir.MedicationStatementClaim.Code], 'http://www.whocc.no/atc|A10BA02')
  assert.equal(fhir.medicationStatementFlatToFhirR4(claims).medicationCodeableConcept.coding[0].code, 'A10BA02')
})

test('round-trips coded Observation while keeping text and value separate', () => {
  // Exact FHIR wire fields and LOINC/UCUM examples are the behavior under test.
  const resource = {
    resourceType: 'Observation',
    status: 'final',
    subject: { reference: 'Patient/research-subject' },
    code: { coding: [{ system: 'http://loinc.org', code: '2339-0', display: 'Glucose' }] },
    valueQuantity: { value: 1.7, system: 'http://unitsofmeasure.org', code: 'mmol/L', unit: 'mmol/L' },
  }
  const claims = fhir.observationFhirR4ToFlat(resource)
  assert.equal(claims[fhir.ObservationClaim.Code], 'http://loinc.org|2339-0')
  assert.equal(fhir.observationFlatToFhirR4(claims).code.coding[0].code, '2339-0')
})

test('stores native Observation components as independently indexable Observation entries', () => {
  // Parent-child membership is explicit; deprecated containment flags and JSON-array claims are forbidden.
  const resource = {
    resourceType: 'Observation',
    id: 'blood-pressure-panel',
    status: 'final',
    subject: { reference: 'Patient/research-subject' },
    effectiveDateTime: '2026-09-21T10:00:00Z',
    code: { coding: [{ system: 'http://loinc.org', code: '85354-9', display: 'Blood pressure panel' }] },
    component: [
      {
        code: { coding: [{ system: 'http://loinc.org', code: '8480-6', display: 'Systolic blood pressure' }] },
        valueQuantity: { value: 120, system: 'http://unitsofmeasure.org', code: 'mm[Hg]', unit: 'mmHg' },
      },
      {
        code: { coding: [{ system: 'http://loinc.org', code: '8462-4', display: 'Diastolic blood pressure' }] },
        valueQuantity: { value: 80, system: 'http://unitsofmeasure.org', code: 'mm[Hg]', unit: 'mmHg' },
      },
    ],
  }

  const graph = fhir.observationFhirR4ToFlatGraph(resource, { parentEntryId: 'blood-pressure-panel' })
  assert.equal(graph.length, 3)
  assert.equal(
    graph[0].claims[fhir.ObservationClaim.HasMember],
    'Observation/blood-pressure-panel-component-1,Observation/blood-pressure-panel-component-2',
  )
  assert.equal(graph[1].claims[fhir.ObservationClaim.Code], 'http://loinc.org|8480-6')
  assert.equal(graph[1].claims[fhir.ObservationClaim.Status], undefined)
  assert.equal(graph[1].claims['Observation.is-contained'], undefined)
  assert.equal(graph[1].claims['Observation.contained-parent-reference'], undefined)
  assert.equal(graph[0].claims[fhir.ObservationClaim.ComponentCode], undefined)

  const projected = fhir.observationFlatGraphToFhirR4(graph, 'blood-pressure-panel')
  assert.equal(projected.component.length, 2)
  assert.equal(projected.component[0].code.coding[0].code, '8480-6')
  assert.equal(projected.component[1].valueQuantity.value, 80)
})

test('refuses to flatten component Observations into deprecated JSON-array claims', () => {
  assert.throws(
    () => fhir.observationFhirR4ToFlat({
      resourceType: 'Observation',
      component: [{ code: { coding: [{ system: 'http://loinc.org', code: '8480-6' }] } }],
    }),
    /observation_component_graph_required/,
  )
})

test('exports strict reusable FHIR value and search-parameter utilities', () => {
  for (const exportName of [
    'codingToToken',
    'tokenToCoding',
    'identifierToToken',
    'referenceToString',
    'quantityToToken',
    'parseFhirSearchParameter',
    'buildFhirSearchQuery',
    'readBundleResources',
  ]) {
    assert.equal(typeof fhir[exportName], 'function', `missing ${exportName}`)
  }
})

test('exports neutral contracts from their standards-based owner', () => {
  for (const exportName of [
    'ClinicalTerminologySystems',
    'ClinicalTerminologySourceScopes',
    'buildClinicalTerminologyCandidate',
    'buildImmunizationFlatGraph',
    'GroupR5SearchParameterCatalog',
    'normalizeGroupR5ResearchTeam',
    'normalizeGroupR5ProfessionalServiceTeam',
    'ResearchStudyR5SearchParameterCatalog',
    'normalizeResearchStudyR5FlatClaimsResource',
    'makeFhirToken',
    'escapeFhirSearchValue',
    'joinFhirOrList',
    'telecomToTokens',
    'classifyBundleResources',
    'findBundleResourceByReference',
  ]) {
    assert.ok(fhir[exportName], `missing ${exportName}`)
  }
})

test('keeps recovered token, telecom and bundle helpers strict and non-mutating', () => {
  assert.equal(fhir.makeFhirToken('http://loinc.org', '8310-5'), 'http://loinc.org|8310-5')
  assert.equal(fhir.joinFhirOrList(['a,b', 'c']), 'a\\,b,c')
  assert.deepEqual(
    fhir.telecomToTokens({ telecom: [{ system: 'phone', value: '+15555550123' }] }),
    ['phone|+15555550123'],
  )

  const patient = { resourceType: 'Patient', id: 'subject-1' }
  const observation = { resourceType: 'Observation', id: 'result-1' }
  const bundle = { resourceType: 'Bundle', type: 'collection', entry: [{ resource: patient }, { resource: observation }] }
  assert.deepEqual([...fhir.classifyBundleResources(bundle).keys()], ['Patient', 'Observation'])
  assert.equal(fhir.findBundleResourceByReference(bundle, 'Observation/result-1'), observation)
  assert.deepEqual(bundle, { resourceType: 'Bundle', type: 'collection', entry: [{ resource: patient }, { resource: observation }] })
})

test('builds the migrated cross-sector immunization graph from governed terminology', () => {
  const vaccine = fhir.buildClinicalTerminologyCandidate({
    source: fhir.ClinicalTerminologySourceScopes.Atc,
    system: fhir.ClinicalTerminologySystems.Atc,
    code: 'J07BB02',
    display: 'influenza, inactivated, split virus or surface antigen',
  })
  const graph = fhir.buildImmunizationFlatGraph({
    entryId: 'immunization-1',
    subjectReference: 'Patient/subject-1',
    administrationDate: '2026-09-21',
    vaccineCode: vaccine,
  })
  assert.equal(graph.length, 1)
  assert.equal(
    graph[0].claims[fhir.ImmunizationClaim.VaccineCode],
    `${fhir.ClinicalTerminologySystems.Atc}|J07BB02`,
  )
})

test('keeps migrated Group membership descriptive and ResearchStudy name searchable', () => {
  const group = fhir.normalizeGroupR5ResearchTeam({
    resourceType: 'Group',
    type: 'practitioner',
    membership: 'enumerated',
    member: [{ entity: { reference: 'PractitionerRole/member-1' } }],
  })
  assert.equal(group.member[0].entity.reference, 'PractitionerRole/member-1')
  assert.throws(
    () => fhir.normalizeGroupR5ResearchTeam({ ...group, authorization: 'permit' }),
    /group_authorization_property_forbidden/,
  )

  const claims = fhir.projectResearchStudyR5SearchClaims({
    resourceType: 'ResearchStudy',
    id: 'study-1',
    name: 'stable-study-name',
    status: 'active',
  })
  assert.deepEqual(claims['ResearchStudy.name'], ['stable-study-name'])
})
