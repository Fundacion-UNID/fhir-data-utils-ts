// Flow contract: reuse package-owned fixtures and builders; never duplicate governed FHIR claim or example literals.
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CODING_REVIEW_EXAMPLES,
  applyFlatClaimCodingSelection,
  buildFlatClaimCodingReviewResource,
  codingReviewCategoryForResourceType,
  collectBatchCodingReviewItems,
  collectPendingBatchCodingReviewItems,
  deriveCodingDisplayClaim,
  deriveCodingLocalTextClaim,
  isCodingProposalPending,
} from '../dist/coding-review-flat-claims.js'

test('keeps local source text canonical while proposals target the coded claim', () => {
  const example = CODING_REVIEW_EXAMPLES.condition
  const resource = buildFlatClaimCodingReviewResource(example.input)

  assert.equal(resource.meta.claims[deriveCodingLocalTextClaim(example.input.targetClaim)], example.input.localText)
  assert.equal(resource.meta.claims[example.input.targetClaim], undefined)
  assert.equal(resource.meta.claims[deriveCodingDisplayClaim(example.input.targetClaim)], undefined)
  assert.equal(resource.meta.codingProposals[0].field, example.input.targetClaim)
  assert.equal(resource.meta.codingProposals[0].inputText, example.input.localText)
})

test('accepts a candidate without replacing the canonical imported local text', () => {
  const example = CODING_REVIEW_EXAMPLES.condition
  const accepted = applyFlatClaimCodingSelection(
    example.resource,
    example.resource.meta.codingProposals[0].id,
    example.resource.meta.codingProposals[0].candidates[0].id,
  )

  assert.deepEqual(accepted.meta.claims, example.expectedAcceptedClaims)
  assert.equal(accepted.meta.codingProposals[0].status, example.expectedAcceptedProposalStatus)
  assert.equal(accepted.meta.codingProposals[0].userSelected, true)
  assert.equal(
    accepted.meta.codingProposals[0].selectedCandidateId,
    example.resource.meta.codingProposals[0].candidates[0].id,
  )
  assert.equal(accepted.meta.claims[`${example.resource.resourceType}.userSelected`], 'true')
})

test('finds proposals on each contained resource without aggregating them on ResearchSubject meta', () => {
  const reviewItems = collectBatchCodingReviewItems(CODING_REVIEW_EXAMPLES.batch)

  assert.deepEqual(
    reviewItems.map(item => [item.researchSubjectId, item.resource.id, item.proposal.id]),
    CODING_REVIEW_EXAMPLES.expectedReviewIdentities,
  )
  for (const entry of CODING_REVIEW_EXAMPLES.batch.data) {
    assert.equal(entry.resource.meta.codingProposals, undefined)
  }
})

test('derives review workflow only from proposal status and groups canonical clinical families', () => {
  const proposed = CODING_REVIEW_EXAMPLES.condition.resource.meta.codingProposals[0]
  const acceptedResource = applyFlatClaimCodingSelection(
    CODING_REVIEW_EXAMPLES.condition.resource,
    proposed.id,
    proposed.candidates[0].id,
  )

  assert.equal(isCodingProposalPending(proposed), true)
  assert.equal(isCodingProposalPending(acceptedResource.meta.codingProposals[0]), false)
  assert.equal(collectPendingBatchCodingReviewItems(CODING_REVIEW_EXAMPLES.batch).length, 1)
  assert.equal(codingReviewCategoryForResourceType('AllergyIntolerance'), 'allergies-intolerances')
  assert.equal(codingReviewCategoryForResourceType('Procedure'), 'procedures')
  assert.equal(codingReviewCategoryForResourceType('Condition'), 'diagnostics')
  assert.equal(codingReviewCategoryForResourceType('DiagnosticReport'), 'diagnostics')
  assert.equal(codingReviewCategoryForResourceType('Observation'), 'diagnostics')
  assert.equal(codingReviewCategoryForResourceType('Immunization'), 'immunizations')
  assert.equal(codingReviewCategoryForResourceType('MedicationStatement'), 'other')
})
