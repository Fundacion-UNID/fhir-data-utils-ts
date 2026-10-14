# Care, emergency and population-alert FHIR contracts

This package owns only the product-neutral FHIR representation used by three
care and emergency journeys.
Authorization, controller discovery, encryption, transport, storage and UI
policy remain in their owning product or service layers.

## Hospital or clinic care journey

An `Appointment` plans care. Marking it fulfilled can originate one parent
`Encounter`; it must not erase the `Encounter.appointment` reference. Admission,
imaging, intensive care and discharge are independent child `Encounter`
resources linked through `Encounter.partOf`, each with its actual `Location`.
This graph supports a bounded location timeline. It does not itself grant a
relative permission to see locations or clinical records.

A voice/video call or encrypted missed-call message may occur before a report
is published. Transport events are not clinical attestation and must not
silently change an Encounter, a daily draft or the individual's index.

## Resilient emergency request

An emergency request is a standard claims-first `ServiceRequest`. Its service
and category are compact `system|code` tokens; writers never emit split
`code-system`, `code-value` or stored `code-display` claims. A local phrase may
remain in `ServiceRequest.code-text`; a trusted display is resolved from the
code at the terminology boundary.

Acknowledgement and triage use a separate durable `Task` whose `focus`
references the request. Requester, subject, intended performer and task owner
are explicit inputs. None of those references is inferred as authorization.

## Donation and public-risk campaign

The campaign-level `CommunicationRequest.subject` is a frozen, enumerated
`Group` snapshot. Its `reasonReference` points to the definitional cohort used
to create that snapshot. Per-recipient eligibility, current Consent,
subscription/channel status, exclusions and delivery audit must be rechecked
outside this neutral package immediately before creating each individual
`Communication`.

The snapshot and request are evidence of evaluation and intent, not permission
to disclose group membership or send a message.

## Public API

Use `fhir-data-utils-ts/care-emergency-alert` for graph builders and the package
root or `fhir-data-utils-ts/converters` for R4 projections. Persistence remains
flat claims. Native FHIR is materialized only at an explicit import/export
boundary.
