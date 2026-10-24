# Changelog

## Unreleased

- Add a FHIR-neutral, identifier-free public-health statistics projection for
  coded human or animal events. Preserve only a coarse date, jurisdiction,
  code and optional coarse demographics; keep source records, hashes,
  signatures, SHC issuance, private datasets and free text outside the
  projection.

- Re-establish the public repository from a clean source snapshot while
  retaining this changelog as the package release record.

## 0.6.22 - 2026-10-22

- Add FHIR-owned flat claims and a lossless R4 extension round trip for the
  optional US Core Patient race and ethnicity extensions. Preserve OMB and
  detailed Coding tokens separately from the required human-readable text;
  derive the official `Patient.race` and `Patient.ethnicity` token-search
  claims instead of accepting them from a browser; and do not expose these
  jurisdictional fields as universal demographics or org.schema properties.

## 0.6.21 - 2026-10-21

- Add the shared CommunicationRequest form, flat-claim and materialization
  fields needed for categorized public alerts, related attachments and bounded
  occurrence periods without introducing a proprietary alert resource.

## 0.6.20 - 2026-10-12

- Export the deduplicated official LOINC Document Ontology subject-matter-
  domain catalogue supplied from the LOINC Knowledge Base for human-health
  selectors. Keep it explicitly separate from veterinary service types.

## 0.6.19 - 2026-10-12

- Add the official `HealthcareService.appointmentRequired` flat claim and
  R4/R5 materialization round trip. Availability remains authoritative in the
  associated Schedule and Slot resources and is not duplicated on the service.

## 0.6.18 - 2026-10-08

- Add the canonical Immunization series-dose claim, its FHIR R4 round trip,
  reusable dose-order validation and a standalone claims-first
  ImmunizationRecommendation builder for progressive clinical authoring.

## 0.6.17 - 2026-10-08

- Add the preferred HL7 Observation category catalogue for shared clinical
  editors. English and Spanish labels retain a compact `HL7|code` suffix while
  the stored option remains the complete canonical `system|code` token.

## 0.6.16 - 2026-10-07

- Export the required FHIR R4 code bindings used by reusable IPS authoring
  forms, keyed by their exact flat claim. The canonical code is stable while
  English and Spanish presentation labels follow the user's locale. Fields
  with extensible or example bindings remain terminology searches instead of
  being incorrectly constrained to a closed dropdown.

## 0.6.14 - 2026-10-06

- Own the product-neutral HL7 v2-0203 person and healthcare identifier-type
  catalog used by FHIR adapters, including national, passport, driving licence,
  health, insurance-member/subscriber, donor and patient identifiers. Contact
  points and veterinary evidence remain in their respective standards.

- Add a reusable, data-only `CommunicationRequest` form schema backed by
  canonical flat claims, including exact Patient, RelatedPerson or Group
  recipients, information providers, Encounter context and referenced or
  attached payloads. Projection adapters are deliberately limited to the
  published FHIR R4 and R5 specifications; no R6 API is exposed.

- Canonicalize native FHIR relative subject references at the shared clinical
  editor boundary before claims-first operations, while preserving governed
  URN and `did:web` identifiers unchanged.

- Add the shared clinical-artifact editor boundary for native FHIR R4 imports:
  hydrate only schema-owned fields, materialize supported IPS resources from
  editor plus host-owned claims, and prove FHIR-to-form-to-FHIR semantic
  round trips for every reusable IPS authoring schema.
- Give every reusable IPS authoring schema canonical initial claims so portal
  components do not invent resource status defaults.

- Recover useful locale-aware behavior from historical compatibility helpers
  as strict FHIR temporal presentation tools.
  Date-only values retain their calendar day, instants render with the user's
  locale and IANA time zone, editor date/time fields compose a canonical FHIR
  instant with optional seconds defaulted to `00`, and inclusive ranges treat
  an omitted upper bound as the supplied current instant.

- Preserve locally entered `Observation.code.text` when a terminology code has
  not yet been confirmed, so profile-aware authoring remains visible and can be
  coded later without inventing a code.

- Add section-specific Observation authoring profiles for vital signs,
  laboratory results, social history and pregnancy history. Each profile owns
  its IPS section, HL7 Observation category and initial claims.
- Add a reusable synthetic document directory in which every document starts
  with Composition, points to its Encounter context and shares a chronological
  parent/child Encounter journey. ResearchSubject is deliberately absent.

- Export data-only, coverage-excluded authoring schemas for the six minimum IPS
  resource families used by shared Personal and Professional forms:
  AllergyIntolerance, MedicationStatement, Immunization, Condition, Procedure
  and Observation. Every field reuses its owning flat-claim catalog, records
  the terminology-enabled source-text claims and remains neutral between human
  and veterinary subjects.
  Bind every schema to its canonical section in the shared IPS all-sections
  document so portals can update the Composition without duplicating LOINC
  section codes.

- Recover neutral SHC and EU DGC QR prefix classification from compatibility
  evidence, with exported repository-safe `*.data.ts` examples.
  Recognition explicitly provides no decoding, verification or authorization.

- Export one repository-safe, telephone-free IPS demo document with all sixteen
  clinical sections from the explicit `fhir-data-utils-ts/data` entry point so
  product portals and visual tests share the same typed source data.
- Publish repository-safe Appointment/Communication and Encounter-transfer
  fixtures from the explicit `fhir-data-utils-ts/data` entry point. Their
  `*.data.ts` implementations are excluded from executable coverage while the
  historical source modules remain compatibility reexports.
- Remove notification-channel policy from the general root and `builders`
  surfaces. The historical reminder subpath and non-standard `Task.channel`
  claim remain deprecated compatibility only while consumers migrate;
  downstream applications own channel choices and dispatch behavior.

## 0.6.2 - 2026-09-30

- Add strict FHIR `instant` to Unix epoch-second derivation while preserving
  the boundary between clinical time, `Encounter.id`, provider business
  identifiers and human display codes.

## 0.6.1 - 2026-09-30

- Add canonical flat claims, a claims-first builder and native R5 projection
  for `EncounterHistory`, including explicit Encounter, HealthcareService,
  subject, status, class, period and Location boundaries.
- Add the R5 Encounter lifecycle and projection without weakening the existing
  R4 adapter; `on-hold`, `discharged` and `completed` are validated only at the
  R5 boundary.

## 0.6.0 - 2026-09-29

- Add canonical two-level Communication Bundle validation tools recovered from
  the frozen shared implementation: outer batch Bundle, one FHIR Bundle
  attachment per Communication, and validated document/batch/collection inner
  Bundles. Reject direct clinical or binary Communication payloads while
  leaving high-level mutable editors downstream.
- Add a typed Appointment exchange projection that preserves start/end,
  participants, slots and supporting information while keeping an ICS calendar
  file as an independent DocumentReference flat-claim resource.

## 0.5.0 - 2026-09-29

- Add claims-first equipment compliance graphs: technical calibration as a
  Device-focused Procedure plus DeviceMetric state and optional hashed
  DocumentReference evidence, and public operating approval as a separate R5
  RegulatedAuthorization. Keep these records independent from Schedule
  availability and downstream role authorization.

- Add official R5 Schedule and Slot search-claim catalogs, claims-first
  materializers and a service availability graph builder. Preserve independent
  HealthcareService/Location actors and derive booking duration from each
  Slot start/end interval.
- Add schedulable child Location construction and composite Schedule actors for
  Location, Device and PractitionerRole capacity. Correct R5 Location
  projection to use `form` instead of the removed R4 `physicalType` field.
- Add a strict claims-first department/service graph builder that emits a
  department Organization and one independently schedulable HealthcareService
  per offered service, with complete identifiers, coding tokens and Location
  references. Add governed
  R5 Organization description and HealthcareService comment projection without
  presenting either as an R4 SearchParameter.

- Added strict claims-first R5 materialization for Organization,
  HealthcareService and Location. Canonical `system|value` identifiers and
  `system|code` codings now retain their systems, while nested native FHIR
  beside `resource.meta.claims` is rejected.

- Document the ownership boundary for allergy reaction severity, medication
  treatment period, immunization route/site and Observation reference-range
  text across neutral FHIR projections, SOS multichannel schemas and typed SDK
  Bundle editors.

- Add the complete official FHIR R4 HealthcareService search-claim catalog and
  a lossless R4 converter that keeps provider departments and services distinct.
- Preserve Location WGS84 coordinates and require each professional service
  Group to have one managing department Organization without granting access.
- Add the supplied 115-row SNOMED CT C80 to LOINC specialty candidate map;
  only strict equivalence is eligible for automatic selection.

## 0.4.0 - 2026-09-27

- Add the neutral daily vital-sign document lifecycle: registered raw readings,
  preliminary three-reading means, MORN/EVE EventTiming, one preliminary daily
  Composition and explicit professional finalization.
- Preserve mean provenance through `Observation.derived-from`, validate the
  local calendar day with an IANA time zone and project Composition status plus
  section entry references at the FHIR R4 boundary.
- Add governed UCUM Fahrenheit and avoirdupois-pound input alongside Celsius
  and kilograms without moving regional UI preferences into shared FHIR data.

## 0.3.7 - 2026-09-26

- Add claims-first FHIR contracts for Location-linked Encounter care journeys,
  emergency ServiceRequest plus triage Task, and Group-snapshot
  CommunicationRequest campaigns.
- Add R4 projections for ServiceRequest and CommunicationRequest and preserve
  `Encounter.partOf` without introducing split coding claims or persisted code
  displays.

## 0.3.6 - 2026-09-26

- Add a product-neutral claims-first DiagnosticReport graph builder for coded
  laboratory panels, independent Observation results and PDF/image
  DocumentReference evidence.
- Correct the document builder to emit the canonical DocumentReference claim
  catalog and complete list helpers for report results, performers, specimens
  and graph references.

## 0.3.5 - 2026-09-26

- Preserve the originating `Encounter.appointment` reference and expose the
  canonical FHIR R4 Encounter lifecycle vocabulary.
- Add product-neutral ImagingStudy flat claims, helpers and R4 projection for
  searchable clinical metadata and protected endpoint references without
  embedding DICOM payloads.
- Cover Encounter and ImagingStudy with rich round-trip, catalog, helper,
  documentation and package-surface contracts.

## 0.3.4 - 2026-09-23

- Add native FHIR R5 `SubscriptionTopic` and HTTPS rest-hook `Subscription`
  builders plus the official resource-specific SearchParameter catalogs.
- Add a strict `subscription-notification` Bundle parser that resolves each
  advertised full-resource event focus and distinguishes handshake events.
- Add the claims-first terminal-job `Communication` contract used by DataConv
  and professional BFFs without introducing transport, storage or product
  policy into the neutral package.

## 0.3.3 - 2026-09-23

- Define product-neutral coding-review families and pending-proposal helpers.
- Keep review workflow in `meta.codingProposals[].status`; reserve
  `userSelected=true` for a code explicitly selected by a reviewer.

## 0.3.2 - 2026-09-23

- Preserve every coding identity from repeatable AllergyIntolerance and
  MedicationStatement CodeableConcepts instead of retaining only `coding[0]`.
- Keep the MedicationStatement dose quantity's human `unit` separate from its
  coded `system|code`, with read compatibility for records written by 0.3.1.
- Add executable regressions using the exact allergy and medication examples
  from the HL7 IPS all-sections Bundle.

## 0.3.1 - 2026-09-21

- Separate canonical claim catalogs from graph builders and move Immunization
  graph/reminder implementations under the stable `builders` subpaths, leaving
  their historical root paths as deprecated compatibility re-exports.
- Add missing Medication and ImmunizationRecommendation catalogs, Group and
  ResearchStudy named claim constants, legacy-read aliases and missing neutral
  FHIR resource type constants; remove duplicated flat-claim literals from
  builders and converters.
- Correct impossible calendar-date acceptance, empty list persistence and
  nested `meta.claims` leakage through generic fallback flattening.
- Expand executable contracts to the complete converter/helper matrix, rich
  optional resource fields, FHIR primitives/search/Bundle behavior,
  Immunization graphs and Group/ResearchStudy row boundaries.
- Enforce coverage and packed-subpath gates as part of the release contract.

## 0.3.0 - 2026-09-21

- Consolidate the complete product-neutral claim catalogs, claim helpers and
  R4/R5 converters previously exposed from `gdc-common-utils-ts`, without
  modifying that frozen source repository.
- Recover strict FHIR primitives, value/search/token utilities, Bundle readers,
  resource search/template types, terminology model types, RelatedPerson and
  telecom helpers, and DICOMDIR structural types from compatibility evidence.
- Move cross-sector terminology, Immunization graph/reminder, Group R5 and
  ResearchStudy R5 contracts into their neutral standards-based owner.
- Require component Observations to use independently indexable graph entries;
  deprecated JSON-array component claims remain read-only compatibility input.
- Add stable package subpaths for every migrated contract family.

## 0.2.4 - 2026-09-21

- Restore the canonical composite-Observation resource graph: the primary
  Observation owns `has-member` references to independently indexable reduced
  Observation entries, while R4/R5 projection reconstructs native
  `component[]`.
- Keep JSON/CSV component arrays, `bp-*` aliases and deprecated child-owned
  containment markers read-only; current writers emit none of them.

## 0.2.3 - 2026-09-21

- Preserve the deployed flat-claim component number wire contract by encoding
  aligned numeric values as JSON string arrays while parsing them as numbers
  at typed and native-FHIR boundaries.

## 0.2.2 - 2026-09-21

- Make the neutral vital-sign builder own canonical code displays, component
  displays and the optional user-selected provenance claim so portals and
  assistants no longer assemble those Observation fields from literals.

## 0.2.1 - 2026-09-21

- Add the repository skill that governs Observation component authoring,
  compatibility, generic indexing, R4/R5 projection and consumer promotion.

## 0.2.0 - 2026-09-21

- Consolidate the canonical Observation claim names, vital-sign terminology,
  JSON repeatable-component encoding, generic component index projection and
  explicit R4/R5 projection boundary. Historical component CSV and `bp-*`
  aliases remain read-only compatibility inputs.
- Record the reuse/rewrite/retire audit of historical compatibility utilities
  without adding obsolete product, transport, SHA-1, DICOM or build
  dependencies to the neutral package.
- Add the neutral contained-resource coding-review contract: canonical imported
  `*-text`, resource-scoped `meta.codingProposals[]`, batch traversal, candidate
  confirmation and reusable governed fixtures for downstream consumers.
- Add channel-neutral FHIR-like vital-sign Observation builders and lossless device-batch normalization while preserving device source without inventing professional attestation.
- Introduce product-neutral flat-claim resource graphs, parent-owned
  `contained-reference-list`, narrative `language`/`xhtml`, and governed
  SearchParameter definitions.
