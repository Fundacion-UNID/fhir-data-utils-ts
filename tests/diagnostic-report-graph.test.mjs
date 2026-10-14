// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ClinicalTerminologySystems,
  DiagnosticReportClaim,
  DiagnosticReportStatuses,
  DocumentReferenceClaim,
  ObservationClaim,
  ObservationStatuses,
  buildDiagnosticReportFlatGraph,
  buildDocumentReferenceFlatEntry,
  buildFlatClaimResourceEntry,
  addDiagnosticReportPerformerList,
  addDiagnosticReportResultList,
  getDiagnosticReportPerformerList,
  getDiagnosticReportResultList,
} from '../dist/index.js'

const FIXTURE = Object.freeze({
  reportId: 'diagnostic-report-1',
  observationId: 'observation-1',
  attachmentId: 'attachment-1',
  subject: 'Organization/animal-1',
  encounter: 'Encounter/encounter-1',
  performer: 'Organization/laboratory-1',
  issuedAt: '2026-09-26T10:30:00Z',
  reportCode: Object.freeze({
    system: ClinicalTerminologySystems.Loinc,
    // The literal is the governed LOINC panel exercised by this contract.
    code: '58410-2',
    display: 'Complete blood count panel',
    text: 'Complete blood count',
  }),
})

test('edits report result and performer references through descriptive claim helpers', () => {
  const withResults = addDiagnosticReportResultList({}, ['Observation/result-1', 'Observation/result-2'])
  const withPerformers = addDiagnosticReportPerformerList(withResults, 'Organization/laboratory-1')
  assert.deepEqual(getDiagnosticReportResultList(withPerformers), ['Observation/result-1', 'Observation/result-2'])
  assert.deepEqual(getDiagnosticReportPerformerList(withPerformers), ['Organization/laboratory-1'])
})

test('builds a coded DiagnosticReport graph with independent results and one PDF evidence resource', () => {
  const result = buildFlatClaimResourceEntry({
    entryId: FIXTURE.observationId,
    resourceType: 'Observation',
    claims: {
      [ObservationClaim.Identifier]: 'urn:uuid:observation-1',
      [ObservationClaim.Status]: ObservationStatuses.Final,
      [ObservationClaim.Subject]: FIXTURE.subject,
      [ObservationClaim.Code]: `${ClinicalTerminologySystems.Loinc}|718-7`,
      [ObservationClaim.ValueQuantityNumber]: '14.2',
    },
  })
  const attachment = buildDocumentReferenceFlatEntry({
    entryId: FIXTURE.attachmentId,
    identifier: 'urn:uuid:attachment-1',
    contentType: 'application/pdf',
    contentHash: 'sha3-384:fixture',
    title: 'Laboratory report',
    url: 'Binary/laboratory-report-1',
  })

  const graph = buildDiagnosticReportFlatGraph({
    entryId: FIXTURE.reportId,
    identifier: 'urn:uuid:diagnostic-report-1',
    status: DiagnosticReportStatuses.Preliminary,
    subjectReference: FIXTURE.subject,
    encounterReference: FIXTURE.encounter,
    performerReferences: [FIXTURE.performer],
    issuedAt: FIXTURE.issuedAt,
    reportCode: FIXTURE.reportCode,
    results: [result],
    attachments: [attachment],
  })

  const report = graph.find(entry => entry.entryId === FIXTURE.reportId)
  assert.equal(report.claims[DiagnosticReportClaim.Code], `${FIXTURE.reportCode.system}|${FIXTURE.reportCode.code}`)
  assert.equal(report.claims[DiagnosticReportClaim.CodeDisplay], FIXTURE.reportCode.display)
  assert.equal(report.claims[DiagnosticReportClaim.CodeText], FIXTURE.reportCode.text)
  assert.equal(report.claims[DiagnosticReportClaim.Result], result.reference)
  assert.equal(report.claims[DiagnosticReportClaim.Encounter], FIXTURE.encounter)
  assert.equal(
    report.claims[DiagnosticReportClaim.ContainedReferenceList],
    `${result.reference},${attachment.reference}`,
  )
  assert.equal(attachment.claims[DocumentReferenceClaim.ContentType], 'application/pdf')
  assert.equal(attachment.claims[DocumentReferenceClaim.ContentHash], 'sha3-384:fixture')
  assert.equal(attachment.claims[DocumentReferenceClaim.Description], 'Laboratory report')
  assert.equal(attachment.claims[DocumentReferenceClaim.Location], 'Binary/laboratory-report-1')
  assert.ok(graph.every(entry => !Object.keys(entry.claims).some(key => key.endsWith('.is-contained'))))
})

test('requires a coded report type and rejects non-result or non-document graph children', () => {
  const base = {
    entryId: FIXTURE.reportId,
    identifier: 'urn:uuid:diagnostic-report-1',
    status: DiagnosticReportStatuses.Preliminary,
    subjectReference: FIXTURE.subject,
    issuedAt: FIXTURE.issuedAt,
    reportCode: FIXTURE.reportCode,
  }
  assert.throws(() => buildDiagnosticReportFlatGraph({
    ...base,
    reportCode: { ...FIXTURE.reportCode, code: '' },
  }), /diagnostic_report_code_required/)
  assert.throws(() => buildDiagnosticReportFlatGraph({
    ...base,
    results: [buildDocumentReferenceFlatEntry({
      entryId: FIXTURE.attachmentId,
      identifier: 'urn:uuid:attachment-1',
      contentType: 'application/pdf',
      contentHash: 'sha3-384:fixture',
    })],
  }), /diagnostic_report_result_invalid/)
})
