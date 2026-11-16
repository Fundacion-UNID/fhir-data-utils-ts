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

## Payload text and the controlled R4 profile

`CommunicationClaim.ContentString` holds the literal message body.
`CommunicationClaim.Text` remains resource Narrative and `NoteText` remains a
sender note. The payload adapters preserve Unicode, commas and JSON-significant
whitespace without converting either of those other fields into a message body.

Use `communicationPayloadItemFlatToFhirR4` and
`communicationPayloadItemFhirR4ToFlat` for one exclusive R4 content choice.
The item can contain a string, a reference or an attachment. References retain
`reference`; attachments retain `contentType`, `data`, `title` and `url`.
Additional native fields need a richer mapping and are rejected here rather
than discarded.

`communicationPayloadProfileFlatToFhirR4` and
`communicationPayloadProfileFhirR4ToFlat` implement a controlled multipart
profile: one optional text part, ordered reference parts, then one optional
attachment. This supports a message body followed by its Bundle reference.
The flat reference field stores its ordered values as CSV, so individual
reference values containing commas cannot use this profile. Duplicate text or
attachment parts and other native ordering are rejected to prevent data loss.
The existing broad native exchange types remain unchanged.

R4 permits `contentString`. R5 uses `contentCodeableConcept` for coded or textual
content, including its `text` field. These R4 adapters reject that R5 choice;
they do not relabel it as a string. Complete resource validation and the
canonical Communication/inner-Bundle delivery profile remain separate steps.

Standards references:

- [FHIR R4 Communication](https://hl7.org/fhir/R4/communication.html)
- [FHIR R4 payload choice](https://hl7.org/fhir/R4/communication-definitions.html#Communication.payload.content_x_)
- [FHIR R5 payload choice](https://hl7.org/fhir/R5/communication-definitions.html#Communication.payload.content_x_)
- [FHIR JSON string whitespace](https://hl7.org/fhir/R4/datatypes.html#string)
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
