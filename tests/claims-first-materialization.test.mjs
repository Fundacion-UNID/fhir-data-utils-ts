// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  HealthcareServiceClaim,
  LocationClaim,
  OrganizationClaim,
  materializeClaimsFirstResourceToFhirR5,
} from '../dist/index.js'

const PARENT_ORGANIZATION = 'Organization/parent-organization'
const DEPARTMENT_ORGANIZATION = 'Organization/service-department'
const SERVICE_LOCATION = 'Location/service-location'

test('materializes Organization, HealthcareService and Location only from canonical flat claims', () => {
  const organization = materializeClaimsFirstResourceToFhirR5({
    resourceType: 'Organization',
    id: 'service-department',
    meta: { claims: {
      [OrganizationClaim.Identifier]: 'https://example.org/identifiers/departments|service-department',
      [OrganizationClaim.Active]: 'true',
      [OrganizationClaim.Type]: 'http://terminology.hl7.org/CodeSystem/organization-type|dept',
      [OrganizationClaim.Name]: 'Service department',
      [OrganizationClaim.PartOf]: PARENT_ORGANIZATION,
    } },
  })
  assert.deepEqual(organization.identifier, [{
    system: 'https://example.org/identifiers/departments',
    value: 'service-department',
  }])
  assert.deepEqual(organization.type, [{ coding: [{
    system: 'http://terminology.hl7.org/CodeSystem/organization-type',
    code: 'dept',
  }] }])
  assert.deepEqual(organization.partOf, { reference: PARENT_ORGANIZATION })

  const healthcareService = materializeClaimsFirstResourceToFhirR5({
    resourceType: 'HealthcareService',
    id: 'service-department',
    meta: { claims: {
      [HealthcareServiceClaim.Identifier]: 'https://example.org/identifiers/services|service-department',
      [HealthcareServiceClaim.Active]: 'true',
      [HealthcareServiceClaim.Organization]: DEPARTMENT_ORGANIZATION,
      [HealthcareServiceClaim.ServiceType]: 'http://terminology.hl7.org/CodeSystem/service-type|117',
      [HealthcareServiceClaim.Specialty]: 'http://loinc.org|LP172940-1',
      [HealthcareServiceClaim.Location]: SERVICE_LOCATION,
      [HealthcareServiceClaim.Name]: 'Emergency care',
    } },
  })
  assert.deepEqual(healthcareService.type, [{ coding: [{
    system: 'http://terminology.hl7.org/CodeSystem/service-type',
    code: '117',
  }] }])
  assert.deepEqual(healthcareService.specialty, [{ coding: [{
    system: 'http://loinc.org',
    code: 'LP172940-1',
  }] }])
  assert.deepEqual(healthcareService.location, [{ reference: SERVICE_LOCATION }])

  const location = materializeClaimsFirstResourceToFhirR5({
    resourceType: 'Location',
    id: 'service-location',
    meta: { claims: {
      [LocationClaim.Identifier]: 'https://example.org/identifiers/locations|service-location',
      [LocationClaim.Status]: 'active',
      [LocationClaim.Name]: 'Service location',
      [LocationClaim.ManagingOrganization]: DEPARTMENT_ORGANIZATION,
      [LocationClaim.PositionLongitude]: '-1.25',
      [LocationClaim.PositionLatitude]: '2.5',
    } },
  })
  assert.deepEqual(location.identifier, [{
    system: 'https://example.org/identifiers/locations',
    value: 'service-location',
  }])
  assert.deepEqual(location.position, { longitude: -1.25, latitude: 2.5 })
})

test('rejects nested native FHIR state beside identity and meta.claims', () => {
  assert.throws(() => materializeClaimsFirstResourceToFhirR5({
    resourceType: 'HealthcareService',
    id: 'service-department',
    type: [{ coding: [{ code: '117' }] }],
    meta: { claims: {
      [HealthcareServiceClaim.Identifier]: 'https://example.org/identifiers/services|service-department',
    } },
  }), /claims_first_resource_nested_fhir_forbidden/)
})

test('rejects unsupported resources instead of guessing a FHIR materializer', () => {
  assert.throws(() => materializeClaimsFirstResourceToFhirR5({
    resourceType: 'Service',
    id: 'offering',
    meta: { claims: { 'org.schema.Service.identifier.value': 'offering' } },
  }), /claims_first_resource_type_unsupported/)
})
