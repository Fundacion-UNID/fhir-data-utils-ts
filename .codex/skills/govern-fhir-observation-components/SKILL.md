---
name: govern-fhir-observation-components
description: Implement or audit neutral FHIR Observation claim catalogs, vital-sign terminology, parent-owned component graphs, reduced component indexes, historical array and bp aliases, and R4/R5 projection adapters. Use when changing Observation.component, blood pressure, assessment scales, device readings, flat claims, portal or assistant vital-sign builders, or migrating neutral compatibility code.
---

# Govern FHIR Observation Components

## Establish the boundary

1. Treat native FHIR import/export as an adapter boundary. Keep flat claims as
   the version-neutral internal contract.
2. Read `src/observation-claims.ts`, `src/vital-sign-observations.ts` and their
   tests before changing behavior.
3. Treat external compatibility repositories as read-only evidence unless the
   user explicitly changes that scope.
4. Keep product policies downstream. This package owns only neutral FHIR data
   semantics.

## Preserve the component contract

- Model blood pressure as one native FHIR Observation with systolic and
  diastolic `component[]` entries. Do not export those components as three
  independent native Observations.
- Build a flat resource graph. The primary Observation owns comma-separated
  `Observation.has-member` references to reduced Observation entries.
- Give every reduced member its graph identifier, subject, category, date,
  generic code, numeric value and unit. Omit `Observation.status` so normal
  top-level listings ignore it while ordinary Observation indexes can query it.
- Never use `is-contained`, `contained-parent-reference` or
  `contained-reference-list` for Observation components.
- Accept historical JSON arrays and CSV only through
  `decodeObservationClaimList`; never emit either from a current writer.
- Never introduce scale-specific numeric claims. In particular,
  `Observation.bp-systolic-number` and `Observation.bp-diastolic-number` are
  read-only migration aliases. Apply the same rule to APGAR, Glasgow and other
  composite observations.
- Reconstruct native `Observation.component[]` only at the explicit R4/R5
  adapter boundary by resolving the primary entry's governed member graph.
- Use `observationFhirR4ToFlatGraph` for native component imports and
  `observationFlatGraphToFhirR4` for export. The scalar
  `observationFhirR4ToFlat` adapter must fail with
  `observation_component_graph_required` when `component[]` is present.

## Reuse governed names

- Import every Observation claim key from `ObservationClaim`.
- Import terminology from `ObservationCategoryCodes`, `VitalSignsCodes` and
  `VitalSignsUnits`.
- Let `buildVitalSignObservation` author the primary/member graph, canonical
  displays and optional `Observation.user-selected` flag; consumers submit its
  entries and must not rebuild those fields or relationships.
- Add a missing neutral constant here once and consume it downstream. Do not
  copy `Observation.*`, LOINC, UCUM or category strings into portals,
  assistants, tests or snippets.
- Keep displays separate from `system|code` tokens and local-language text.
- For repeated vital signs, keep every raw reading as `registered`, require the
  configured cadence before deriving a `preliminary` mean, and preserve the
  source links through `Observation.derived-from`.
- Persist the EventTiming bucket through the canonical
  `Observation.date-when` claim. Do not infer MORN/EVE from a server time zone.
- Build one preliminary Composition per explicit local date and IANA time
  zone. Only authorized confirmation returns a final daily document with a
  professional attester and final top-level Observations.
- Keep ledger hashing, individual-index writes, Digital Twin materialization
  and research eligibility outside this neutral package. A final graph is data
  state, not authorization for those side effects.

## Change with TDD

1. Begin every new or modified test file with:
   `// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.`
2. Add the smallest failing test and retain its intended red result.
3. Prove parent-owned `has-member`, independent component indexing, legacy
   array reading, absence of `bp-*` and containment output, and a single native
   Observation with two components in R4 and R5 projection.
4. Add negative assertions against raw claim literals outside the owning
   catalog and against child-owned containment markers.
5. Run Node 24, `npm ci`, `npm run check` and `npm pack --dry-run`.

## Audit migrations completely

- Inventory the relevant standards-based source and compatibility evidence
  before calling a migration complete.
- Move only neutral FHIR data types, claim catalogs, conversion rules and pure
  helpers here. Keep transport clients and sector authorization/policy in
  their owning package.
- Record every migrated, retired or intentionally retained family in neutral
  repository documentation; an unmentioned file is an incomplete audit.
- Expose each supported family through a stable package subpath and prove the
  packed artifact, not only root source imports.

## Promote consumers

Release bottom-up. Publish this package first, install its exact registry
version in the lowest consumer, and run that consumer's complete local matrix.
Never commit `file:`, Git, workspace or tarball dependencies. Portals and
assistants should call shared builders or use governed constants; they submit
the returned entries and must not assemble component arrays or graph links.

Update JSDoc, high-level docs, tests, snippets and this skill together whenever
the contract changes.
