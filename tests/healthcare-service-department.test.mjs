// Copyright 2026 Conéctate Soluciones y Aplicaciones SL under the Apache License, Version 2.0.
// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  HealthcareServiceClaim,
  HealthcareServiceR4SearchParameterCatalog,
  LocationClaim,
  healthcareServiceFhirR4ToFlat,
  healthcareServiceFlatToFhirR4,
  locationFhirR4ToFlat,
  locationFlatToFhirR4,
  normalizeGroupR5ProfessionalServiceTeam,
} from '../dist/index.js'
import {
  ClinicalSpecialtyMappingEquivalence,
  SnomedC80ToLoincSpecialtyConceptMap,
  findAutomaticLoincSpecialty,
} from '../dist/healthcare-service-specialty-map.js'

const ORGANIZATION = 'Organization/veterinary-hospital-1'
const DEPARTMENT = 'Organization/emergency-department-1'
const LOCATION = 'Location/emergency-room-1'

test('round-trips the official R4 HealthcareService search surface without merging department and service', () => {
  assert.deepEqual(
    HealthcareServiceR4SearchParameterCatalog.map(parameter => parameter.claim),
    Object.values(HealthcareServiceClaim).filter(claim => ![
      HealthcareServiceClaim.Comment,
      HealthcareServiceClaim.AppointmentRequired,
    ].includes(claim)),
  )
  const claims = {
    [HealthcareServiceClaim.Identifier]: 'urn:uuid:healthcare-service-1',
    [HealthcareServiceClaim.Active]: 'true',
    [HealthcareServiceClaim.Organization]: DEPARTMENT,
    [HealthcareServiceClaim.ServiceCategory]: 'http://terminology.hl7.org/CodeSystem/service-category|1',
    [HealthcareServiceClaim.ServiceType]: 'http://terminology.hl7.org/CodeSystem/service-type|117',
    [HealthcareServiceClaim.Specialty]: 'http://loinc.org|LP172940-1',
    [HealthcareServiceClaim.Location]: LOCATION,
    [HealthcareServiceClaim.Name]: 'Veterinary emergency care',
    [HealthcareServiceClaim.Comment]: 'Emergency assessment and stabilization.',
    [HealthcareServiceClaim.AppointmentRequired]: 'true',
    [HealthcareServiceClaim.Characteristic]: 'https://example.invalid/fhir/CodeSystem/service-characteristic|24-hours',
    [HealthcareServiceClaim.Program]: 'https://example.invalid/fhir/CodeSystem/program|emergency-response',
    [HealthcareServiceClaim.CoverageArea]: 'Location/british-columbia',
    [HealthcareServiceClaim.Endpoint]: 'Endpoint/emergency-group-inbox',
  }

  const resource = healthcareServiceFlatToFhirR4(claims)
  assert.equal(resource.resourceType, 'HealthcareService')
  assert.deepEqual(resource.providedBy, { reference: DEPARTMENT })
  assert.deepEqual(resource.location, [{ reference: LOCATION }])
  assert.deepEqual(resource.specialty, [{ coding: [{ system: 'http://loinc.org', code: 'LP172940-1' }] }])
  assert.equal(resource.appointmentRequired, true)
  assert.deepEqual(healthcareServiceFhirR4ToFlat(resource), claims)
  assert.notEqual(resource.providedBy.reference, ORGANIZATION)
})

test('round-trips official Location coordinates for a department service place', () => {
  const claims = {
    [LocationClaim.Identifier]: 'urn:uuid:emergency-room-1',
    [LocationClaim.Status]: 'active',
    [LocationClaim.Name]: 'Emergency entrance',
    [LocationClaim.ManagingOrganization]: DEPARTMENT,
    [LocationClaim.PositionLongitude]: '-123.1207',
    [LocationClaim.PositionLatitude]: '49.2827',
    [LocationClaim.PositionAltitude]: '12.5',
  }
  const resource = locationFlatToFhirR4(claims)
  assert.deepEqual(resource.position, { longitude: -123.1207, latitude: 49.2827, altitude: 12.5 })
  assert.deepEqual(
    Object.fromEntries(Object.entries(locationFhirR4ToFlat(resource)).filter(([, value]) => value !== undefined)),
    claims,
  )
})

test('keeps the complete supplied C80 mapping evidence and automates strict equivalence only', () => {
  assert.equal(SnomedC80ToLoincSpecialtyConceptMap.length, 115)
  assert.equal(new Set(SnomedC80ToLoincSpecialtyConceptMap.map(item => item.snomedCode)).size, 115)

  const exact = findAutomaticLoincSpecialty('421661004')
  assert.deepEqual(exact, {
    system: 'http://loinc.org',
    code: 'LP172920-3',
    display: 'Blood banking and transfusion medicine',
  })
  assert.equal(findAutomaticLoincSpecialty('408467006'), undefined)
  assert.equal(findAutomaticLoincSpecialty('394601005'), undefined)

  const broader = SnomedC80ToLoincSpecialtyConceptMap.find(item => item.snomedCode === '408467006')
  assert.equal(broader?.equivalence, ClinicalSpecialtyMappingEquivalence.Wider)
  assert.equal(broader?.automatic, false)
  const absent = SnomedC80ToLoincSpecialtyConceptMap.find(item => item.snomedCode === '394601005')
  assert.equal(absent?.equivalence, ClinicalSpecialtyMappingEquivalence.Unmatched)
})

test('binds one professional service group to exactly one department organization', () => {
  const team = normalizeGroupR5ProfessionalServiceTeam({
    resourceType: 'Group',
    id: 'emergency-team',
    type: 'practitioner',
    membership: 'enumerated',
    managingEntity: { reference: DEPARTMENT, type: 'Organization' },
    member: [{ entity: { reference: 'PractitionerRole/veterinarian-1' } }],
  })
  assert.deepEqual(team.managingEntity, { reference: DEPARTMENT, type: 'Organization' })
  assert.throws(() => normalizeGroupR5ProfessionalServiceTeam({
    ...team,
    managingEntity: [team.managingEntity, { reference: ORGANIZATION }],
  }), /group_professional_service_managing_organization_invalid/)
  assert.throws(() => normalizeGroupR5ProfessionalServiceTeam({
    ...team,
    managingEntity: { reference: 'HealthcareService/emergency' },
  }), /group_professional_service_managing_organization_invalid/)
})
