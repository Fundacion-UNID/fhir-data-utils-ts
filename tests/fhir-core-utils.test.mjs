// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import assert from 'node:assert/strict'
import test from 'node:test'
import * as fhir from '../dist/index.js'

test('FHIR value helpers round-trip coding, identifier, reference and quantity primitives', () => {
  const coding = { system: 'http://loinc.org', code: '8310-5' }
  assert.equal(fhir.codingToToken(coding), 'http://loinc.org|8310-5')
  assert.deepEqual(fhir.tokenToCoding('http://loinc.org|8310-5'), coding)
  assert.deepEqual(fhir.tokenToCoding('8310-5'), { code: '8310-5' })
  assert.equal(fhir.codingToToken({}), undefined)
  assert.equal(fhir.tokenToCoding(' '), undefined)

  const identifier = { system: 'urn:ietf:rfc:3986', value: 'urn:uuid:identifier-1' }
  assert.equal(fhir.identifierToToken(identifier), 'urn:ietf:rfc:3986|urn:uuid:identifier-1')
  assert.deepEqual(fhir.tokenToIdentifier('urn:ietf:rfc:3986|urn:uuid:identifier-1'), identifier)
  assert.equal(fhir.identifierToToken({}), undefined)

  assert.equal(fhir.referenceToString({ reference: 'Patient/subject-1' }), 'Patient/subject-1')
  assert.deepEqual(fhir.stringToReference('Patient/subject-1'), { reference: 'Patient/subject-1' })
  assert.equal(fhir.stringToReference(' '), undefined)

  const quantity = { value: 37.2, system: 'http://unitsofmeasure.org', code: 'Cel' }
  assert.equal(fhir.quantityToToken(quantity), '37.2|http://unitsofmeasure.org|Cel')
  assert.deepEqual(fhir.tokenToQuantity('37.2|http://unitsofmeasure.org|Cel'), { ...quantity, unit: 'Cel' })
  assert.equal(fhir.quantityToToken({ value: Number.NaN }), undefined)
  assert.throws(() => fhir.tokenToQuantity('not-a-number||Cel'), /fhir_quantity_token_invalid/)
})

test('typed search parsing preserves decimals, prefixes, systems, units and repeated AND parameters', () => {
  const parsed = [
    fhir.parseFhirSearchParameter({ name: 'code', type: 'token', value: 'http://loinc.org|8310-5' }),
    fhir.parseFhirSearchParameter({ name: 'value-quantity', type: 'quantity', value: 'ge37.2|http://unitsofmeasure.org|Cel' }),
    fhir.parseFhirSearchParameter({ name: 'probability', type: 'number', value: 'lt0.75' }),
    fhir.parseFhirSearchParameter({ name: 'date', type: 'date', value: 'sa2026-09-21' }),
    fhir.parseFhirSearchParameter({ name: 'subject', type: 'reference', value: 'Patient/subject-1' }),
  ]
  assert.equal(parsed[1].value, 37.2)
  assert.equal(parsed[1].prefix, 'ge')
  assert.equal(parsed[1].unit, 'Cel')
  const query = fhir.buildFhirSearchQuery([...parsed, parsed[0]])
  const params = new URLSearchParams(query)
  assert.deepEqual(params.getAll('code'), ['http://loinc.org|8310-5', 'http://loinc.org|8310-5'])
  assert.equal(params.get('value-quantity'), 'ge37.2|http://unitsofmeasure.org|Cel')
  assert.throws(() => fhir.parseFhirSearchParameter({ name: 'x', type: 'number', value: 'NaN' }), /fhir_search_number_invalid/)
  assert.throws(() => fhir.parseFhirSearchParameter({ name: 'x', type: 'quantity', value: 'bad||kg' }), /fhir_search_quantity_invalid/)
  assert.throws(() => fhir.parseFhirSearchParameter({ name: ' ', type: 'string', value: 'x' }), /fhir_search_name_required/)
})

test('generic fallback flattens and inflates unsupported resources without persisting nested meta claims', () => {
  const resource = {
    resourceType: 'Basic',
    id: 'basic-1',
    active: true,
    count: 2,
    code: { coding: [{ system: 'http://example.test/codes', code: 'example' }] },
    meta: { versionId: '1', claims: { forbidden: 'nested-source' } },
  }
  const claims = fhir.fhirResourceToFlatClaims(resource)
  assert.equal(claims['Basic.active'], 'true')
  assert.equal(claims['Basic.active#type'], 'boolean')
  assert.equal(claims['Basic.count#type'], 'number')
  assert.equal(claims['Basic.meta.versionId'], '1')
  assert.equal(claims['Basic.meta.claims.forbidden'], undefined)
  assert.deepEqual(fhir.flatClaimsToFhirResource(claims), {
    resourceType: 'Basic',
    id: 'basic-1',
    active: true,
    count: 2,
    code: { coding: [{ system: 'http://example.test/codes', code: 'example' }] },
    meta: { versionId: '1' },
  })
  assert.throws(() => fhir.fhirResourceToFlatClaims({}), /resourceType/)
  assert.throws(() => fhir.flatClaimsToFhirResource({ '@context': 'org.hl7.fhir.api' }), /contextualized resource claim/)
})

test('Bundle helpers read, classify, walk contained resources and resolve every supported reference form', () => {
  const contained = { resourceType: 'Observation', id: 'contained-1' }
  const patient = { resourceType: 'Patient', id: 'subject-1', contained: [contained] }
  const condition = { resourceType: 'Condition', id: 'condition-1' }
  const bundle = {
    resourceType: 'Bundle',
    type: 'collection',
    entry: [
      { fullUrl: 'urn:uuid:subject-1', resource: patient },
      { resource: condition },
      { request: { method: 'POST', url: 'Observation' } },
    ],
  }
  assert.deepEqual(fhir.readBundleResources(bundle), [patient, condition])
  assert.deepEqual(fhir.findBundleResources(bundle, 'Condition'), [condition])
  assert.deepEqual(fhir.walkBundleResources(bundle), [patient, contained, condition])
  assert.equal(fhir.classifyBundleResources(bundle).get('Patient')[0], patient)
  assert.equal(fhir.findBundleResourceByReference(bundle, 'urn:uuid:subject-1'), patient)
  assert.equal(fhir.findBundleResourceByReference(bundle, 'Condition/condition-1'), condition)
  assert.equal(fhir.findBundleResourceByReference(bundle, 'condition-1'), condition)
  assert.equal(fhir.findBundleResourceByReference(bundle, 'Condition/missing'), undefined)
  assert.throws(() => fhir.findBundleResourceByReference(bundle, ' '), /fhir_reference_required/)
  assert.throws(() => fhir.readBundleResources({ resourceType: 'Patient' }), /fhir_bundle_required/)
})

test('shared converter primitives validate required claims and actor identifiers', () => {
  assert.equal(fhir.isPlainObject({}), true)
  assert.equal(fhir.isPlainObject([]), false)
  assert.deepEqual(fhir.codingFromValue('http://loinc.org|8310-5'), [{ system: 'http://loinc.org', code: '8310-5' }])
  assert.deepEqual(fhir.codingFromValue('8310-5'), [{ code: '8310-5' }])
  assert.equal(fhir.codingToValue({ system: 'http://loinc.org', code: '8310-5' }), 'http://loinc.org|8310-5')
  assert.equal(fhir.referenceListToCsv([{ reference: 'Patient/1' }, {}]), 'Patient/1')
  assert.equal(fhir.codingListToCsv([{ system: 'http://loinc.org', code: '8310-5' }, {}]), 'http://loinc.org|8310-5')
  assert.equal(fhir.requireClaim({ required: 'value' }, 'required'), 'value')
  assert.throws(() => fhir.requireClaim({}, 'required'), /Missing required claim/)
  assert.doesNotThrow(() => fhir.requireSubjectIdentifier('urn:uuid:subject-1', 'subject'))
  assert.throws(() => fhir.requireSubjectIdentifier('Patient/subject-1', 'subject'), /Invalid subject/)
  assert.doesNotThrow(() => fhir.requireDidWeb('did:web:example.test:actor:1', 'actor'))
  assert.throws(() => fhir.requireDidWeb('urn:uuid:actor-1', 'actor'), /Invalid actor/)
})
