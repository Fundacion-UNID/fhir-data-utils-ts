// Copyright 2026 ConnectHealth.info (Connecting Solution & Applications Ltd.) under the Apache License, Version 2.0.

import { DiagnosticReportClaim } from '../claims/diagnostic-report-claims.js'
import { DiagnosticReportStatuses, type DiagnosticReportStatus } from '../constants/clinical-statuses.js'
import { ResourceTypesFhirR4 } from '../constants/fhir-resource-types.js'
import {
  buildFlatClaimResourceEntry,
  linkFlatClaimResourceEntries,
  type FlatClaimResourceEntry,
} from '../flat-claim-resource-graph.js'

export type DiagnosticReportCoding = Readonly<{
  system: string
  code: string
  display?: string
  text?: string
}>

export type DiagnosticReportFlatInput = Readonly<{
  entryId: string
  identifier: string
  status: DiagnosticReportStatus
  subjectReference: string
  issuedAt: string
  reportCode: DiagnosticReportCoding
  encounterReference?: string
  performerReferences?: readonly string[]
  results?: readonly FlatClaimResourceEntry[]
  attachments?: readonly FlatClaimResourceEntry[]
}>

const DIAGNOSTIC_REPORT_STATUSES = new Set<string>(Object.values(DiagnosticReportStatuses))

/**
 * Builds a claims-first DiagnosticReport graph for human, animal, or One Health
 * laboratory reports. `DiagnosticReport.code` identifies the report/panel;
 * atomic measurements remain independent `Observation` entries and PDF/JPEG/
 * PNG evidence remains independent `DocumentReference` entries.
 *
 * `preliminary` reports can be exchanged and reviewed, but downstream ledger
 * and secondary-use policy decides whether only `final` is eligible for those
 * projections. This builder does not confer authority or consent.
 */
export function buildDiagnosticReportFlatGraph(
  input: DiagnosticReportFlatInput,
): readonly FlatClaimResourceEntry[] {
  const status = required(input.status, 'diagnostic_report_status_required')
  if (!DIAGNOSTIC_REPORT_STATUSES.has(status)) throw new TypeError('diagnostic_report_status_invalid')
  const claims: Record<string, string> = {
    [DiagnosticReportClaim.Identifier]: required(input.identifier, 'diagnostic_report_identifier_required'),
    [DiagnosticReportClaim.Status]: status,
    [DiagnosticReportClaim.Subject]: required(input.subjectReference, 'diagnostic_report_subject_required'),
    [DiagnosticReportClaim.Date]: isoDateTime(input.issuedAt, 'diagnostic_report_date_invalid'),
    [DiagnosticReportClaim.Code]: codingToken(input.reportCode),
  }
  if (input.reportCode.display?.trim()) claims[DiagnosticReportClaim.CodeDisplay] = input.reportCode.display.trim()
  if (input.reportCode.text?.trim()) claims[DiagnosticReportClaim.CodeText] = input.reportCode.text.trim()
  if (input.encounterReference?.trim()) {
    claims[DiagnosticReportClaim.Encounter] = required(input.encounterReference, 'diagnostic_report_encounter_invalid')
  }
  if (input.performerReferences?.length) {
    claims[DiagnosticReportClaim.Performer] = referenceList(input.performerReferences, 'diagnostic_report_performer_invalid')
  }

  const results = [...(input.results ?? [])]
  if (results.some(entry => entry.resourceType !== ResourceTypesFhirR4.Observation)) {
    throw new TypeError('diagnostic_report_result_invalid')
  }
  const attachments = [...(input.attachments ?? [])]
  if (attachments.some(entry => entry.resourceType !== ResourceTypesFhirR4.DocumentReference)) {
    throw new TypeError('diagnostic_report_attachment_invalid')
  }
  if (results.length) claims[DiagnosticReportClaim.Result] = results.map(entry => entry.reference).join(',')

  const report = buildFlatClaimResourceEntry({
    entryId: input.entryId,
    resourceType: ResourceTypesFhirR4.DiagnosticReport,
    claims,
  })
  const children = [...results, ...attachments]
  const graph = [report, ...children]
  return children.length
    ? linkFlatClaimResourceEntries(graph, {
        parentEntryId: report.entryId,
        childEntryIds: children.map(entry => entry.entryId),
      })
    : graph
}

function codingToken(value: DiagnosticReportCoding): string {
  const system = required(value.system, 'diagnostic_report_code_system_required')
  const code = required(value.code, 'diagnostic_report_code_required')
  if (system.includes('|') || code.includes('|') || system.includes(',') || code.includes(',')) {
    throw new TypeError('diagnostic_report_code_invalid')
  }
  return `${system}|${code}`
}

function referenceList(values: readonly string[], error: string): string {
  const normalized = [...new Set(values.map(value => required(value, error)))]
  if (normalized.some(value => value.includes(','))) throw new TypeError(error)
  return normalized.join(',')
}

function isoDateTime(value: string, error: string): string {
  const normalized = required(value, error)
  if (!/^\d{4}-\d{2}-\d{2}T/.test(normalized) || Number.isNaN(Date.parse(normalized))) throw new TypeError(error)
  return normalized
}

function required(value: unknown, error: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(error)
  return value.trim()
}
