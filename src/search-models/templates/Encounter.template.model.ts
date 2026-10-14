import { EncounterParameters } from '../params/index.js';
import { ReferenceSearchParameter, TokenSearchParameter } from '../params/Search.params.model.js';

// Encounter Resource Interface
export interface EncounterTemplateFHIR {
  [EncounterParameters.Appointment]?: ReferenceSearchParameter;
  [EncounterParameters.Class]?: TokenSearchParameter;
  [EncounterParameters.Diagnosis]?: ReferenceSearchParameter;
  [EncounterParameters.EpisodeOfCare]?: ReferenceSearchParameter;
  [EncounterParameters.Identifier]?: TokenSearchParameter;
  [EncounterParameters.Location]?: ReferenceSearchParameter;
  [EncounterParameters.Participant]?: ReferenceSearchParameter;
  [EncounterParameters.Patient]?: ReferenceSearchParameter;
  [EncounterParameters.ReasonCode]?: TokenSearchParameter;
  [EncounterParameters.ReasonReference]?: ReferenceSearchParameter;
  [EncounterParameters.ServiceProvider]?: ReferenceSearchParameter;
  [EncounterParameters.Status]?: TokenSearchParameter;
  [EncounterParameters.Type]?: TokenSearchParameter;
}
 