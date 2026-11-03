---
name: preserve-workspace-node-runtime
description: Preserve the approved Node.js 26 workspace runtime for every install, build, test, package and release gate in fhir-data-utils-ts.
---

# Preserve Workspace Node Runtime

This skill is the repository-local entry point for the canonical workspace
runtime contract. The approved runtime is Node.js `26.13.0`.

## Keep one approved runtime

1. Run `node --version` before the first install, build, test, pack, release or
   downstream-consumer command and record it with the gate evidence.
2. Require Node.js `26.13.0` and keep the same executable and version for every
   retry and child process in that gate.
3. Run `npm ci` before trusting build or test results, then record effective
   internal dependencies with `npm ls` when consumers are involved.

## Do not reinterpret compatibility metadata

`package.json#engines` is compatibility metadata for package consumers. Its
`>=24` range does not authorize this workspace to select Node 24, run `nvm
use`, prepend another Node installation to `PATH` or modify the lockfile to
compensate for an implicit runtime switch.

If a repository-owned authoritative pin or an executable command rejects Node
26.13.0 specifically, stop and report the active version, the conflicting pin
and the exact failure before changing the runtime or repository.

## Preserve the FHIR package boundary

Runtime governance never changes FHIR semantics. Follow the specialized skill
linked for the affected catalog, converter, builder or review contract through
[`docs/RULES_INDEX.md`](../../../docs/RULES_INDEX.md).

