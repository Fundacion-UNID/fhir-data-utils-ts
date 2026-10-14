---
name: preserve-fhir-flat-coding-review
description: Preserve the neutral flat-claim contract for imported local clinical text, terminology proposals and confirmed codings. Use when changing ingestion, ResearchSubject batches, contained clinical resources, coding-review UI/API contracts, examples, fixtures or tests.
---

# Preserve FHIR Flat Coding Review

Keep imported local text, proposed terminology and confirmed coding as distinct
states. Reuse the public builders and fixtures from `fhir-data-utils-ts`; do not
redeclare governed claim paths, code systems, UUIDs or example values.

## Canonical contract

- Store source wording as the resource's canonical code-like local-text claim,
  such as `<ResourceType>.<code-field>-text`. Never serialize `coding-input:*`.
- Put `meta.codingProposals[]` on the same contained clinical resource as
  `meta.claims`. Both are siblings. Never aggregate proposals into
  `ResearchSubject.meta`.
- Each proposal `field` names the coded target claim. Confirmation writes
  `system|code` to that target and the terminology display to `-display`; it
  must preserve the imported `-text` value.
- Review state comes only from `meta.codingProposals[].status`. An accepted
  professional decision sets that proposal's `userSelected=true`; never use
  `userSelected` as a draft or promotion flag.
- Group review UI with the package-owned clinical families: allergies and
  intolerances, procedures, diagnostics and immunizations. Do not duplicate
  resource-type lists in downstream consumers.
- A localized generated label may use a language-qualified `-text_<BCP47>`
  companion. It must not overwrite the imported local text before explicit
  review.
- In a DIDComm-style batch, traverse
  `body.data[].resource.contained[].meta.codingProposals[]`. In a native FHIR
  Bundle projection, traverse `entry[].resource.contained[]`. Never invent
  `entry[].data[]`.
- Multiple imported rows may resolve to one stable UUID ResearchSubject. Keep
  every proposal on the clinical resource generated from its source row.
- Complete each ResearchSubject independently when all of its own mandatory
  proposals are resolved. Other subjects in the same import thread never block
  it, and review always resumes from persisted resources without re-upload.
- Text supplied by an individual, a source table or an automated/device flow
  may create proposals, but does not mark an inferred code professionally
  reviewed. Preserve origin/provenance separately from the review decision.

## Workflow

1. Import `deriveCodingLocalTextClaim`, `deriveCodingDisplayClaim`,
   `buildFlatClaimCodingReviewResource`, `applyFlatClaimCodingSelection` and
   `CODING_REVIEW_EXAMPLES` from `fhir-data-utils-ts`.
2. Write the smallest failing contract test first. Begin its suite with a flow
   contract comment.
3. Build the resource with source `-text` plus a resource-scoped proposal.
4. Confirm a candidate only through the shared selection helper or an adapter
   proven equivalent by contract tests.
5. Test the real DataConv or product boundary, then update JSDoc, SYNC and
   changelog together.
6. Use local tarballs for the consumer matrix. Merge validated branches to
   `main`, publish bottom-up, reinstall exact registry versions and only then
   promote to staging.

## Boundaries

- This is FHIR-neutral shared data behavior. It belongs in
  `fhir-data-utils-ts`, not in downstream or frozen compatibility packages.
- Importers and sector applications consume the same contract and may add
  policy without forking its claim shape.
- Do not put HTTP clients, gateway policy, product authorization or terminology
  catalogs in this package.
- Tests and examples import package-owned fixtures/builders. Do not scatter raw
  claim names, code systems, codes, identifiers or UUIDs through consumers.
