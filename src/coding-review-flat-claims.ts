import { buildFlatClaimResourceEntry } from './flat-claim-resource-graph.js'

export type FlatClaimCodingCandidate = Readonly<{
  id: string
  system: string
  code: string
  display: string
  localText?: string
}>

export type FlatClaimCodingProposal = Readonly<{
  id: string
  status: 'proposed' | 'accepted' | 'rejected' | 'deferred'
  field: string
  inputText: string
  language: string
  candidates: readonly FlatClaimCodingCandidate[]
  selectedCandidateId?: string
  userSelected?: boolean
}>

export type FlatClaimCodingReviewResource = Readonly<{
  resourceType: string
  id: string
  meta: Readonly<{
    claims: Readonly<Record<string, string>>
    codingProposals?: readonly FlatClaimCodingProposal[]
  }>
}>

export type ResearchSubjectCodingReviewEntry = Readonly<{
  resource: Readonly<{
    resourceType: 'ResearchSubject'
    id: string
    meta: Readonly<{ claims: Readonly<Record<string, string>>; codingProposals?: never }>
    contained: readonly FlatClaimCodingReviewResource[]
  }>
}>

export type FhirLikeCodingReviewBatch = Readonly<{
  resourceType: 'Bundle'
  type: 'batch'
  data: readonly ResearchSubjectCodingReviewEntry[]
}>

export type ContainedCodingReviewItem = Readonly<{
  researchSubjectId: string
  resource: FlatClaimCodingReviewResource
  proposal: FlatClaimCodingProposal
}>

export const CODING_REVIEW_CATEGORIES = Object.freeze({
  AllergiesIntolerances: 'allergies-intolerances',
  Procedures: 'procedures',
  Diagnostics: 'diagnostics',
  Immunizations: 'immunizations',
  Other: 'other',
} as const)

export type CodingReviewCategory = typeof CODING_REVIEW_CATEGORIES[keyof typeof CODING_REVIEW_CATEGORIES]

const CODING_REVIEW_RESOURCE_CATEGORIES: Readonly<Record<string, CodingReviewCategory>> = Object.freeze({
  AllergyIntolerance: CODING_REVIEW_CATEGORIES.AllergiesIntolerances,
  Procedure: CODING_REVIEW_CATEGORIES.Procedures,
  Condition: CODING_REVIEW_CATEGORIES.Diagnostics,
  DiagnosticReport: CODING_REVIEW_CATEGORIES.Diagnostics,
  Observation: CODING_REVIEW_CATEGORIES.Diagnostics,
  Immunization: CODING_REVIEW_CATEGORIES.Immunizations,
})

/** Map a FHIR resource type to its stable, product-neutral coding-review family. */
export function codingReviewCategoryForResourceType(resourceType: string): CodingReviewCategory {
  return CODING_REVIEW_RESOURCE_CATEGORIES[resourceType] ?? CODING_REVIEW_CATEGORIES.Other
}

/** A proposal remains reviewable until a reviewer accepts, rejects or defers it. */
export function isCodingProposalPending(proposal: FlatClaimCodingProposal): boolean {
  return proposal.status === 'proposed'
}

/** Return the canonical local-text companion for a code-like flat claim. */
export function deriveCodingLocalTextClaim(targetClaim: string): string {
  return `${requiredCodingTarget(targetClaim)}-text`
}

/** Return the official-display companion for a code-like flat claim. */
export function deriveCodingDisplayClaim(targetClaim: string): string {
  return `${requiredCodingTarget(targetClaim)}-display`
}

/**
 * Build a reviewable contained resource.
 *
 * Imported wording remains the canonical local `*-text` flat claim. The
 * proposal targets the code-like claim and is a sibling of `meta.claims`; it
 * never becomes a claim and is never copied to ResearchSubject metadata.
 */
export function buildFlatClaimCodingReviewResource(input: Readonly<{
  resourceType: string
  resourceId: string
  targetClaim: string
  localText: string
  language: string
  baseClaims: Readonly<Record<string, string>>
  proposalId: string
  candidates: readonly FlatClaimCodingCandidate[]
}>): FlatClaimCodingReviewResource {
  const targetClaim = requiredCodingTarget(input.targetClaim)
  const prefix = `${input.resourceType}.`
  if (!targetClaim.startsWith(prefix)) throw new TypeError('coding_target_resource_type_mismatch')
  const entry = buildFlatClaimResourceEntry({
    entryId: input.resourceId,
    resourceType: input.resourceType,
    claims: {
      ...input.baseClaims,
      [deriveCodingLocalTextClaim(targetClaim)]: requiredText(input.localText, 'coding_local_text_required'),
      [`${input.resourceType}.language`]: requiredText(input.language, 'coding_language_required'),
    },
  })
  const proposal: FlatClaimCodingProposal = Object.freeze({
    id: requiredText(input.proposalId, 'coding_proposal_id_required'),
    status: 'proposed',
    field: targetClaim,
    inputText: input.localText.trim(),
    language: input.language.trim(),
    candidates: Object.freeze(input.candidates.map(candidate => Object.freeze({ ...candidate }))),
  })
  return Object.freeze({
    resourceType: entry.resourceType,
    id: entry.entryId,
    meta: Object.freeze({ claims: entry.claims, codingProposals: Object.freeze([proposal]) }),
  })
}

/** Traverse every ResearchSubject entry and return resource-scoped proposals. */
export function collectBatchCodingReviewItems(batch: FhirLikeCodingReviewBatch): readonly ContainedCodingReviewItem[] {
  const items: ContainedCodingReviewItem[] = []
  for (const entry of batch.data) {
    for (const resource of entry.resource.contained) {
      for (const proposal of resource.meta.codingProposals ?? []) {
        items.push(Object.freeze({ researchSubjectId: entry.resource.id, resource, proposal }))
      }
    }
  }
  return Object.freeze(items)
}

/** Return only unresolved contained-resource proposals; resource userSelected is not workflow state. */
export function collectPendingBatchCodingReviewItems(
  batch: FhirLikeCodingReviewBatch,
): readonly ContainedCodingReviewItem[] {
  return Object.freeze(collectBatchCodingReviewItems(batch).filter(item => isCodingProposalPending(item.proposal)))
}

/**
 * Confirm one terminology candidate on the resource that owns the proposal.
 * The coded claim and official display are added while the imported local
 * `*-text` claim remains untouched for provenance and multilingual search.
 */
export function applyFlatClaimCodingSelection(
  resource: FlatClaimCodingReviewResource,
  proposalId: string,
  candidateId: string,
): FlatClaimCodingReviewResource {
  const proposals = resource.meta.codingProposals ?? []
  const proposalIndex = proposals.findIndex(proposal => proposal.id === proposalId)
  if (proposalIndex < 0) throw new TypeError('coding_proposal_not_found')
  const proposal = proposals[proposalIndex]
  const candidate = proposal.candidates.find(item => item.id === candidateId)
  if (!candidate) throw new TypeError('coding_candidate_not_found')

  const updatedProposal = Object.freeze({
    ...proposal,
    status: 'accepted' as const,
    selectedCandidateId: candidate.id,
    userSelected: true,
  })
  const updatedProposals = proposals.map((item, index) => (index === proposalIndex ? updatedProposal : item))
  return Object.freeze({
    ...resource,
    meta: Object.freeze({
      claims: Object.freeze({
        ...resource.meta.claims,
        [proposal.field]: `${candidate.system}|${candidate.code}`,
        [deriveCodingDisplayClaim(proposal.field)]: candidate.display,
        [`${resource.resourceType}.userSelected`]: 'true',
      }),
      codingProposals: Object.freeze(updatedProposals),
    }),
  })
}

const RESEARCH_SUBJECT_EXAMPLE_ID = '00000000-0000-4000-8000-000000000101'
const CONDITION_EXAMPLE_ID = '00000000-0000-4000-8000-000000000102'
const CONDITION_PROPOSAL_EXAMPLE_ID = 'condition-code-proposal-example'
const CONDITION_CANDIDATE_EXAMPLE_ID = 'condition-candidate-example'

const CONDITION_EXAMPLE_INPUT = Object.freeze({
  resourceType: 'Condition',
  resourceId: CONDITION_EXAMPLE_ID,
  targetClaim: 'Condition.code',
  localText: 'otitis',
  language: 'es-ES',
  baseClaims: Object.freeze({
    'Condition.identifier': CONDITION_EXAMPLE_ID,
    'Condition.subject': `ResearchSubject/${RESEARCH_SUBJECT_EXAMPLE_ID}`,
  }),
  proposalId: CONDITION_PROPOSAL_EXAMPLE_ID,
  candidates: Object.freeze([
    Object.freeze({
      id: CONDITION_CANDIDATE_EXAMPLE_ID,
      system: 'http://snomed.info/sct',
      code: '129127001',
      display: 'Otitis externa',
    }),
  ]),
})

const CONDITION_EXAMPLE_RESOURCE = buildFlatClaimCodingReviewResource(CONDITION_EXAMPLE_INPUT)
const CONDITION_EXAMPLE_CANDIDATE = CONDITION_EXAMPLE_INPUT.candidates[0]
const CONDITION_EXPECTED_ACCEPTED_CLAIMS = Object.freeze({
  ...CONDITION_EXAMPLE_RESOURCE.meta.claims,
  [CONDITION_EXAMPLE_INPUT.targetClaim]: `${CONDITION_EXAMPLE_CANDIDATE.system}|${CONDITION_EXAMPLE_CANDIDATE.code}`,
  [deriveCodingDisplayClaim(CONDITION_EXAMPLE_INPUT.targetClaim)]: CONDITION_EXAMPLE_CANDIDATE.display,
  [`${CONDITION_EXAMPLE_RESOURCE.resourceType}.userSelected`]: 'true',
})

/** Package-owned reusable fixture; tests and consumer examples must import it. */
export const CODING_REVIEW_EXAMPLES = Object.freeze({
  condition: Object.freeze({
    input: CONDITION_EXAMPLE_INPUT,
    resource: CONDITION_EXAMPLE_RESOURCE,
    expectedAcceptedClaims: CONDITION_EXPECTED_ACCEPTED_CLAIMS,
    expectedAcceptedProposalStatus: 'accepted' as const,
  }),
  batch: Object.freeze({
    resourceType: 'Bundle' as const,
    type: 'batch' as const,
    data: Object.freeze([
      Object.freeze({
        resource: Object.freeze({
          resourceType: 'ResearchSubject' as const,
          id: RESEARCH_SUBJECT_EXAMPLE_ID,
          meta: Object.freeze({
            claims: Object.freeze({ 'ResearchSubject.identifier': `urn:uuid:${RESEARCH_SUBJECT_EXAMPLE_ID}` }),
          }),
          contained: Object.freeze([CONDITION_EXAMPLE_RESOURCE]),
        }),
      }),
    ]),
  }),
  expectedReviewIdentities: Object.freeze([
    Object.freeze([RESEARCH_SUBJECT_EXAMPLE_ID, CONDITION_EXAMPLE_ID, CONDITION_PROPOSAL_EXAMPLE_ID]),
  ]),
})

function requiredCodingTarget(value: string): string {
  const target = requiredText(value, 'coding_target_claim_required')
  if (!/^[A-Z][A-Za-z0-9]+\.(?:code|[a-z][a-z0-9-]*-code)$/.test(target)) {
    throw new TypeError('coding_target_claim_invalid')
  }
  return target
}

function requiredText(value: string, error: string): string {
  const normalized = value.trim()
  if (!normalized) throw new TypeError(error)
  return normalized
}
