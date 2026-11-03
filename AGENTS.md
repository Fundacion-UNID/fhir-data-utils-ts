# AGENTS.md - fhir-data-utils-ts

## Rules entry point

Read [`docs/RULES_INDEX.md`](docs/RULES_INDEX.md) before changing this
repository. It links every repository-owned skill, package boundary and
executable governance gate.

All Node and npm commands follow the repository
[`preserve-workspace-node-runtime` skill](.codex/skills/preserve-workspace-node-runtime/SKILL.md).
The approved workspace runtime is Node.js 26.13.0. `package.json#engines` is
compatibility metadata; it does not authorize selecting another runtime.

## FHIR-neutral ownership

- This package owns neutral FHIR types, flat-claim catalogs, pure builders and
  explicit native-FHIR import/projection/export adapters.
- Canonical persisted business data remains minimal resource identity plus
  `resource.meta.claims`. Native FHIR is not a parallel persistence model.
- Keep HTTP, SMART, DIDComm, storage, authorization, sector policy and product
  behavior in their owning downstream repositories.
- Reuse official FHIR and terminology vocabulary and package-owned claim
  constants. Never duplicate governed claim paths or invent standard fields.

## Change and release discipline

- Use red-green-refactor TDD. The first line of every new or modified test file
  is a `Flow contract:` comment.
- Run `npm ci` under the approved runtime before the complete `npm run check`
  gate, then validate the packed public surface with `npm pack --dry-run`.
- Work on a branch, preserve unrelated work, merge with an explicit merge
  commit, push `main`, verify matching refs and finish with a clean worktree.
- A source-governance change does not authorize a package version bump,
  registry publication or downstream promotion.

