---
name: govern-fhir-data-utilities
description: Complete or audit migrations, claim catalogs, converters, builders, tests and releases in fhir-data-utils-ts. Use for shared FHIR types or utilities recovered from standards-based compatibility evidence; raw flat-claim literals; duplicate root and family modules; Observation components; Immunization graphs; Group or ResearchStudy projections; package exports; coverage gates; or downstream promotion.
---

# Govern FHIR Data Utilities

## Keep ownership explicit

- Keep deterministic FHIR canonicalization and HL7 coding descriptors here.
  Occupation catalogs and their permission projections remain outside this package.

1. Inventory every relevant standards-based source family before declaring a
   migration complete.
2. Treat `gdc-*` repositories as read-only evidence unless the user explicitly
   changes that scope. Never patch them as part of this migration.
3. Keep neutral FHIR data semantics here. Keep HTTP, SMART, DIDComm, storage,
   authorization and product policy in their owning services or sector packages.
4. Define every flat key once in its owning named catalog. Import that symbol in
   converters, builders, tests and examples; never repeat a claim-path literal.
   Use `normalizeFhirApiClaimKey` for qualified/short claim syntax at import
   boundaries; its syntax acceptance does not replace resource-catalog checks.
5. For SHC and DGC archaeology, prefer the latest governed standards-based
   implementation evidence. Do not copy an earlier helper when a later
   governed contract exists.

## Separate catalogs, adapters and builders

- Put claim names and specs under `src/claims/`.
- Put native FHIR R4/R5 projection at `src/converters/`; persistence remains
  flat claims and native FHIR exists only at an explicit adapter boundary.
- Keep native Communication exchange declarations in `fhir-types`; reuse the
  package's standard primitives and keep consumer metadata extensions unknown
  unless explicitly specialized. A partial projection is not a complete FHIR
  validator and must not acquire transport or authorization behavior.
- Use `CommunicationClaim.ContentString` for literal payload text; resource
  Narrative and notes keep their own fields. Reuse the exclusive R4 item and
  controlled body -> ordered references -> attachment adapters. Reject native
  parts/fields that cannot round-trip through the selected flat profile, and
  keep R5 CodeableConcept content under an explicit version adapter. The
  Communication/inner-Bundle delivery contract remains independently enforced.
- Put multi-resource authoring under `src/builders/`. A root historical module
  may remain only as a deprecated re-export shim so implementation is unique.
- Reuse `clinical-resource-view` for claim fields, cards, Composition sections
  and separate local/international labels. A display never confirms coding or
  authorizes access. Reuse `buildClinicalDocumentBundle` from
  `clinical-document-bundle` for Composition-first document assembly; canonical
  persisted data stays in flat claims and native output is an exchange
  projection. Caller-supplied final status and attester references are not
  verified signatures or proof of authority.
- Use `document-bundle-r4` for basic R4 document structure and Patient display
  name inspection. Its documented first-Patient fallback is compatibility
  behavior, not verified identity. Keep subject rebinding, import planning,
  name comparison and complete schema validation outside these two helpers.
- Preserve correlations by creating one claims-first row per member, party or
  component when parallel arrays would lose identity.
- For existing indexed R4 records, use the explicit `indexed-r4` semantic
  compatibility profile when parent Observation JSON columns must be retained.
  Do not switch that profile to the independent child graph or silently use
  structural fallback. Structural compatibility and document-support families
  each require their own explicit profile; EncounterHistory does not become R4.
- Reconstruct native arrays such as `Observation.component[]` only during FHIR
  projection. Do not invent resource-specific scalar aliases for indexing.
- Keep Group membership and ResearchStudy associated parties descriptive;
  neither is a Consent, SMART scope or authorization grant.
- Keep legal Organizations, department Organizations, HealthcareServices and
  Locations distinct. A professional Group has one department managingEntity;
  endpoint routing and access remain downstream policy.
- Build a department and all independently schedulable offered services with
  `buildDepartmentServicesFlatGraph(...)`; require complete identifier and
  coding tokens plus typed references, and persist one Organization plus one
  claims-first HealthcareService row per service.
- Keep `Schedule` and `Slot` as independent claims-first resources. A Schedule
  names its HealthcareService plus all independently required Location, Device
  or professional actors; every Slot references its Schedule and derives
  duration only from required start/end instants.
- Model rooms, booths, chairs and beds as child Locations using `partOf`.
  Model equipment as Device, never as a synthetic Service or Place. R4
  `Location.physicalType` and R5 `Location.form` project the same governed
  version-neutral physical-form claim.
- Keep equipment calibration and public authorization separate. A calibration
  is a Procedure focused on the Device, a DeviceMetric calibration state/time
  and optional DocumentReference evidence. A public operating approval is an
  R5 RegulatedAuthorization whose holder and regulator are distinct. Neither
  record grants the submitter authority, and neither is collapsed into the
  Schedule or a browser-authored availability flag.
- Treat minimal identity plus `resource.meta.claims` as the only canonical
  persisted resource representation. R4/R5 materializers keep each department
  and service id independent; the native result is an adapter output for
  interop, hashing or credentials, never a parallel stored source of truth.
- Preserve terminology-map relationship evidence. Only a strict reviewed
  equivalence may be selected automatically; wider, related, inexact and
  unmatched mappings require terminology governance.
- Reuse `normalizeClaimsFromFhirResource` and `convertClaimsToFhirResource` at
  native R4 adapter boundaries. Preserve explicit claims, primary business
  identifiers and timestamp/language data without treating technical ids as
  business identity. Version-specific claim namespaces remain invalid.
- Communication participant matching and Parameters construction are pure data
  projections. Actor/user/target controls are declared profile extensions,
  never an authorization grant or a substitute for caller verification.
- An explicit document `subjectProjection` is caller-owned native context. Its
  absolute full URL must match the Composition subject; never infer a Patient
  index identity or access permission from that context resource.
- Keep native R5 SubscriptionTopic/Subscription configuration and notification
  Bundle parsing separate from the claims-first Communication being delivered.
  This package owns their reusable types and validation, never HTTP delivery,
  subscriber persistence, authentication or product notification policy.
- Reuse `buildSubscriptionNotificationR5` and `matchesSubscriptionEventR5` for
  the supported event profile. R5 Bundle invariant bdl-15 requires every
  notification entry to have a caller-owned full URL; never emit a fixed or
  malformed UUID. Preserve exact event/count strings and resolve advertised
  focus URLs. `SubscriptionTopic.canFilterBy.resource` and
  `Subscription.filterBy.resourceType` are distinct standard elements; project
  legacy aliases explicitly at the consumer boundary, without rewriting data.

- Validate and project the canonical outer `Bundle[type=batch]` ->
  `Communication` -> inner `Bundle[type=document|batch|collection]` structure
  here, but keep high-level editors/readers and application data contracts in
  downstream libraries. Arbitrary files are DocumentReference entries in the
  inner Bundle, never a second direct Communication attachment. Direct
  flat-claim CRUD is an internal persistence boundary, not this wire format.
- Keep ImagingStudy searchable metadata, clinical references and protected
  endpoint references in neutral flat claims. DICOM parsing, pixels and object
  storage remain in a separately versioned imaging/storage package.
- Preserve `Encounter.appointment`; an Appointment lifecycle transition must
  not sever the encounter from the scheduling event that originated it.
- Represent actual care movement as independent child Encounters linked with
  `Encounter.partOf` and their own Location. The graph is descriptive and does
  not grant family or professional access.
- Represent resilient emergency intake as a canonical `ServiceRequest` and
  acknowledgement/triage as a separate durable `Task` focused on it. Never
  infer authorization from requester, performer or owner references.
- Represent a population campaign with one `CommunicationRequest` against a
  frozen enumerated Group snapshot. Consent, exclusions, channel status and
  eligibility are rechecked per recipient outside this neutral package.
- Emit coded values as compact `system|code`. Do not create split
  `code-system`, `code-value` or stored `code-display` claims; preserve local
  text separately and resolve trusted displays through terminology.
- Build laboratory panels with `buildDiagnosticReportFlatGraph(...)`.
  `DiagnosticReport.code` is mandatory and names the report/panel; result
  measurements are independent `Observation` entries and formatted PDF/image
  evidence is an independent `DocumentReference`. Preliminary state does not
  itself authorize ledger or research projection.

## Change with executable contracts

1. Follow the canonical
   [`preserve-workspace-node-runtime`](../preserve-workspace-node-runtime/SKILL.md)
   gate and run `npm ci` before trusting failures.
2. Begin every new or modified test file with the repository flow-contract
   comment.
3. Write and run the smallest failing test first. Cover success, malformed
   input, lossless round trip, catalog ownership and packed public exports.
4. Add data-rich converter fixtures that exercise meaningful optional fields;
   a single happy-path assertion is not adequate migration evidence.
5. Run `npm run check`. Preserve the built-in coverage floors for converters,
   builders and core FHIR utilities; raise them when practical, never lower them
   to make a branch green.
6. Run `npm pack --dry-run`, then install the produced tarball in an isolated
   temporary consumer and resolve every documented subpath.

## Release without partial promotion

1. Update JSDoc, tests, README, migration inventory, changelog and this skill in
   the same behavior branch.
2. Use one patch release for one branch closure. Commit and push the branch,
   create an explicit merge commit, push `main`, and verify matching remote refs
   and a clean worktree.
3. Publish this lowest shared package before changing consumers. Verify the
   exact registry version exists before pinning it downstream.
4. Never commit `file:`, Git, workspace or vendored tarball dependencies.
5. Report local green, merged, published and deployed as separate states.
