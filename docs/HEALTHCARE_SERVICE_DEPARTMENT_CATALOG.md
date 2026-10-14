# Organization departments and healthcare-service catalogs

This contract keeps four different concepts separate:

1. A legal provider is a FHIR `Organization`.
2. A suborganization or department is another `Organization` whose
   `partOf` references exactly one parent Organization.
3. An offered capability is a `HealthcareService` whose `providedBy`
   references the department that provides it.
4. A physical or virtual delivery place is a `Location`; one
   `HealthcareService` can reference several Locations.

A department and every offered `HealthcareService` remain distinct FHIR
resources. A claims-first directory projects one
`Organization/<department-id>` and one `HealthcareService/<service-id>` per
offered service. A blood bank can therefore expose blood donation and plasma
donation independently. Each service can own different Location references and
be the actor of a different Schedule; Slot duration and availability follow
that Schedule rather than the department.

`HealthcareService.appointmentRequired` states whether a person or animal must
have an appointment before receiving the service. It does not describe when
the service is available. Operational availability remains authoritative in
the service's `Schedule` and its `Slot` resources; clients must not copy those
intervals into a second service-level availability model.

`buildServiceScheduleFlatGraph(...)` implements that boundary. It emits one
independent claims-first `Schedule` plus independent `Slot` rows. A 15-minute
blood-donation interval and a one-hour plasma-donation interval are represented
by different `Slot.start`/`Slot.end` pairs; duration is never an invented flat
claim. `Schedule.actor` contains the applicable `HealthcareService` and
`Location`, while `Schedule.service-type-reference` retains the exact service.

```ts
const bloodAvailability = buildServiceScheduleFlatGraph({
  scheduleId: 'blood-donation-weekday',
  scheduleIdentifier: 'urn:uuid:blood-donation-weekday',
  name: 'Blood donation weekday schedule',
  healthcareServiceReference: 'HealthcareService/blood-donation',
  locationReference: 'Location/blood-donation-room',
  serviceType: 'http://terminology.hl7.org/CodeSystem/service-type|117',
  planningHorizon: { start: '2026-10-01', end: '2026-10-31' },
  slots: [{
    slotId: 'blood-20261001-0900',
    slotIdentifier: 'urn:uuid:blood-20261001-0900',
    status: 'free',
    start: '2026-10-01T09:00:00-07:00',
    end: '2026-10-01T09:15:00-07:00',
  }],
})
```

The adapters use the published R5 `CodeableReference(HealthcareService)` shape
for `Schedule.serviceType` and `Slot.serviceType`. Schedule and Slot remain
separate resources because slots change more frequently than their planning
container.

## Reservable capacity inside one place

A public donation or extraction point is a parent `Location`. Each independently
reservable room, booth, chair or bed is a child `Location.partOf` that parent.
`buildSchedulableLocationFlatResource(...)` creates those child Locations; a
clone may reuse coordinates but must use a new Location id and identifier.

Equipment is not disguised as a place. An apheresis machine is a FHIR `Device`.
The Schedule's actor list combines the offered `HealthcareService` with every
resource that must be available together, for example:

```text
HealthcareService/plasma-donation
Location/plasma-donation-station-1
Device/apheresis-machine-1
PractitionerRole/plasma-professional-1
```

Closing one station suspends its Location or blocks/deactivates its Schedule;
it does not cancel sibling stations. FHIR R4 materializes the governed physical
coding as `Location.physicalType`; R5 materializes it as `Location.form`.

## Equipment calibration and authorization

A machine used as schedule capacity is still a stable `Device`. Its lifecycle
has two independent evidence streams:

- `buildDeviceCalibrationFlatGraph(...)` records the completed technical work
  as a `Procedure` whose subject and focal device are the machine, records the
  corresponding `DeviceMetric.calibration` state/time, and can attach a
  `DocumentReference` carrying the certificate hash. The maintenance
  Organization and acting PractitionerRole are performers, not public
  regulators.
- `buildDeviceOperatingAuthorizationFlatResource(...)` records an R5
  `RegulatedAuthorization` issued by the regulator to the holder for the
  installed Location, DeviceDefinition, Organization or governed activity.
  FHIR R5 does not allow an individual Device instance as that resource's
  subject, so installation-specific authorization targets the installed
  Location and retains the individual Device through the associated evidence
  graph.

Both builders emit only minimal resource identity and `resource.meta.claims`.
The product authorization layer must validate the submitting organization's
credential, the acting role, jurisdiction and current assignment; this neutral
package deliberately does not decide whether an assistant, laboratory
technician, maintenance technician or inspector is permitted. Scheduling may
derive machine eligibility only after authoritative readback shows an active
Device, a current required calibration and a valid operating authorization.
It must not trust a browser-supplied `available` boolean.

`buildDepartmentServicesFlatGraph(...)` authors the department row followed by
one row for every service. Its input accepts complete `system|value`
identifiers, complete `system|code` service/category/specialty tokens and typed
`Organization/...` or `Location/...` references. It rejects bare split
fragments and duplicate service ids. The builder writes only `resourceType`,
`id` and `meta.claims`; it never persists a nested FHIR resource.

```ts
const [department, bloodDonation, plasmaDonation] = buildDepartmentServicesFlatGraph({
  departmentId: 'blood-bank',
  departmentIdentifier: 'https://example.invalid/departments|blood-bank',
  parentOrganizationReference: 'Organization/provider',
  name: 'Blood bank',
  services: [{
    serviceId: 'blood-donation',
    serviceIdentifier: 'https://example.invalid/services|blood-donation',
    name: 'Blood donation',
    serviceType: ['https://example.invalid/CodeSystem/service-type|blood-donation'],
    locationReferences: ['Location/blood-donation-room'],
  }, {
    serviceId: 'plasma-donation',
    serviceIdentifier: 'https://example.invalid/services|plasma-donation',
    name: 'Plasma donation',
    serviceType: ['https://example.invalid/CodeSystem/service-type|plasma-donation'],
    locationReferences: ['Location/plasma-donation-room'],
  }],
})
```

Two service Locations may carry identical coordinates and copied public media
when they describe separate operational rooms or check-in configurations. They
must still have distinct Location identities if schedules or instructions
differ. If the physical delivery place is genuinely the same resource, both
services may reference that one Location instead.

## Claims-first boundary

`HealthcareServiceClaim` contains the complete resource-specific FHIR R4
search surface. `healthcareServiceFlatToFhirR4` and
`healthcareServiceFhirR4ToFlat` are the only native-R4 adapter boundary.
Repeatable coding identities remain complete `system|code` tokens; labels are
resolved by the terminology service and are not trusted storage identity.
`HealthcareService.comment` and R5 `Organization.description` are governed
materialization claims, but are not falsely advertised as R4 SearchParameters.
The same applies to `HealthcareService.appointmentRequired`: it is an official
R4/R5 element and a governed materialization claim, not a resource-specific R4
SearchParameter.

`materializeClaimsFirstResourceToFhirR5(...)` accepts only minimal resource
identity plus `resource.meta.claims`. It rejects nested native FHIR fields and
materializes Organization, HealthcareService, Location, Schedule or Slot only for export,
interop, hashing or credential generation. The resulting R5 object is never
persisted as a second business source of truth.

`LocationClaim` also preserves the official WGS84 longitude, latitude and
optional altitude needed by a marketplace. Schema.org `Place.image`,
Organization logos and governed object-storage evidence remain downstream
catalog concerns because FHIR R4 `Location` has no native image field.

## Professional group boundary

`normalizeGroupR5ProfessionalServiceTeam` requires one singular
`Group.managingEntity` reference to one department Organization. A
professional can belong to several Groups, but one Group cannot span several
departments in this initial contract. Group membership is descriptive and
does not grant read, search, appointment, break-glass or communication access.

The department needs no independent DID document merely to own a Group or
HealthcareService. A stable registered Group endpoint can receive a reply for
the unit. Transport sender, clinical-document author and professional attester
remain different identities:

- product policy may set the legal Organization as `Composition.author`;
- the acting `PractitionerRole` is the professional attester;
- the authenticated employee/device is transport audit evidence; and
- a reply is addressed to the Group endpoint, not authored by the Group.

Those authorization, endpoint-registration and authorship policies belong to
the BFF/high-level SDK, not this neutral package.

## C80 to LOINC candidate mapping

`SnomedC80ToLoincSpecialtyConceptMap` preserves the supplied 115 distinct C80
rows and their reviewed relationship to LOINC Subject Matter Domain or
LL402-9 codes. It is candidate evidence, not an official SNOMED or LOINC map.
Only rows explicitly classified as strict `equivalent` are returned by
`findAutomaticLoincSpecialty`. Wider, related, inexact and unmatched rows must
remain visible for terminology governance and are never applied automatically.

Service type and clinical specialty are not interchangeable. For example,
respite is retained as a related type-of-service candidate rather than being
silently promoted to a specialty.
