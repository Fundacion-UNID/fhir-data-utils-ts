# fhir-data-utils-ts rules index

Use this index to locate the owning rule. A specialized FHIR skill adds domain
constraints but never replaces the repository runtime, TDD or release gate.

## Repository entry points

- [`AGENTS.md`](../AGENTS.md) owns the repository-wide FHIR-neutral boundary,
  runtime delegation and closure requirements.
- [`README.md`](../README.md) documents the supported public package surface.
- [`CHANGELOG.md`](../CHANGELOG.md) records material package and governance
  changes without implying registry publication.
- [`package.json`](../package.json) defines compatibility metadata and the
  executable `check` gate.

## Repository skills

- [`preserve-workspace-node-runtime`](../.codex/skills/preserve-workspace-node-runtime/SKILL.md)
  is the sole runtime authority for Node/npm gates and requires Node.js
  26.13.0.
- [`govern-fhir-data-utilities`](../.codex/skills/govern-fhir-data-utilities/SKILL.md)
  owns general FHIR catalogs, converters, builders, package exports and
  downstream promotion boundaries.
- [`govern-fhir-observation-components`](../.codex/skills/govern-fhir-observation-components/SKILL.md)
  owns neutral Observation component graphs and R4/R5 projection rules.
- [`preserve-fhir-flat-coding-review`](../.codex/skills/preserve-fhir-flat-coding-review/SKILL.md)
  owns imported local text, coding proposals and confirmed-coding separation.

## Executable governance gate

- [`tests/rules-index.contract.test.mjs`](../tests/rules-index.contract.test.mjs)
  verifies that every local skill is indexed, every repository rule link is
  resolvable and no specialized gate selects Node 24 instead of delegating to
  the Node.js 26 runtime authority.

