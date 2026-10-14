import type { ClaimSpec } from './claim-types.js';

/** Product-neutral flat claims for searchable FHIR R4 ImagingStudy metadata. */
export const ImagingStudyClaim = {
  Identifier: 'ImagingStudy.identifier',
  Status: 'ImagingStudy.status',
  Modality: 'ImagingStudy.modality',
  Subject: 'ImagingStudy.subject',
  Patient: 'ImagingStudy.patient',
  Encounter: 'ImagingStudy.encounter',
  Started: 'ImagingStudy.started',
  BasedOn: 'ImagingStudy.based-on',
  Referrer: 'ImagingStudy.referrer',
  Interpreter: 'ImagingStudy.interpreter',
  Endpoint: 'ImagingStudy.endpoint',
  ProcedureReference: 'ImagingStudy.procedure-reference',
  ProcedureCode: 'ImagingStudy.procedure-code',
  ReasonCode: 'ImagingStudy.reason-code',
  ReasonReference: 'ImagingStudy.reason-reference',
  Location: 'ImagingStudy.location',
  NumberOfSeries: 'ImagingStudy.number-of-series',
  NumberOfInstances: 'ImagingStudy.number-of-instances',
  Description: 'ImagingStudy.description',
} as const;

export type ImagingStudyClaimKey = typeof ImagingStudyClaim[keyof typeof ImagingStudyClaim];

export const ImagingStudyClaimSpecs: readonly ClaimSpec[] = Object.freeze([
  { key: ImagingStudyClaim.Identifier, meaning: 'Business or DICOM study identifier.', example: 'imaging-study-1' },
  { key: ImagingStudyClaim.Status, meaning: 'ImagingStudy lifecycle status.', example: 'available' },
  { key: ImagingStudyClaim.Modality, meaning: 'Repeatable DICOM modality token.', example: 'http://dicom.nema.org/resources/ontology/DCM|DX' },
  { key: ImagingStudyClaim.Subject, meaning: 'Canonical subject reference.', example: 'did:web:subject.example' },
  { key: ImagingStudyClaim.Patient, meaning: 'FHIR R4 patient search alias.', example: 'did:web:subject.example' },
  { key: ImagingStudyClaim.Encounter, meaning: 'Encounter context reference.', example: 'Encounter/encounter-1' },
  { key: ImagingStudyClaim.Started, meaning: 'Study start instant.', example: '2026-09-26T10:15:00Z' },
  { key: ImagingStudyClaim.BasedOn, meaning: 'Originating request references (CSV).', example: 'ServiceRequest/radiography-1' },
  { key: ImagingStudyClaim.Referrer, meaning: 'Referring practitioner reference.', example: 'PractitionerRole/veterinarian-1' },
  { key: ImagingStudyClaim.Interpreter, meaning: 'Interpreter references (CSV).', example: 'PractitionerRole/radiologist-1' },
  { key: ImagingStudyClaim.Endpoint, meaning: 'Protected imaging endpoint references (CSV).', example: 'Endpoint/dicomweb-1' },
  { key: ImagingStudyClaim.ProcedureReference, meaning: 'Performed procedure reference.', example: 'Procedure/radiography-1' },
  { key: ImagingStudyClaim.ProcedureCode, meaning: 'Performed procedure coding token.', example: 'http://snomed.info/sct|363680008' },
  { key: ImagingStudyClaim.ReasonCode, meaning: 'Study reason coding token.', example: 'http://snomed.info/sct|125605004' },
  { key: ImagingStudyClaim.ReasonReference, meaning: 'Study reason references (CSV).', example: 'Condition/fracture-1' },
  { key: ImagingStudyClaim.Location, meaning: 'Acquisition location reference.', example: 'Location/imaging-1' },
  { key: ImagingStudyClaim.NumberOfSeries, meaning: 'Declared series count.', example: '1' },
  { key: ImagingStudyClaim.NumberOfInstances, meaning: 'Declared instance count.', example: '2' },
  { key: ImagingStudyClaim.Description, meaning: 'Study description.', example: 'Left forelimb radiographs' },
]);
