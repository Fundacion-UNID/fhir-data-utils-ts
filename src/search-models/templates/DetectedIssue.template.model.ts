import { DetectedIssueParameters } from '../params/index.js';
import { ReferenceSearchParameter, TokenSearchParameter, DateSearchParameter } from '../params/Search.params.model.js';

 // DetectedIssue Resource Interface
export interface DetectedIssueTemplateFHIR {
  [DetectedIssueParameters.Author]?: ReferenceSearchParameter;
  [DetectedIssueParameters.Code]?: TokenSearchParameter;
  [DetectedIssueParameters.Identified]?: DateSearchParameter;
  [DetectedIssueParameters.Identifier]?: TokenSearchParameter;
  [DetectedIssueParameters.Implicated]?: ReferenceSearchParameter;
  [DetectedIssueParameters.Patient]?: ReferenceSearchParameter;
  [DetectedIssueParameters.Status]?: TokenSearchParameter;
}
