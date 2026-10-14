// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  composeFhirDateTimeFromLocalParts,
  formatFhirTemporalForLocale,
  isFhirTemporalWithinRange,
  splitFhirDateTimeForInput,
} from '../dist/fhir-temporal-presentation.js'

const TEMPORAL_EXAMPLES = Object.freeze({
  dateOnly: '2026-10-03',
  utcInstant: '2026-10-03T18:07:00.000Z',
  localDate: '2026-10-03',
  localTimeWithoutSeconds: '11:07',
  localTimeWithSeconds: '11:07:42',
  vancouverTimeZone: 'America/Vancouver',
})

test('formats FHIR dates and instants for the user instead of exposing ISO wire values', () => {
  assert.equal(formatFhirTemporalForLocale(TEMPORAL_EXAMPLES.dateOnly, 'es-ES'), '03/10/2026')
  assert.equal(
    formatFhirTemporalForLocale(TEMPORAL_EXAMPLES.utcInstant, 'en-CA', {
      timeZone: TEMPORAL_EXAMPLES.vancouverTimeZone,
      includeTime: true,
    }),
    'Oct 3, 2026, 11:07',
  )
})

test('composes separate local date and time fields and defaults omitted seconds to zero', () => {
  const withoutSeconds = composeFhirDateTimeFromLocalParts({
    date: TEMPORAL_EXAMPLES.localDate,
    time: TEMPORAL_EXAMPLES.localTimeWithoutSeconds,
    timeZone: TEMPORAL_EXAMPLES.vancouverTimeZone,
  })
  const withSeconds = composeFhirDateTimeFromLocalParts({
    date: TEMPORAL_EXAMPLES.localDate,
    time: TEMPORAL_EXAMPLES.localTimeWithSeconds,
    timeZone: TEMPORAL_EXAMPLES.vancouverTimeZone,
  })

  assert.equal(withoutSeconds, TEMPORAL_EXAMPLES.utcInstant)
  assert.equal(withSeconds, '2026-10-03T18:07:42.000Z')
  assert.deepEqual(splitFhirDateTimeForInput(withSeconds, TEMPORAL_EXAMPLES.vancouverTimeZone), {
    date: TEMPORAL_EXAMPLES.localDate,
    time: TEMPORAL_EXAMPLES.localTimeWithSeconds,
  })
})

test('applies inclusive temporal ranges and treats a missing upper bound as now', () => {
  const now = new Date('2026-10-03T19:00:00.000Z')

  assert.equal(isFhirTemporalWithinRange(TEMPORAL_EXAMPLES.utcInstant, {
    from: '2026-10-03T18:07:00.000Z',
  }, now), true)
  assert.equal(isFhirTemporalWithinRange('2026-10-03T20:00:00.000Z', {}, now), false)
  assert.equal(isFhirTemporalWithinRange('2026-10-03T17:59:59.000Z', {
    from: '2026-10-03T18:00:00.000Z',
  }, now), false)
})
