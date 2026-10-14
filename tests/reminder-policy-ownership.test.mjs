// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import assert from 'node:assert/strict'
import test from 'node:test'
import * as fhirData from '../dist/index.js'
import * as reminderCompatibility from '../dist/builders/immunization-reminders.js'

test('keeps notification-channel policy out of the general FHIR data surface', () => {
  assert.equal('ImmunizationReminderChannels' in fhirData, false)
  assert.ok(reminderCompatibility.ImmunizationReminderChannels)
})
