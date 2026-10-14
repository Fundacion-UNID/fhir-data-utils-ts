# Daily vital-sign document lifecycle

This package owns the product-neutral FHIR data contract used by web portals,
telephone assistants, chatbots and device importers. It does not decide who
may attest, write an index, anchor a hash on a ledger or contribute data to a
research study.

## Repeated readings

`buildRepeatedVitalSignAverage(...)` requires exactly three readings separated
by two minutes. It returns:

- three raw `Observation` graphs with `status=registered`;
- one arithmetic-mean `Observation` with `status=preliminary`;
- `Observation.date-when=MORN|AFT|EVE|NIGHT` on raw and mean observations;
- `Observation.derived-from` references from the mean to all raw observations.

Blood pressure remains one native Observation with systolic and diastolic
components. Its flat representation keeps the established primary
`Observation.has-member` graph. No `bp-*`, `component-*`, containment or split
coding claims are written.

```ts
const morningBloodPressure = buildRepeatedVitalSignAverage({
  entryId: averageObservationId,
  subjectReference,
  deviceReference,
  kind: 'blood-pressure',
  eventTiming: 'MORN',
  readings: threeTimestampedReadings,
})
```

Temperature accepts governed UCUM Celsius or Fahrenheit units. Body weight
accepts governed UCUM kilograms or avoirdupois pounds. A UI selects one of the
exported `VitalSignUnit` constants; it never assembles a UCUM token itself.

## One document per local day

`buildVitalSignDailyDocument(...)` validates every Observation against an
explicit IANA time zone and local calendar date. It returns one preliminary
`Composition` followed by every Observation graph entry. The Composition
references only the top-level Observations through `Composition.entry`; reduced
blood-pressure members remain reachable through `Observation.has-member`.

```ts
const dailyDraft = buildVitalSignDailyDocument({
  entryId: dailyCompositionId,
  identifier: dailyDocumentIdentifier,
  subjectReference,
  authorReference,
  localDate,
  timeZone,
  observationGraphs: [
    ...morningBloodPressure.sourceGraphs,
    morningBloodPressure.averageGraph,
  ],
})
```

The draft is readable as preliminary clinical work. It is not final evidence
and this package does not make it eligible for an individual index, Digital
Twin or research projection.

`finalizeVitalSignDailyDocument(...)` requires a preliminary document, records
the professional attester and confirmation time, and returns a new immutable
graph with the Composition and all top-level Observations set to `final`.

```ts
const finalDailyDocument = finalizeVitalSignDailyDocument(dailyDraft, {
  attesterReference,
  confirmedAt,
})
```

The owning service may now serialize and hash this one daily document graph.
Index, ledger and research writes remain separate policy-controlled operations;
failure in one must not silently claim success in another.

