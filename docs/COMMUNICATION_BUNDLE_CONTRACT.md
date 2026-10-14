# Communication Bundle contract

Every cross-participant clinical or administrative exchange uses the same
two-level FHIR envelope. This is the portable contract for downstream
channels; HTTP, DIDComm, encryption and recipient resolution remain in their
owning library or service.

```text
outer Bundle (type=batch)
└── Communication
    └── payload.contentAttachment
        ├── contentType = application/fhir+json
        └── data = base64(inner Bundle)
            ├── type=document | batch | collection
            └── Appointment, DocumentReference, Observation, ...
```

The outer batch is the delivery command. The Communication supplies sender,
recipient, subject, status and conversation context. Its single attachment is
always the inner Bundle. A PDF, image, audio file or `text/calendar` event is
not another direct Communication attachment: it is a `DocumentReference`
resource inside the inner Bundle. This keeps one entry point for parsing,
authorization, persistence and audit regardless of channel.

Inner Bundle types keep their ordinary FHIR meaning:

- `document` starts with `Composition` and represents an attested document;
- `batch` contains executable entries and every entry has `request.method` and
  `request.url`;
- `collection` groups related resources without execution or document order.

## Neutral tools and high-level ownership

`fhir-data-utils-ts` owns only the FHIR tools. It validates and projects a
received exchange without owning mutable application sessions:

```ts
import { readCommunicationBundlePayloads } from 'fhir-data-utils-ts'

const payloads = readCommunicationBundlePayloads(receivedOuterBatch)
const innerBundle = payloads[0].bundle
```

The validator fails closed when the outer resource is not a batch Bundle, an outer
batch entry lacks its request, the Communication has anything other than one
FHIR Bundle attachment, or the inner Bundle violates its declared type.

Downstream libraries own high-level Bundle and Communication editors/readers,
cross-sector input contracts, fixtures, transport and product policy. This
package neither imports nor wraps those consumer surfaces.

At the GW persistence boundary, the validated native resources are projected
to independent `resource.meta.claims` rows. Direct flat-claim CRUD is an
internal storage operation; it is not a replacement wire format for this
cross-participant exchange contract.

`projectAppointmentCommunicationBatchToFlatGraph(...)` is the first typed
projection using this boundary. It preserves Appointment timing and references
and emits the calendar DocumentReference independently. Consumers must not
decode the attachment or recreate these claims with literals.
