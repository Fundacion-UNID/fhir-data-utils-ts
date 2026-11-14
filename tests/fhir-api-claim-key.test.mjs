// Flow contract: normalize version-neutral FHIR API claim syntax while rejecting foreign and version-specific vocabularies; syntax alone never grants catalogue membership or authority.
import test from 'node:test'
import assert from 'node:assert/strict'
import * as root from '../dist/index.js'
import * as helpers from '../dist/claim-helpers/index.js'
import { CommunicationClaim } from '../dist/claims/communication-claims.js'

test('normalizes fully qualified and short canonical claim names through one public helper', () => {
  assert.equal(typeof root.normalizeFhirApiClaimKey, 'function')
  assert.equal(helpers.normalizeFhirApiClaimKey, root.normalizeFhirApiClaimKey)
  const short = CommunicationClaim.Subject
  const full = `org.hl7.fhir.api.${short}`
  assert.equal(root.normalizeFhirApiClaimKey(full), short)
  assert.equal(root.normalizeFhirApiClaimKey(`  ${short}  `), short)
  assert.equal(root.normalizeFhirApiClaimKey('Communication.in-response-to'), 'Communication.in-response-to')
})

test('rejects version-specific namespaces and malformed names without case rewriting or invented mappings', () => {
  const normalize = root.normalizeFhirApiClaimKey
  assert.equal(typeof normalize, 'function')
  for (const input of ['org.hl7.fhir.r4.Communication.subject', 'org.hl7.fhir.r5.Communication.subject']) {
    assert.throws(() => normalize(input), /not version-specific key/)
  }
  for (const input of ['', ' ', 'communication.subject', 'Communication.Subject', 'Communication.subject.name',
    'Communication.-subject', 'Communication.subject-', 'org.schema.Person.name', '__proto__', 'constructor']) {
    assert.throws(() => normalize(input), /Invalid FHIR API claim key/)
  }
})

test('normalizes only syntax without pretending to check known resources or search parameters', () => {
  assert.equal(typeof root.normalizeFhirApiClaimKey, 'function')
  assert.equal(root.normalizeFhirApiClaimKey('CustomResource.custom-key'), 'CustomResource.custom-key')
})
