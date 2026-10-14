import { ProcedureParameters } from '../params/index.js';
import { ReferenceSearchParameter, TokenSearchParameter, DateSearchParameter } from '../params/Search.params.model.js';

// Procedure Resource Interface
export interface ProcedureTemplateFHIR {
  [ProcedureParameters.BasedOn]?: ReferenceSearchParameter;
  [ProcedureParameters.Category]?: TokenSearchParameter;
  [ProcedureParameters.Code]?: TokenSearchParameter;
  [ProcedureParameters.Date]?: DateSearchParameter;
  [ProcedureParameters.Encounter]?: ReferenceSearchParameter;
  [ProcedureParameters.Identifier]?: TokenSearchParameter;
  [ProcedureParameters.Location]?: ReferenceSearchParameter;
  [ProcedureParameters.Patient]?: ReferenceSearchParameter;
  [ProcedureParameters.Performer]?: ReferenceSearchParameter;
  [ProcedureParameters.ReasonCode]?: TokenSearchParameter;
  [ProcedureParameters.ReasonReference]?: ReferenceSearchParameter;
  [ProcedureParameters.Subject]?: ReferenceSearchParameter;
  [ProcedureParameters.Status]?: TokenSearchParameter;
}
  