# Indexed clinical compatibility

Select a profile explicitly when converting indexed clinical data. Import the
following functions through `fhir-data-utils-ts/indexed-r4`, the package root or
the `converters` subpath:

| Function | Required profile | Supported resources |
| --- | --- | --- |
| `indexedR4ResourceToClaims` | `indexed-r4-semantic` | MedicationStatement, Observation, AllergyIntolerance, Condition, DeviceUseStatement, Flag, Procedure, Immunization, DocumentReference, RelatedPerson, DiagnosticReport, CarePlan, Encounter, Consent |
| `indexedR4ClaimsToResource` | `indexed-r4-semantic` | AllergyIntolerance, CarePlan, Composition, Condition, Consent, DeviceUseStatement, DiagnosticReport, DocumentReference, Flag, Immunization, MedicationStatement, Observation, Procedure |
| `indexedStructuralResourceToClaims` / `indexedStructuralClaimsToResource` | `indexed-structural-compat-v1` | ImagingStudy, ImmunizationRecommendation, Medication, EncounterHistory, AdverseEvent |
| `documentSupportResourceToClaims` | `document-support-r4-v1` | Composition, Organization, PractitionerRole, Device, Location, Coverage, Appointment and AppointmentResponse use their semantic pairs; Patient and Practitioner use structural projection |

The structural profile names historical compatibility families. It makes no
R4 conformance claim: EncounterHistory is an R5 resource. A semantic function
rejects unsupported families rather than selecting structural conversion.
An outer route or requested output label does not select a native version.
Native R5 semantic projection is not provided by these functions.

The five ancillary document families preserve existing linked-document import
support through their owned R4 converters. This admission does not extend the
GW semantic input/output or structural compatibility families. The document
planner keeps complete cloned native entries and their references; these flat
claims are bounded search projections, not a replacement for the full document.
Embedded source claims remain the caller's explicit precedence decision and
never confer identity or authority in this library.
The existing owned Location converter retains zero coordinates, and the
Appointment converter adds its explicit date/patient/location search fields.
These additive values were absent from the predecessor's projections and are
asserted separately alongside recorded wire compatibility.

`org.hl7.fhir.api` is the internal compatibility tag for these flat claims,
not a published HL7 namespace URI. Semantic imports emit that tag. Semantic
exports accept it or an absent historical tag, normalize qualified keys under
it, and reject version-specific namespaces. Explicit short keys take precedence
over equivalent qualified keys. A caller supplies the resource type for export;
Composition metadata does not change the selected family.

The semantic projection uses the first business Identifier and preserves its
system as a canonical `system|value` token. A historical raw value still projects
as an Identifier value. Internal resource.id is never substituted for a missing
business Identifier. Composition uses its native single-Identifier shape;
other admitted resources use an Identifier array. The supported concept slots
retain multiple coding identities. This is a bounded indexed projection, not a
complete native-resource snapshot or a full FHIR validator.
Uncoded AllergyIntolerance concept text stays in its text claim and projects as
text only; it is not promoted to a code. Existing stored code claims remain
readable, without asserting that their coding has been reviewed or confirmed.

The Observation profile writes and reads the existing parent JSON columns for
component code, primary display, quantity number and quantity unit. Empty cells
remain positional, including zero quantities and comma-bearing display text.
Malformed JSON, unequal column lengths and unsupported component value choices
are rejected. No child Observation is created and hasMember is not rewritten.
The independent graph converter remains available for callers that deliberately
select a different representation; this profile never initiates that migration.

MedicationStatement uses the owned quantity projection: dose unit text remains
distinct from its coded system/code, and historical coded-unit claims remain
readable. Correct quantity semantics are not a promise to reproduce an older
malformed native unit field byte for byte.

Input resources and claim maps remain unchanged. Imported meta.claims do not
overlay native fields in this library. Creator evidence, subject authorization,
permission checks, encrypted indexing, and any application-owned metadata
overlay remain with their owning runtime. Document support describes entries;
it does not verify their provenance or confer authority.

Compatibility vectors were recorded as synthetic data from the original
[semantic converter source](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/main/src/utils/clinical-resource-converters.ts)
and
[document builder source](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/main/src/utils/bundle-document-builder.ts).
Tests load those static records and owned code only. They do not load the
original implementation or make it a package dependency.
