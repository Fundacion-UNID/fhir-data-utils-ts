# Native Communication projection

`FhirCommunicationResource` and its compatibility spelling `FhirCommunication`
describe the native exchange subset at an explicit adapter boundary. Import them
from `fhir-data-utils-ts` or `fhir-data-utils-ts/fhir-types`.

The projection reuses the package's reference, coding, annotation and resource
types. `FhirAttachment` describes the attachment subset, while `FhirMeta`
describes standard metadata fields. Additional metadata fields have type
`unknown`. A consumer can provide an explicit metadata type parameter; this
does not turn its extension into standard FHIR metadata or confer authority.

Optional properties permit partial projections used during import. The type
does not validate a complete resource, enforce required profile elements, check
payload choice cardinality, validate base64, or prove delivery. The selected
FHIR version and profile must be validated separately. Persistence remains
minimal identity plus flat claims; a native projection is an exchange value.

Standards references:

- [FHIR R4 Communication](https://hl7.org/fhir/R4/communication.html)
- [FHIR R4 Attachment](https://hl7.org/fhir/R4/datatypes.html#Attachment)
- [FHIR R4 Meta](https://hl7.org/fhir/R4/resource.html#Meta)

Original compatibility source:
<https://github.com/Global-DataCare/gdc-common-utils-ts>, specifically the
[reviewed native resource declarations](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/f4031b221216cacd9917d1d20c5ff0b03bed7045/src/models/fhir-documents.ts).
Only the neutral exchange subset is adopted. Message envelopes, internal entry
models, collection routing, clinical creator permissions and replacement policy
remain outside this package. Existing document and section code catalogues and
resource discriminators already have package-owned definitions and should be
reused rather than copied from a compatibility source.
