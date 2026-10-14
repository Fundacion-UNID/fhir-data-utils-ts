/** Product-neutral synthetic document directory linked to a chronological Encounter hierarchy. */

const subject = Object.freeze({
  reference: 'Patient/jane-doe-demo',
  displayName: 'Jane Doe',
})
const organizationReference = 'Organization/demo-hospital'
const parentEncounterReference = 'Encounter/admission-demo'

const parentEncounter = Object.freeze({
  resourceType: 'Encounter',
  id: 'admission-demo',
  status: 'in-progress',
  class: Object.freeze({ code: 'IMP', display: 'Inpatient encounter' }),
  subject: Object.freeze({ reference: subject.reference }),
  serviceProvider: Object.freeze({ reference: organizationReference }),
  actualPeriod: Object.freeze({ start: '2026-10-03T08:00:00Z' }),
})

function stage(input: Readonly<{
  id: string
  status: 'completed' | 'in-progress'
  serviceDisplay: string
  locationDisplay: string
  start: string
  end?: string
}>) {
  return Object.freeze({
    resourceType: 'Encounter',
    id: input.id,
    status: input.status,
    class: Object.freeze({ code: 'IMP', display: 'Inpatient encounter' }),
    subject: Object.freeze({ reference: subject.reference }),
    serviceType: Object.freeze([{ concept: Object.freeze({ text: input.serviceDisplay }) }]),
    serviceProvider: Object.freeze({ reference: organizationReference }),
    actualPeriod: Object.freeze({ start: input.start, ...(input.end ? { end: input.end } : {}) }),
    location: Object.freeze([{ location: Object.freeze({ reference: `Location/${input.id}`, display: input.locationDisplay }) }]),
    partOf: Object.freeze({ reference: parentEncounterReference }),
  })
}

const emergencyEncounter = stage({
  id: 'emergency-demo',
  status: 'completed',
  serviceDisplay: 'Emergency department',
  locationDisplay: 'Emergency bay',
  start: '2026-10-03T08:05:00Z',
  end: '2026-10-03T10:10:00Z',
})
const imagingEncounter = stage({
  id: 'imaging-demo',
  status: 'completed',
  serviceDisplay: 'Diagnostic imaging',
  locationDisplay: 'Imaging department',
  start: '2026-10-03T10:10:00Z',
  end: '2026-10-03T11:00:00Z',
})
const intensiveCareEncounter = stage({
  id: 'intensive-care-demo',
  status: 'in-progress',
  serviceDisplay: 'Intensive care',
  locationDisplay: 'Intensive care unit',
  start: '2026-10-03T11:00:00Z',
})

const encounters = Object.freeze([
  parentEncounter,
  emergencyEncounter,
  imagingEncounter,
  intensiveCareEncounter,
])

function documentBundle(input: Readonly<{
  id: string
  title: string
  type: string
  encounter: typeof emergencyEncounter | typeof imagingEncounter | typeof intensiveCareEncounter
  sectionTitle: string
  clinicalResource: Readonly<Record<string, unknown>>
  timestamp: string
}>) {
  const compositionReference = `Composition/${input.id}`
  const clinicalReference = `${input.clinicalResource.resourceType}/${input.clinicalResource.id}`
  const encounterReference = `Encounter/${input.encounter.id}`
  const composition = Object.freeze({
    resourceType: 'Composition',
    id: input.id,
    status: 'final',
    type: Object.freeze({ text: input.type }),
    subject: Object.freeze([{ reference: subject.reference }]),
    encounter: Object.freeze({ reference: encounterReference }),
    date: input.timestamp,
    author: Object.freeze([{ reference: organizationReference }]),
    title: input.title,
    section: Object.freeze([{
      title: input.sectionTitle,
      entry: Object.freeze([{ reference: clinicalReference }]),
    }]),
  })
  return Object.freeze({
    resourceType: 'Bundle',
    id: `bundle-${input.id}`,
    identifier: Object.freeze({ system: 'urn:ietf:rfc:3986', value: `urn:uuid:${input.id}` }),
    type: 'document',
    timestamp: input.timestamp,
    entry: Object.freeze([
      Object.freeze({ fullUrl: compositionReference, resource: composition }),
      Object.freeze({ fullUrl: subject.reference, resource: Object.freeze({ resourceType: 'Patient', id: 'jane-doe-demo', name: Object.freeze([{ given: Object.freeze(['Jane']), family: 'Doe' }]) }) }),
      Object.freeze({ fullUrl: organizationReference, resource: Object.freeze({ resourceType: 'Organization', id: 'demo-hospital', name: 'Demo Hospital' }) }),
      Object.freeze({ fullUrl: parentEncounterReference, resource: parentEncounter }),
      Object.freeze({ fullUrl: encounterReference, resource: input.encounter }),
      Object.freeze({ fullUrl: clinicalReference, resource: input.clinicalResource }),
    ]),
  })
}

const emergencyNote = documentBundle({
  id: 'emergency-note-demo',
  title: 'Emergency assessment',
  type: 'Emergency department note',
  encounter: emergencyEncounter,
  sectionTitle: 'Emergency assessment',
  timestamp: '2026-10-03T10:00:00Z',
  clinicalResource: Object.freeze({
    resourceType: 'ClinicalImpression',
    id: 'emergency-assessment-demo',
    status: 'completed',
    subject: Object.freeze({ reference: subject.reference }),
    encounter: Object.freeze({ reference: `Encounter/${emergencyEncounter.id}` }),
    summary: 'Initial emergency assessment completed',
  }),
})

const imagingReport = documentBundle({
  id: 'imaging-report-demo',
  title: 'Diagnostic imaging report',
  type: 'Diagnostic imaging report',
  encounter: imagingEncounter,
  sectionTitle: 'Imaging result',
  timestamp: '2026-10-03T10:55:00Z',
  clinicalResource: Object.freeze({
    resourceType: 'DiagnosticReport',
    id: 'imaging-result-demo',
    status: 'final',
    subject: Object.freeze({ reference: subject.reference }),
    encounter: Object.freeze({ reference: `Encounter/${imagingEncounter.id}` }),
    code: Object.freeze({ text: 'Diagnostic imaging assessment' }),
    conclusion: 'No acute finding requiring intervention',
  }),
})

const intensiveCareNote = documentBundle({
  id: 'intensive-care-note-demo',
  title: 'Intensive care progress note',
  type: 'Progress note',
  encounter: intensiveCareEncounter,
  sectionTitle: 'Current assessment',
  timestamp: '2026-10-03T11:30:00Z',
  clinicalResource: Object.freeze({
    resourceType: 'Observation',
    id: 'intensive-care-observation-demo',
    status: 'final',
    subject: Object.freeze({ reference: subject.reference }),
    encounter: Object.freeze({ reference: `Encounter/${intensiveCareEncounter.id}` }),
    code: Object.freeze({ text: 'Current clinical status' }),
    valueString: 'Stable under continuous monitoring',
    effectiveDateTime: '2026-10-03T11:25:00Z',
  }),
})

export const FHIR_CLINICAL_DOCUMENT_ENCOUNTER_JOURNEY_TEST_DATA = Object.freeze({
  subject,
  encounterCount: encounters.length,
  documentCount: 3,
  encounters,
  documents: Object.freeze([emergencyNote, imagingReport, intensiveCareNote]),
})
