import { DiagnosticReportParameters } from '../params/index.js';
import { ReferenceSearchParameter, TokenSearchParameter, DateSearchParameter } from '../params/Search.params.model.js';

// DiagnosticReport Resource Interface
export interface DiagnosticReportTemplateFHIR {
  [DiagnosticReportParameters.BasedOn]?: ReferenceSearchParameter;
  [DiagnosticReportParameters.Category]?: TokenSearchParameter;
  [DiagnosticReportParameters.Code]?: TokenSearchParameter;
  [DiagnosticReportParameters.Date]?: DateSearchParameter;
  [DiagnosticReportParameters.Encounter]?: ReferenceSearchParameter;
  [DiagnosticReportParameters.Identifier]?: TokenSearchParameter;
  [DiagnosticReportParameters.ImagingStudy]?: ReferenceSearchParameter;
  [DiagnosticReportParameters.Patient]?: ReferenceSearchParameter;
  [DiagnosticReportParameters.Performer]?: ReferenceSearchParameter;
  [DiagnosticReportParameters.Result]?: ReferenceSearchParameter;
  [DiagnosticReportParameters.Status]?: TokenSearchParameter;
}
  
