# Independent FHIR contracts

`normalizeFhirApiClaimKey` accepts short claim names or their qualified
`org.hl7.fhir.api` spelling and rejects version-specific namespaces. It validates
syntax only; resource/parameter catalogue membership and permission checks stay
with callers. Original compatibility source:
<https://github.com/Global-DataCare/gdc-common-utils-ts>, specifically the
[reviewed claim-key helper](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/f4031b221216cacd9917d1d20c5ff0b03bed7045/src/utils/fhir-api-claim-helpers.ts).

`FhirCommunicationResource` and its `FhirCommunication` spelling describe a
native exchange subset using package-owned references and annotations.
`FhirAttachment`, `FhirCommunicationPayload` and `FhirMeta` are also exported
through the root and `fhir-types` subpath. Metadata extensions stay unknown
unless a consumer supplies its explicit generic contract. These declarations
do not perform full resource/profile validation or transport delivery. See
[native Communication projection](NATIVE_COMMUNICATION_PROJECTION.md).

`HL7_PERSONAL_RELATIONSHIP_ROLES` contains active, selectable concepts in the
[personal relationship ValueSet](https://terminology.hl7.org/ValueSet-v3-PersonalRelationshipRoleType.html),
using its underlying RoleCode coding system. The snapshot is derived from
[HL7 Terminology RoleCode 4.0.0](https://terminology.hl7.org/CodeSystem-v3-RoleCode.json)
under [CC0](https://terminology.hl7.org/license.html). Retired spelling aliases
are excluded. `HL7_V3_ROLE_CODE_LEGAL_REPRESENTATIVE` provides selected standard
representative descriptors. Neither catalog sets a selected role, UI default,
employment status, legal appointment or permission.

`IssueType`, `IssueSeverity` and their coding-system URLs expose the published
[R5 issue types](https://hl7.org/fhir/R5/valueset-issue-type.html) and
[R5 severities](https://hl7.org/fhir/R5/valueset-issue-severity.html).
Exact membership guards reject unknown codes without normalization. The
deprecated `IssueLevel` name references the same severity catalog.
`OperationOutcome` and `OperationOutcomeDetails` are minimal native exchange
projections, not alternative persisted clinical models or full validators.
Consumers apply their selected FHIR version's constraints; R5 success severity
must not imply R4 acceptance. HTTP mappings, status decisions and runtime errors
remain in downstream adapters and SDKs.

`CommunicationCategoryCodes` exposes the standard FHIR Communication categories
with an explicit coding-system URL, code and compact attribute token.

`FHIR_IPS_DOCUMENT_CODE` identifies the IPS document type. It is distinct from
`FHIR_IPS_SECTION_CODES`, which describe the document's clinical sections.

The root package exports `canonicalizeFhirResource` and
`FhirCanonicalizationOptions`. The function sorts object keys, preserves array
order and leaves the input untouched. By default it removes `meta.versionId`;
callers may explicitly retain it or remove root narrative and nested element
identifiers. This deterministic projection is not JSON-LD canonicalization.

`HL7_RELATED_PERSON_FUNCTIONAL_ROLES` carries a coding-system URL for each
functional descriptor. RoleCode and RoleClass remain distinct. These descriptors
describe a role and never establish legal evidence, employment or access.

`HealthcareConsentPurposes` contains the selected HL7 v3 ActReason code values.
Occupation definitions, role eligibility and authorization remain downstream.
The package has no dependency on an occupation-catalog provider.

## Native R4 adapters and Communication participant projections

`clinical-resource-adapters` composes the existing semantic R4 converters.
Unsupported resource families retain their structural fallback; explicit
`meta.claims`, primary business identifiers and language remain separate from
technical resource ids. Qualified API keys are normalized at import, while
version-specific claim contexts are rejected.

`communication-participant-search` owns normalization, projection indexes,
matching, pagination and native Parameters construction for its supported
profile. Actor, user and target controls are profile extensions. Matching a
filter does not authenticate or authorize a participant.

`buildVitalSignObservationEntry` is the scalar exchange bridge used by examples;
its coding keys come from the Observation catalog and it retains the supplied
timestamp spelling after validation. It emits no performer or attester. The
existing primary/member graph remains the owner of component panels.

`buildClinicalDocumentBundle` accepts an explicit caller-owned subject
projection for absolute subject references. The supplied full URL must match
the Composition subject exactly. It preserves clinical subject claims and
adds only native document context; it creates no index identity or authority.
