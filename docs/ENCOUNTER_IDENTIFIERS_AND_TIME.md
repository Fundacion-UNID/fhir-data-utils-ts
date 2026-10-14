# Encounter identifiers and time

FHIR time and encounter identity are separate concepts.

- A FHIR `instant` is an ISO 8601 date and time with at least second precision
  and an explicit timezone. It is not a Unix timestamp.
- Unix epoch seconds may be derived for sorting, interoperability or a
  provider-owned business identifier, but they never replace the original
  instant.
- `Encounter.id` is the FHIR resource identifier.
- `Encounter.identifier` contains the business identifiers assigned by the
  care provider. Their namespace and uniqueness belong to the assigning
  organization.
- A display code is not sufficient authorization or subject resolution. An
  authoritative lookup must also verify the assigner and exact subject.

Reusable test data lives in `FHIR_ENCOUNTER_TRANSFER_TEST_DATA`. Tests and
downstream documentation import its named fields instead of duplicating raw
identifiers, timestamps or references.
