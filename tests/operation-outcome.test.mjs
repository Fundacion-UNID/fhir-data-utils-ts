// Flow contract: standard OperationOutcome issue codes remain neutral, immutable FHIR vocabulary without HTTP or authorization policy.
import assert from 'node:assert/strict'
import test from 'node:test'
import * as fhir from '../dist/index.js'

test('exposes the published R5 issue vocabulary with exact code membership', () => {
  assert.equal(typeof fhir.IssueType, 'object')
  assert.equal(fhir.FHIR_ISSUE_TYPE_SYSTEM, 'http://hl7.org/fhir/issue-type')
  assert.deepEqual(Object.values(fhir.IssueType).sort(), [
    'invalid', 'structure', 'required', 'value', 'invariant', 'security', 'login',
    'unknown', 'expired', 'forbidden', 'suppressed', 'processing', 'not-supported',
    'duplicate', 'multiple-matches', 'not-found', 'deleted', 'too-long',
    'code-invalid', 'extension', 'too-costly', 'business-rule', 'conflict',
    'limited-filter', 'transient', 'lock-error', 'no-store', 'exception', 'timeout',
    'incomplete', 'throttled', 'informational', 'success',
  ].sort())
  for (const code of Object.values(fhir.IssueType)) assert.equal(fhir.isIssueTypeCode(code), true)
  for (const value of ['Forbidden', 'FORBIDDEN', 'toString', '', undefined, {}, 403]) {
    assert.equal(fhir.isIssueTypeCode(value), false)
  }
  assert.equal(Object.isFrozen(fhir.IssueType), true)
})

test('distinguishes issue severity from issue type and keeps transport policy downstream', () => {
  assert.equal(typeof fhir.IssueSeverity, 'object')
  assert.equal(fhir.FHIR_ISSUE_SEVERITY_SYSTEM, 'http://hl7.org/fhir/issue-severity')
  assert.deepEqual(Object.values(fhir.IssueSeverity).sort(), ['fatal', 'error', 'warning', 'information', 'success'].sort())
  assert.equal(fhir.IssueLevel, fhir.IssueSeverity)
  for (const code of Object.values(fhir.IssueSeverity)) assert.equal(fhir.isIssueSeverityCode(code), true)
  for (const value of ['forbidden', 'Error', 'toString', '', undefined, 500]) {
    assert.equal(fhir.isIssueSeverityCode(value), false)
  }
  assert.equal(Object.isFrozen(fhir.IssueSeverity), true)
  assert.equal(fhir.IssueTypeToHttpStatus, undefined)
  assert.equal(fhir.ManagerError, undefined)
})
