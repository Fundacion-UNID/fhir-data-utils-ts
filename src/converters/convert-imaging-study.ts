import { ImagingStudyClaim } from '../claims/imaging-study-claims.js';
import type { FhirResource, FlatClaims } from './convert-shared.js';
import { codingFromValue, codingToValue, referenceListToCsv, referenceToValue } from './convert-shared.js';

function csv(values: unknown): string | undefined {
  if (!Array.isArray(values)) return undefined;
  const normalized = values.map((value) => String(value || '').trim()).filter(Boolean);
  return normalized.length ? normalized.join(',') : undefined;
}

function codingCsv(values: unknown): string | undefined {
  if (!Array.isArray(values)) return undefined;
  return csv(values.map((value) => codingToValue(value as { system?: string; code?: string })));
}

function codingList(value: unknown): Array<{ system?: string; code?: string }> | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const codings = value.split(',').flatMap((token) => codingFromValue(token.trim()) || []);
  return codings.length ? codings : undefined;
}

/** Projects searchable ImagingStudy metadata; DICOM bytes remain in protected imaging storage. */
export function imagingStudyFlatToFhirR4(claims: FlatClaims): FhirResource {
  const subject = claims[ImagingStudyClaim.Subject] ?? claims[ImagingStudyClaim.Patient];
  return {
    resourceType: 'ImagingStudy',
    identifier: claims[ImagingStudyClaim.Identifier] ? [{ value: claims[ImagingStudyClaim.Identifier] }] : undefined,
    status: claims[ImagingStudyClaim.Status],
    modality: codingList(claims[ImagingStudyClaim.Modality]),
    subject: subject ? { reference: subject } : undefined,
    encounter: claims[ImagingStudyClaim.Encounter] ? { reference: claims[ImagingStudyClaim.Encounter] } : undefined,
    started: claims[ImagingStudyClaim.Started],
    basedOn: references(claims[ImagingStudyClaim.BasedOn]),
    referrer: claims[ImagingStudyClaim.Referrer] ? { reference: claims[ImagingStudyClaim.Referrer] } : undefined,
    interpreter: references(claims[ImagingStudyClaim.Interpreter]),
    endpoint: references(claims[ImagingStudyClaim.Endpoint]),
    procedureReference: claims[ImagingStudyClaim.ProcedureReference] ? { reference: claims[ImagingStudyClaim.ProcedureReference] } : undefined,
    procedureCode: claims[ImagingStudyClaim.ProcedureCode] ? [{ coding: codingFromValue(claims[ImagingStudyClaim.ProcedureCode]) }] : undefined,
    reasonCode: claims[ImagingStudyClaim.ReasonCode] ? [{ coding: codingFromValue(claims[ImagingStudyClaim.ReasonCode]) }] : undefined,
    reasonReference: references(claims[ImagingStudyClaim.ReasonReference]),
    location: claims[ImagingStudyClaim.Location] ? { reference: claims[ImagingStudyClaim.Location] } : undefined,
    numberOfSeries: numberValue(claims[ImagingStudyClaim.NumberOfSeries]),
    numberOfInstances: numberValue(claims[ImagingStudyClaim.NumberOfInstances]),
    description: claims[ImagingStudyClaim.Description],
  };
}

export function imagingStudyFhirR4ToFlat(resource: FhirResource): FlatClaims {
  return {
    [ImagingStudyClaim.Identifier]: (resource.identifier as Array<{ value?: string }> | undefined)?.[0]?.value,
    [ImagingStudyClaim.Status]: resource.status as string | undefined,
    [ImagingStudyClaim.Modality]: codingCsv(resource.modality),
    [ImagingStudyClaim.Subject]: referenceToValue(resource.subject as { reference?: string } | undefined),
    [ImagingStudyClaim.Patient]: referenceToValue(resource.subject as { reference?: string } | undefined),
    [ImagingStudyClaim.Encounter]: referenceToValue(resource.encounter as { reference?: string } | undefined),
    [ImagingStudyClaim.Started]: resource.started as string | undefined,
    [ImagingStudyClaim.BasedOn]: referenceListToCsv(resource.basedOn as Array<{ reference?: string }> | undefined),
    [ImagingStudyClaim.Referrer]: referenceToValue(resource.referrer as { reference?: string } | undefined),
    [ImagingStudyClaim.Interpreter]: referenceListToCsv(resource.interpreter as Array<{ reference?: string }> | undefined),
    [ImagingStudyClaim.Endpoint]: referenceListToCsv(resource.endpoint as Array<{ reference?: string }> | undefined),
    [ImagingStudyClaim.ProcedureReference]: referenceToValue(resource.procedureReference as { reference?: string } | undefined),
    [ImagingStudyClaim.ProcedureCode]: codingToValue((resource.procedureCode as Array<{ coding?: Array<{ system?: string; code?: string }> }> | undefined)?.[0]?.coding?.[0]),
    [ImagingStudyClaim.ReasonCode]: codingToValue((resource.reasonCode as Array<{ coding?: Array<{ system?: string; code?: string }> }> | undefined)?.[0]?.coding?.[0]),
    [ImagingStudyClaim.ReasonReference]: referenceListToCsv(resource.reasonReference as Array<{ reference?: string }> | undefined),
    [ImagingStudyClaim.Location]: referenceToValue(resource.location as { reference?: string } | undefined),
    [ImagingStudyClaim.NumberOfSeries]: scalarNumber(resource.numberOfSeries),
    [ImagingStudyClaim.NumberOfInstances]: scalarNumber(resource.numberOfInstances),
    [ImagingStudyClaim.Description]: resource.description as string | undefined,
  };
}

function references(value: unknown): Array<{ reference: string }> | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const output = value.split(',').map((reference) => reference.trim()).filter(Boolean).map((reference) => ({ reference }));
  return output.length ? output : undefined;
}

function scalarNumber(value: unknown): string | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : undefined;
}

function numberValue(value: unknown): number | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}
