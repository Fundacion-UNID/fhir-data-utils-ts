// Flow contract: three timestamped registered readings form one MORN/EVE preliminary mean, one preliminary daily Composition references every raw and mean Observation, and authorized confirmation atomically returns a final document graph without indexing or research policy.
import assert from 'node:assert/strict'
import test from 'node:test'

import { CompositionClaim, CompositionAttesterModes } from '../dist/claims/composition-claims.js'
import { compositionFhirR4ToFlat, compositionFlatToFhirR4 } from '../dist/converters/convert-composition.js'
import {
  ObservationClaim,
  VITAL_SIGN_EXAMPLES,
  VitalSignUnit,
  buildRepeatedVitalSignAverage,
  buildVitalSignDailyDocument,
  finalizeVitalSignDailyDocument,
} from '../dist/vital-sign-observations.js'

const { subjectReference, deviceReference } = VITAL_SIGN_EXAMPLES

const morningBloodPressureReadings = [
  { entryId: 'bp-morn-1', measuredAt: '2026-09-27T08:00:00-07:00', systolic: 123, diastolic: 81 },
  { entryId: 'bp-morn-2', measuredAt: '2026-09-27T08:02:00-07:00', systolic: 120, diastolic: 78 },
  { entryId: 'bp-morn-3', measuredAt: '2026-09-27T08:04:00-07:00', systolic: 126, diastolic: 84 },
]

test('creates a preliminary mean from three two-minute registered readings without losing raw evidence', () => {
  const session = buildRepeatedVitalSignAverage({
    entryId: 'bp-morn-average',
    subjectReference,
    deviceReference,
    kind: 'blood-pressure',
    eventTiming: 'MORN',
    readings: morningBloodPressureReadings,
  })

  assert.equal(session.sourceGraphs.length, 3)
  assert.ok(session.sourceGraphs.every(graph => graph.primary.claims[ObservationClaim.Status] === 'registered'))
  assert.ok(session.sourceGraphs.every(graph => graph.primary.claims[ObservationClaim.DateWhen] === 'MORN'))
  assert.equal(session.averageGraph.primary.claims[ObservationClaim.Status], 'preliminary')
  assert.equal(session.averageGraph.primary.claims[ObservationClaim.DateWhen], 'MORN')
  assert.equal(session.averageGraph.primary.claims[ObservationClaim.DerivedFrom], morningBloodPressureReadings.map(reading => `Observation/${reading.entryId}`).join(','))
  assert.deepEqual(
    session.averageGraph.components.map(component => component.claims[ObservationClaim.ValueQuantityNumber]),
    ['123', '81'],
  )
})

test('keeps a repeated Fahrenheit temperature session in its governed UCUM unit', () => {
  const session = buildRepeatedVitalSignAverage({
    entryId: 'temperature-eve-average', subjectReference, kind: 'temperature', eventTiming: 'EVE',
    readings: [
      { entryId: 'temperature-eve-1', measuredAt: '2026-09-27T19:00:00-07:00', value: 99.1, unit: VitalSignUnit.temperatureFahrenheit },
      { entryId: 'temperature-eve-2', measuredAt: '2026-09-27T19:02:00-07:00', value: 99.3, unit: VitalSignUnit.temperatureFahrenheit },
      { entryId: 'temperature-eve-3', measuredAt: '2026-09-27T19:04:00-07:00', value: 99.2, unit: VitalSignUnit.temperatureFahrenheit },
    ],
  })
  assert.equal(session.averageGraph.primary.claims[ObservationClaim.ValueQuantityNumber], '99.2')
  assert.equal(session.averageGraph.primary.claims[ObservationClaim.ValueQuantityUnit], VitalSignUnit.temperatureFahrenheit)
  assert.equal(session.averageGraph.primary.claims[ObservationClaim.DateWhen], 'EVE')
})

test('builds one preliminary daily document and finalizes all top-level Observations only on confirmation', () => {
  const morning = buildRepeatedVitalSignAverage({
    entryId: 'bp-morn-average', subjectReference, deviceReference,
    kind: 'blood-pressure', eventTiming: 'MORN', readings: morningBloodPressureReadings,
  })
  const draft = buildVitalSignDailyDocument({
    entryId: 'vitals-2026-09-27',
    identifier: 'urn:uuid:00000000-0000-4000-8000-000000000071',
    subjectReference,
    authorReference: 'PractitionerRole/nurse-one',
    localDate: '2026-09-27',
    timeZone: 'America/Vancouver',
    observationGraphs: [...morning.sourceGraphs, morning.averageGraph],
  })

  assert.equal(draft.composition.claims[CompositionClaim.Status], 'preliminary')
  assert.equal(draft.composition.claims[CompositionClaim.Entry], draft.observations.map(graph => graph.primary.reference).join(','))
  assert.ok(draft.observations.every(graph => ['registered', 'preliminary'].includes(graph.primary.claims[ObservationClaim.Status])))
  const nativeDraft = compositionFlatToFhirR4(draft.composition.claims)
  assert.equal(nativeDraft.status, 'preliminary')
  assert.deepEqual(nativeDraft.section[0].entry.map(entry => entry.reference), draft.observations.map(graph => graph.primary.reference))
  const roundTripClaims = compositionFhirR4ToFlat(nativeDraft)
  assert.equal(roundTripClaims[CompositionClaim.Status], 'preliminary')
  assert.equal(roundTripClaims[CompositionClaim.Entry], draft.composition.claims[CompositionClaim.Entry])

  const finalDocument = finalizeVitalSignDailyDocument(draft, {
    attesterReference: 'PractitionerRole/nurse-one',
    confirmedAt: '2026-09-28T00:15:00-07:00',
  })
  assert.equal(finalDocument.composition.claims[CompositionClaim.Status], 'final')
  assert.equal(finalDocument.composition.claims[CompositionClaim.Attester], 'PractitionerRole/nurse-one')
  assert.equal(finalDocument.composition.claims[CompositionClaim.AttesterMode], CompositionAttesterModes.Professional)
  assert.ok(finalDocument.observations.every(graph => graph.primary.claims[ObservationClaim.Status] === 'final'))
  assert.equal(finalDocument.entries[0], finalDocument.composition)
  assert.throws(() => finalizeVitalSignDailyDocument(finalDocument, {
    attesterReference: 'PractitionerRole/nurse-one', confirmedAt: '2026-09-28T00:16:00-07:00',
  }), /vital_sign_daily_preliminary_required/)
})

test('rejects incomplete cadence and mixed local dates', () => {
  assert.throws(() => buildRepeatedVitalSignAverage({
    entryId: 'bp-incomplete-average', subjectReference, kind: 'blood-pressure', eventTiming: 'MORN',
    readings: morningBloodPressureReadings.slice(0, 2),
  }), /vital_sign_repeated_reading_count_invalid/)
  assert.throws(() => buildRepeatedVitalSignAverage({
    entryId: 'bp-wrong-cadence-average', subjectReference, kind: 'blood-pressure', eventTiming: 'MORN',
    readings: [morningBloodPressureReadings[0], { ...morningBloodPressureReadings[1], measuredAt: '2026-09-27T08:03:00-07:00' }, morningBloodPressureReadings[2]],
  }), /vital_sign_repeated_reading_cadence_invalid/)

  const morning = buildRepeatedVitalSignAverage({
    entryId: 'bp-morn-average', subjectReference, kind: 'blood-pressure', eventTiming: 'MORN', readings: morningBloodPressureReadings,
  })
  assert.throws(() => buildVitalSignDailyDocument({
    entryId: 'vitals-2026-09-26', identifier: 'urn:uuid:00000000-0000-4000-8000-000000000072',
    subjectReference, authorReference: 'PractitionerRole/nurse-one', localDate: '2026-09-26',
    timeZone: 'America/Vancouver', observationGraphs: [...morning.sourceGraphs, morning.averageGraph],
  }), /vital_sign_daily_local_date_mismatch/)
})
