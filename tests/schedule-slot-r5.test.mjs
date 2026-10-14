// Flow contract: one offered service owns its Schedule; independent Slot start/end intervals preserve that service's booking duration and never collapse into the department.
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ScheduleClaim,
  SlotClaim,
  LocationClaim,
  buildSchedulableLocationFlatResource,
  buildServiceScheduleFlatGraph,
  materializeClaimsFirstResourceToFhirR5,
  locationFhirR5ToFlat,
  scheduleFhirR5ToFlat,
  slotFhirR5ToFlat,
} from '../dist/index.js'

const SERVICE_TYPE_SYSTEM = 'http://terminology.hl7.org/CodeSystem/service-type'

test('builds independent blood and plasma schedules with 15-minute and one-hour slots', () => {
  const bloodGraph = buildServiceScheduleFlatGraph({
    scheduleId: 'blood-donation-weekday',
    scheduleIdentifier: 'urn:uuid:blood-donation-weekday',
    name: 'Blood donation weekday schedule',
    healthcareServiceReference: 'HealthcareService/blood-donation',
    resourceActorReferences: ['Location/blood-donation-bed-1'],
    serviceType: `${SERVICE_TYPE_SYSTEM}|117`,
    planningHorizon: { start: '2026-10-01', end: '2026-10-31' },
    slots: [{
      slotId: 'blood-20261001-0900',
      slotIdentifier: 'urn:uuid:blood-20261001-0900',
      status: 'free',
      start: '2026-10-01T09:00:00-07:00',
      end: '2026-10-01T09:15:00-07:00',
    }],
  })
  const plasmaGraph = buildServiceScheduleFlatGraph({
    scheduleId: 'plasma-donation-weekday',
    scheduleIdentifier: 'urn:uuid:plasma-donation-weekday',
    name: 'Plasma donation weekday schedule',
    healthcareServiceReference: 'HealthcareService/plasma-donation',
    resourceActorReferences: [
      'Location/plasma-donation-station-1',
      'Device/apheresis-machine-1',
      'PractitionerRole/plasma-professional-1',
    ],
    serviceType: `${SERVICE_TYPE_SYSTEM}|167`,
    planningHorizon: { start: '2026-10-01', end: '2026-10-31' },
    slots: [{
      slotId: 'plasma-20261001-0900',
      slotIdentifier: 'urn:uuid:plasma-20261001-0900',
      status: 'free',
      start: '2026-10-01T09:00:00-07:00',
      end: '2026-10-01T10:00:00-07:00',
    }],
  })

  assert.equal(bloodGraph[0].meta.claims[ScheduleClaim.ServiceTypeReference], 'HealthcareService/blood-donation')
  assert.deepEqual(bloodGraph[0].meta.claims[ScheduleClaim.Actor], [
    'HealthcareService/blood-donation', 'Location/blood-donation-bed-1',
  ])
  assert.equal(bloodGraph[1].meta.claims[SlotClaim.Schedule], 'Schedule/blood-donation-weekday')
  assert.equal(plasmaGraph[1].meta.claims[SlotClaim.End], '2026-10-01T10:00:00-07:00')
  assert.deepEqual(plasmaGraph[0].meta.claims[ScheduleClaim.Actor], [
    'HealthcareService/plasma-donation',
    'Location/plasma-donation-station-1',
    'Device/apheresis-machine-1',
    'PractitionerRole/plasma-professional-1',
  ])

  const bloodSchedule = materializeClaimsFirstResourceToFhirR5(bloodGraph[0])
  const bloodSlot = materializeClaimsFirstResourceToFhirR5(bloodGraph[1])
  assert.deepEqual(bloodSchedule.serviceType, [{
    concept: { coding: [{ system: SERVICE_TYPE_SYSTEM, code: '117' }] },
    reference: { reference: 'HealthcareService/blood-donation' },
  }])
  assert.deepEqual(bloodSchedule.actor, [
    { reference: 'HealthcareService/blood-donation' },
    { reference: 'Location/blood-donation-bed-1' },
  ])
  assert.equal(bloodSlot.schedule.reference, 'Schedule/blood-donation-weekday')
  assert.equal(Date.parse(bloodSlot.end) - Date.parse(bloodSlot.start), 15 * 60 * 1000)
  const scheduleRoundTrip = scheduleFhirR5ToFlat(bloodSchedule)
  const slotRoundTrip = slotFhirR5ToFlat(bloodSlot)
  assert.equal(scheduleRoundTrip[ScheduleClaim.ServiceType], `${SERVICE_TYPE_SYSTEM}|117`)
  assert.equal(scheduleRoundTrip[ScheduleClaim.ServiceTypeReference], 'HealthcareService/blood-donation')
  assert.equal(scheduleRoundTrip[ScheduleClaim.Actor], 'HealthcareService/blood-donation,Location/blood-donation-bed-1')
  assert.equal(slotRoundTrip[SlotClaim.Schedule], 'Schedule/blood-donation-weekday')
  assert.equal(slotRoundTrip[SlotClaim.ServiceTypeReference], 'HealthcareService/blood-donation')
  assert.equal(slotRoundTrip[SlotClaim.End], '2026-10-01T09:15:00-07:00')

  const plasmaSlot = materializeClaimsFirstResourceToFhirR5(plasmaGraph[1])
  assert.equal(Date.parse(plasmaSlot.end) - Date.parse(plasmaSlot.start), 60 * 60 * 1000)
})

test('rejects a slot outside its planning horizon or with a non-positive interval', () => {
  const base = {
    scheduleId: 'blood-donation-weekday',
    scheduleIdentifier: 'urn:uuid:blood-donation-weekday',
    name: 'Blood donation weekday schedule',
    healthcareServiceReference: 'HealthcareService/blood-donation',
    resourceActorReferences: ['Location/blood-donation-bed-1'],
    serviceType: `${SERVICE_TYPE_SYSTEM}|117`,
    planningHorizon: { start: '2026-10-01', end: '2026-10-31' },
  }
  assert.throws(() => buildServiceScheduleFlatGraph({
    ...base,
    slots: [{
      slotId: 'invalid-zero-duration', slotIdentifier: 'urn:uuid:invalid-zero-duration',
      status: 'free', start: '2026-10-01T09:00:00Z', end: '2026-10-01T09:00:00Z',
    }],
  }), /slot_interval_invalid/)
  assert.throws(() => buildServiceScheduleFlatGraph({
    ...base,
    slots: [{
      slotId: 'outside-horizon', slotIdentifier: 'urn:uuid:outside-horizon',
      status: 'free', start: '2026-11-01T09:00:00Z', end: '2026-11-01T09:15:00Z',
    }],
  }), /slot_outside_planning_horizon/)
})

test('clones schedulable child Locations without merging their operational identities', () => {
  const common = {
    managingOrganizationReference: 'Organization/blood-bank-department',
    parentLocationReference: 'Location/blood-donation-point',
    form: 'http://terminology.hl7.org/CodeSystem/location-physical-type|bd',
    position: { longitude: -123.1207, latitude: 49.2827 },
  }
  const bedOne = buildSchedulableLocationFlatResource({
    ...common,
    locationId: 'blood-donation-bed-1',
    locationIdentifier: 'urn:uuid:blood-donation-bed-1',
    name: 'Blood donation bed 1',
  })
  const bedTwo = buildSchedulableLocationFlatResource({
    ...common,
    locationId: 'blood-donation-bed-2',
    locationIdentifier: 'urn:uuid:blood-donation-bed-2',
    name: 'Blood donation bed 2',
  })

  assert.notEqual(bedOne.id, bedTwo.id)
  assert.equal(bedOne.meta.claims[LocationClaim.PartOf], 'Location/blood-donation-point')
  assert.equal(bedOne.meta.claims[LocationClaim.PositionLatitude], bedTwo.meta.claims[LocationClaim.PositionLatitude])
  const materializedBed = materializeClaimsFirstResourceToFhirR5(bedOne)
  assert.deepEqual(materializedBed.form, {
    coding: [{ system: 'http://terminology.hl7.org/CodeSystem/location-physical-type', code: 'bd' }],
  })
  assert.equal('physicalType' in materializedBed, false)
  assert.equal(locationFhirR5ToFlat(materializedBed)[LocationClaim.PartOf], 'Location/blood-donation-point')
  assert.equal(
    locationFhirR5ToFlat(materializedBed)[LocationClaim.PhysicalType],
    'http://terminology.hl7.org/CodeSystem/location-physical-type|bd',
  )
})
