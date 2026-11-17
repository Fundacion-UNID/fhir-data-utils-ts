# R4 document inspection

Import `validateR4DocumentBundleStructure` and
`getR4DocumentBundlePatientFullName` from `fhir-data-utils-ts/document-bundle-r4`
or the package root. Both accept untrusted parsed values and leave them unchanged.

The structure check collects four independent issues: resourceType must be
Bundle, type must be document, entry must be nonempty, and the first entry must
contain Composition. Its readonly result contains `ok` and `issues`. A passing
result does not establish complete FHIR schema validity, clinical correctness,
identity, a verified signature or access permission.

The name helper reads the first entry's Composition subject reference and finds
a Patient by fullUrl, Resource/id or bare id. It also accepts the final path
segments of a reference for compatibility. If no matching Patient exists, it
uses the first Patient. That fallback is deliberate compatibility behavior,
not an identity match. A matching Patient with no name returns undefined rather
than selecting a different Patient's name.

Within the chosen Patient, official HumanName wins over usual and then the
first available name. A nonempty text value wins over prefix, given, family
and suffix parts, joined in that order. Strings are trimmed; Unicode, accents,
punctuation and interior text whitespace are preserved. Missing or malformed
name fields produce no display name; they are not coerced into identity data.
Call the structure helper separately when structural admission is required.

This module does not rebind subjects, project claims, migrate Observation
components, compare names, persist resources or infer authority.

The basic compatibility rules were reviewed against the original
[document helper source](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/main/src/utils/bundle-document-builder.ts).
The native exchange structures are described in the official
[FHIR R4 Bundle](https://hl7.org/fhir/R4/bundle.html) and
[HumanName](https://hl7.org/fhir/R4/datatypes.html#HumanName) specifications.
