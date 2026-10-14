// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  HealthcareServiceClaim,
  OrganizationClaim,
  buildDepartmentServicesFlatGraph,
  materializeClaimsFirstResourceToFhirR5,
} from '../dist/index.js'

test('builds one department with independently schedulable HealthcareServices', () => {
  const graph = buildDepartmentServicesFlatGraph({
    departmentId: 'blood-bank',
    departmentIdentifier: 'https://example.invalid/identifiers/departments|blood-bank',
    parentOrganizationReference: 'Organization/parent-organization',
    name: 'Blood bank',
    description: 'Blood-bank department.',
    organizationType: 'http://terminology.hl7.org/CodeSystem/organization-type|dept',
    services: [{
      serviceId: 'blood-donation',
      serviceIdentifier: 'https://example.invalid/identifiers/services|blood-donation',
      name: 'Blood donation',
      serviceType: ['https://example.invalid/CodeSystem/service-type|blood-donation'],
      locationReferences: ['Location/blood-donation-room'],
    }, {
      serviceId: 'plasma-donation',
      serviceIdentifier: 'https://example.invalid/identifiers/services|plasma-donation',
      name: 'Plasma donation',
      serviceType: ['https://example.invalid/CodeSystem/service-type|plasma-donation'],
      locationReferences: ['Location/plasma-donation-room'],
    }],
  })

  assert.equal(graph.length, 3)
  assert.deepEqual(Object.keys(graph[0]).sort(), ['id', 'meta', 'resourceType'])
  assert.equal(graph[0].resourceType, 'Organization')
  assert.equal(graph[0].meta.claims[OrganizationClaim.PartOf], 'Organization/parent-organization')
  assert.equal(graph[0].meta.claims[OrganizationClaim.Description], 'Blood-bank department.')
  assert.equal(graph[1].resourceType, 'HealthcareService')
  assert.equal(graph[1].id, 'blood-donation')
  assert.equal(graph[2].id, 'plasma-donation')
  assert.equal(graph[1].meta.claims[HealthcareServiceClaim.Organization], 'Organization/blood-bank')
  assert.equal(graph[2].meta.claims[HealthcareServiceClaim.Organization], 'Organization/blood-bank')
  assert.deepEqual(graph[1].meta.claims[HealthcareServiceClaim.Location], ['Location/blood-donation-room'])
  assert.deepEqual(graph[2].meta.claims[HealthcareServiceClaim.Location], ['Location/plasma-donation-room'])

  const materialized = materializeClaimsFirstResourceToFhirR5(graph[1])
  assert.deepEqual(materialized.type, [
    { coding: [{ system: 'https://example.invalid/CodeSystem/service-type', code: 'blood-donation' }] },
  ])
  assert.equal(materialized.name, 'Blood donation')
})

test('rejects split code fragments and ambiguous department references', () => {
  const valid = {
    departmentId: 'service-department',
    departmentIdentifier: 'https://example.invalid/identifiers/departments|service-department',
    parentOrganizationReference: 'Organization/parent-organization',
    name: 'Service department',
    services: [{
      serviceId: 'service-one',
      serviceIdentifier: 'https://example.invalid/identifiers/services|service-one',
      name: 'Service one',
      serviceType: ['http://terminology.hl7.org/CodeSystem/service-type|117'],
      locationReferences: ['Location/service-location'],
    }],
  }
  assert.throws(() => buildDepartmentServicesFlatGraph({
    ...valid,
    parentOrganizationReference: 'parent-organization',
  }), /department_service_parent_reference_invalid/)
  assert.throws(() => buildDepartmentServicesFlatGraph({
    ...valid,
    services: [{ ...valid.services[0], serviceType: ['117'] }],
  }), /department_service_type_invalid/)
  assert.throws(() => buildDepartmentServicesFlatGraph({
    ...valid,
    services: [{ ...valid.services[0], locationReferences: ['service-location'] }],
  }), /department_service_location_reference_invalid/)
  assert.throws(() => buildDepartmentServicesFlatGraph({
    ...valid,
    services: [valid.services[0], valid.services[0]],
  }), /department_service_id_duplicate/)
  assert.throws(() => buildDepartmentServicesFlatGraph({
    ...valid,
    services: [],
  }), /department_services_required/)
})
