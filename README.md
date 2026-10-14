# fhir-data-utils-ts

FHIR-neutral data contracts for flat claims, governed SearchParameter names,
resource graphs and explicit R4/R5/R6 projection adapters. This package has no
network clients and no dependency on downstream product packages.

Release order is local-first: local tarball consumers, complete local matrix,
merge and push `main`, publish bottom-up, install exact registry versions, then
staging. Never commit `file:`, Git or workspace dependencies.

## Public source history

The public repository begins from a clean 2026 source snapshot. The retained
[`CHANGELOG.md`](CHANGELOG.md) records package releases without republishing
the former Git push history.

## Ownership boundary

This package owns only standards-based FHIR SearchParameters, flat-claim
graphs, validation and explicit R4/R5/R6 projection rules. Sector terminology,
product policy, transport, authorization, mutable editors, network clients and
application workflows belong downstream and are deliberately unnamed here.

FHIR resource graphs use independent entries. A parent links children only
through `<ResourceType>.contained-reference-list`; children do not carry
`is-contained` or `contained-parent-reference`. Narrative source is preserved
as `<ResourceType>.language`, `.narrative-status` and `.xhtml`. Native FHIR is
materialized only by an explicit R4/R5/R6 import or export adapter.

Laboratory authoring uses `buildDiagnosticReportFlatGraph(...)`.
`DiagnosticReport.code` is the coded report or panel type, atomic results are
independent LOINC-coded `Observation` entries, and PDF/JPEG/PNG evidence is an
independent `DocumentReference`. Preliminary reports can be reviewed and
securely exchanged; ledger and research eligibility remain downstream policy
and normally require the confirmed final lifecycle state.

Provider catalogs keep legal Organizations, department Organizations,
HealthcareServices and Locations separate. A department uses
`Organization.part-of`; each offered service references its provider through
`HealthcareService.organization`, and may reference several geocoded
Locations. Professional Groups are bound to one department without turning
membership into authorization. See
[Organization departments and healthcare-service catalogs](docs/HEALTHCARE_SERVICE_DEPARTMENT_CATALOG.md).

Cross-participant data always uses an outer FHIR batch Bundle containing
Communication entries. Each Communication carries exactly one
`application/fhir+json` inner document, batch or collection Bundle; arbitrary
files are DocumentReference resources inside that Bundle. This package owns
strict parsing and projection tools; mutable editors, transport and
cross-sector policy belong downstream. See
[Communication Bundle contract](docs/COMMUNICATION_BUNDLE_CONTRACT.md).

Reservable equipment remains a `Device` actor of its service-specific
`Schedule`. Technical calibration is recorded as a `Procedure` focused on that
Device plus the current `DeviceMetric.calibration` state and an optional
`DocumentReference` evidence hash. A public operating approval is a separate
R5 `RegulatedAuthorization`; it is never inferred from calibration or from an
employee role.

## Public contract

The root export and stable subpaths provide:

- strict version-neutral FHIR datatypes, value/token helpers, Bundle traversal
  and typed search parsing/building;
- the canonical Communication Bundle validation boundary and Appointment
  exchange projection, including calendar DocumentReference evidence;
- complete flat-claim catalogs and claim helpers for the resource families
  formerly scattered through `gdc-common-utils-ts`;
- explicit R4/R5 conversion adapters, including Consent and PractitionerRole;
- resource search/template types, terminology model types,
  RelatedPerson/telecom helpers and type-only DICOMDIR tree contract;
- cross-sector terminology, Immunization graphs/reminders, and FHIR R5 Group
  and ResearchStudy contracts;
- native FHIR R5 SubscriptionTopic/Subscription configuration builders,
  official search catalogs and a strict notification-Bundle parser; terminal
  asynchronous job messages remain claims-first Communication resources.

Claim catalogs and graph builders are deliberately different surfaces.
`fhir-data-utils-ts/claims` owns canonical storage names and their specs;
`fhir-data-utils-ts/builders` authors correlated multi-resource graphs using
those catalogs. The old `/immunization-flat-claims` and
`/immunization-reminder-plan` paths are deprecated compatibility re-exports;
new code imports `/builders` or `/builders/immunization`.

Encounter projection preserves the originating `Appointment` reference and
uses the canonical R4 lifecycle (`in-progress` while care is underway,
`finished` when it ends). ImagingStudy projection stores searchable study
metadata and protected endpoint references only. DICOM instances and pixel
payloads remain outside this neutral package and are never embedded as flat
claims.

FHIR instants, resource ids and provider business identifiers remain separate.
Use `fhirInstantToEpochSeconds(...)` only when a downstream convention needs a
derived whole-second value; retain the original timezone-bearing instant and
an independent `Encounter.id`. See
[`docs/ENCOUNTER_IDENTIFIERS_AND_TIME.md`](docs/ENCOUNTER_IDENTIFIERS_AND_TIME.md).

Use the `/fhir-temporal-presentation` entry point at UI boundaries. It formats
FHIR date, dateTime and instant values with the user's locale and IANA time
zone, composes separate `YYYY-MM-DD` and `HH:mm[:ss]` editor fields, and
evaluates inclusive date-time ranges. ISO values remain the wire/storage form;
they are not user-facing labels.

No consumer should copy claim paths or rebuild these structures with literals.
Use `fhir-data-utils-ts/claims`, `/converters`, `/fhir-bundle`,
`/fhir-search-parameters`, `/clinical-terminology`, `/group-r5` or
`/research-study-r5` as appropriate.

The `/healthcare-service-specialty-map` subpath exposes the complete supplied
C80-to-LOINC candidate mapping. Only strict equivalence can be selected
automatically; wider, related, inexact and unmatched candidates remain review
evidence.

Repeatable `CodeableConcept.coding[]` identities are serialized in the owning
token claim as a comma-separated list of complete `system|code` tokens. The
first `*-display` remains source evidence for compatibility; authoritative
labels for every coding are resolved from each token at the terminology
boundary. FHIR `Quantity.unit` remains separate from its coded identity:
MedicationStatement dosage uses `dose-quantity-unit` for the human unit and
`dose-quantity` for `system|code`.

## Observation components

Composite observations use a claims-first resource graph. The primary
Observation owns `Observation.has-member`; each component is an independent
reduced Observation entry using the ordinary code and quantity claims and no
top-level `Observation.status`. This allows every component to be indexed
without inventing scale-specific claim families. At the explicit FHIR export
boundary, the graph is projected back to one native Observation with
`component[]`.

Historical JSON/CSV `Observation.component-*` claims and blood-pressure `bp-*`
aliases are read-only compatibility inputs. Current writers emit none of them.
Components never use `is-contained`, `contained-parent-reference` or the
generic contained-resource link.

This is why blood pressure does not have writable `bp-*` claims. Systolic and
diastolic are independently indexed reduced Observation rows linked by the
parent's `Observation.has-member`; the R4/R5 adapter alone reconstructs native
`component[]`. The same representation works for future assessment scales
without inventing a new flat-claim family for each scale.

`buildVitalSignObservation` owns the graph, canonical displays and optional
`Observation.user-selected` provenance flag. Consumers submit its `entries`
without reconstructing component claims or relationships.

Repeated morning/evening capture uses `buildRepeatedVitalSignAverage`: three
two-minute raw readings remain `registered`, while their derived arithmetic
mean is `preliminary`. `buildVitalSignDailyDocument` groups the day's top-level
Observations under one preliminary Composition; only
`finalizeVitalSignDailyDocument` returns a final Composition and final
top-level Observations with a professional attester. Ledger hashing, index
updates, Digital Twin and research eligibility remain owning-service policy.
See [Daily vital-sign document lifecycle](docs/VITAL_SIGN_DAILY_DOCUMENT.md).

See [Clinical typed accessor boundary](docs/CLINICAL_TYPED_ACCESSOR_BOUNDARY.md)
for the exact division between canonical clinical claims/converters here,
downstream schemas and mutable Bundle getters/setters.

## Coding review for imported clinical text

Coding review uses one neutral contract from
`fhir-data-utils-ts/coding-review-flat-claims`:

- imported wording is the canonical `<ResourceType>.<code-field>-text` claim;
- `meta.codingProposals[]` is a sibling of `meta.claims` on that same contained
  clinical resource, never on `ResearchSubject.meta`;
- a proposal targets the coded claim, such as `Condition.code` or
  `Immunization.vaccination-code`;
- accepting a candidate adds `system|code` and the official `-display`, while
  retaining the imported local `-text` value;
- language-qualified generated local labels use `-text_<BCP47>` and do not
  replace imported text until review explicitly chooses that operation.

The package exports builders, traversal/confirmation helpers and
`CODING_REVIEW_EXAMPLES`. Tests and consumers reuse them instead of duplicating
claim strings, terminology identifiers, codes or UUIDs.

## R5 asynchronous notifications

`fhir-data-utils-ts/subscription-r5` separates three boundaries:

- `SubscriptionTopic` and `Subscription` are native R5 configuration resources;
- the job-completion `Communication` is canonical flat-claim business data;
- `Bundle[type=subscription-notification]` is parsed only at the receiving
  rest-hook boundary.

The shared package owns types, builders, official SearchParameter metadata and
validation. DataConv owns emitting the terminal Communication, GW owns durable
subscription delivery, and each BFF owns authenticated inbox persistence and
browser/email/push fan-out. Tenant-level Communication subscriptions initially
use no server-side filter; the receiving BFF routes the minimal full resource by
its canonical `Communication.recipient` claim.

## Verification gate

`npm run check` runs strict type checking, all contract tests and built-in
coverage over converters, builders and core FHIR utilities. The package also
tests every stable export subpath. Release validation additionally inspects the
packed artifact and installs it in an isolated consumer before publication.

## Care, emergency and population-alert graphs

The package provides the neutral FHIR foundation for Location-linked Encounter care
journeys, emergency ServiceRequest plus triage Task, and cohort
CommunicationRequest against a frozen Group snapshot. See
[the contract guide](docs/CARE_EMERGENCY_ALERT_CONTRACTS.md). Product policy,
access, encryption and delivery do not belong in these builders.

## Communication request authoring

`FHIR_COMMUNICATION_REQUEST_FORM_SCHEMA` and its typed adapters are exported
from `fhir-data-utils-ts/data`. They let Personal and Professional portals use
the same fields while keeping UI labels, widgets and authorization outside this
package. Recipients remain exact FHIR references, so a request can target the
patient and only the authorized `RelatedPerson` records selected for that
message. `requester` records who prepared the request and
`informationProviders` records the professionals expected to supply or review
its content; neither field grants permission by itself.

The package exposes separate `CommunicationRequest` projections for published
FHIR R4 and FHIR R5. It intentionally exposes no R6 or combined R5/R6 adapter.

## Clinical documents and Encounter journeys

A FHIR document always starts with `Composition`; `Encounter` is its optional
care context through `Composition.encounter`, not the document root. The same
section viewer can therefore render an IPS, emergency note, progress note or
diagnostic report by reading the Composition title/type and section graph.

Encounter navigation is a separate journey graph. Child service encounters
use `Encounter.partOf` for the strict care hierarchy and their periods provide
chronological previous/next navigation. The individual remains the clinical
subject. `ResearchSubject` is not used for care delivery or document browsing.
See [Clinical documents and Encounter exploration](docs/CLINICAL_DOCUMENT_ENCOUNTER_EXPLORATION.md).
# Coding-review workflow

Imported wording remains in the resource's canonical `*-text` flat claim. Each
unconfirmed terminology suggestion lives beside `meta.claims` in the owning
contained resource's `meta.codingProposals[]`; it is never moved to
`ResearchSubject.meta`.

Review state comes only from `codingProposals[].status`. A Coding
`userSelected=true` flat claim records that a human selected the accepted code;
it is not a draft, publication or promotion flag. Consumers can use the shared
review families `allergies-intolerances`, `procedures`, `diagnostics` and
`immunizations` without product-specific literals.
