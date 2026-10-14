// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import assert from 'node:assert/strict'
import test from 'node:test'
import * as fhir from '../dist/index.js'

test('builds an Appointment-originated care journey with independent child Encounters and Locations', () => {
  const graph = fhir.buildEncounterCareJourneyFlatGraph({
    parent: {
      entryId: 'encounter-admission', identifier: 'urn:uuid:encounter-admission', status: 'in-progress',
      subjectReference: 'Patient/animal-one', appointmentReference: 'Appointment/appointment-one',
      serviceProviderReference: 'Organization/hospital-one', periodStart: '2026-09-26T08:00:00Z',
      locationReference: 'Location/admission',
    },
    stages: [{
      entryId: 'encounter-imaging', identifier: 'urn:uuid:encounter-imaging', status: 'finished',
      periodStart: '2026-09-26T08:30:00Z', periodEnd: '2026-09-26T09:00:00Z',
      locationReference: 'Location/imaging',
    }, {
      entryId: 'encounter-icu', identifier: 'urn:uuid:encounter-icu', status: 'in-progress',
      periodStart: '2026-09-26T09:10:00Z', locationReference: 'Location/icu',
    }],
  })

  assert.deepEqual(graph.map(entry => entry.resourceType), ['Encounter', 'Encounter', 'Encounter'])
  assert.equal(graph[0].claims[fhir.EncounterClaim.Appointment], 'Appointment/appointment-one')
  assert.equal(graph[0].claims[fhir.EncounterClaim.Location], 'Location/admission')
  assert.equal(graph[1].claims[fhir.EncounterClaim.PartOf], graph[0].reference)
  assert.equal(graph[1].claims[fhir.EncounterClaim.Subject], 'Patient/animal-one')
  assert.equal(graph[1].claims[fhir.EncounterClaim.ServiceProvider], 'Organization/hospital-one')
  assert.equal(graph[2].claims[fhir.EncounterClaim.Location], 'Location/icu')

  const projectedStage = fhir.encounterFlatToFhirR4(graph[1].claims)
  assert.equal(projectedStage.partOf.reference, graph[0].reference)
  assert.equal(fhir.encounterFhirR4ToFlat(projectedStage)[fhir.EncounterClaim.PartOf], graph[0].reference)
})

test('separates an emergency ServiceRequest from its durable triage Task', () => {
  const request = fhir.buildServiceRequestFlatEntry({
    entryId: 'service-request-one', identifier: 'urn:uuid:service-request-one', status: 'active', intent: 'order',
    priority: 'stat', code: { system: 'http://snomed.info/sct', code: '225358003', display: 'Emergency care' },
    subjectReference: 'Patient/animal-one', requesterReference: 'RelatedPerson/requester-one',
    performerReferences: ['HealthcareService/emergency-one'], authoredAt: '2026-09-26T10:00:00Z',
  })
  const task = fhir.buildServiceRequestTriageTaskFlatEntry({
    entryId: 'task-one', identifier: 'urn:uuid:task-one', serviceRequestReference: request.reference,
    subjectReference: 'Patient/animal-one', requesterReference: 'RelatedPerson/requester-one',
    ownerReference: 'Group/emergency-dispatch', authoredAt: '2026-09-26T10:00:01Z',
  })

  assert.equal(request.claims[fhir.ServiceRequestClaim.Code], 'http://snomed.info/sct|225358003')
  assert.equal(request.claims[fhir.ServiceRequestClaim.Performer], 'HealthcareService/emergency-one')
  assert.equal(task.claims[fhir.TaskClaim.Focus], request.reference)
  assert.equal(task.claims[fhir.TaskClaim.Owner], 'Group/emergency-dispatch')
  assert.equal(task.claims[fhir.TaskClaim.Status], 'requested')
  assert.equal(request.claims['ServiceRequest.code-system'], undefined)
  assert.equal(request.claims['ServiceRequest.code-value'], undefined)
  assert.equal(request.claims['ServiceRequest.code-display'], undefined)

  const projectedRequest = fhir.serviceRequestFlatToFhirR4(request.claims)
  assert.equal(projectedRequest.code.coding[0].code, '225358003')
  assert.equal(projectedRequest.performer[0].reference, 'HealthcareService/emergency-one')
  assert.equal(
    fhir.serviceRequestFhirR4ToFlat(projectedRequest)[fhir.ServiceRequestClaim.Code],
    request.claims[fhir.ServiceRequestClaim.Code],
  )
})

test('builds a governed alert request against one frozen enumerated Group snapshot', () => {
  const request = fhir.buildCohortCommunicationRequestFlatEntry({
    entryId: 'communication-request-one', identifier: 'urn:uuid:communication-request-one', status: 'active',
    priority: 'routine', subjectReference: 'Group/blood-donors-snapshot-one',
    requesterReference: 'Organization/blood-bank-one', authoredAt: '2026-09-26T11:00:00Z',
    category: { system: 'http://terminology.hl7.org/CodeSystem/communication-category', code: 'notification' },
    reasonReferences: ['Group/blood-donors-definition-one'],
  })

  assert.equal(request.claims[fhir.CommunicationRequestClaim.Subject], 'Group/blood-donors-snapshot-one')
  assert.equal(request.claims[fhir.CommunicationRequestClaim.Requester], 'Organization/blood-bank-one')
  assert.equal(request.claims[fhir.CommunicationRequestClaim.ReasonReference], 'Group/blood-donors-definition-one')
  assert.equal(request.claims[fhir.CommunicationRequestClaim.Category], 'http://terminology.hl7.org/CodeSystem/communication-category|notification')

  const projectedRequest = fhir.communicationRequestFlatToFhirR4(request.claims)
  assert.equal(projectedRequest.subject.reference, 'Group/blood-donors-snapshot-one')
  assert.equal(
    fhir.communicationRequestFhirR4ToFlat(projectedRequest)[fhir.CommunicationRequestClaim.Category],
    request.claims[fhir.CommunicationRequestClaim.Category],
  )
})

test('fails closed before creating ambiguous emergency or campaign resources', () => {
  assert.throws(() => fhir.buildServiceRequestFlatEntry({
    entryId: 'service-request-invalid', identifier: 'urn:uuid:service-request-invalid', status: 'active', intent: 'order',
    code: { system: 'http://snomed.info/sct', code: '225358003' }, subjectReference: 'Patient/animal-one',
    requesterReference: 'RelatedPerson/requester-one', performerReferences: [], authoredAt: '2026-09-26T10:00:00Z',
  }), /service_request_performer_required/)

  assert.throws(() => fhir.buildCohortCommunicationRequestFlatEntry({
    entryId: 'campaign-invalid', identifier: 'urn:uuid:campaign-invalid', status: 'active',
    category: { system: 'http://terminology.hl7.org/CodeSystem/communication-category', code: 'notification' },
    subjectReference: 'Patient/not-a-frozen-group', requesterReference: 'Organization/blood-bank-one',
    authoredAt: '2026-09-26T11:00:00Z', reasonReferences: ['Group/blood-donors-definition-one'],
  }), /communication_request_subject_group_required/)
})
