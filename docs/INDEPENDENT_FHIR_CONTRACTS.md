# Independent FHIR contracts

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
