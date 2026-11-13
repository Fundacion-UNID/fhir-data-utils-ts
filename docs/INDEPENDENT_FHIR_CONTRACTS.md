# Independent FHIR contracts

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
