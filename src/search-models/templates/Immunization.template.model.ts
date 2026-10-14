import { ImmunizationParameters } from '../params/index.js';
import { MedicationParameters } from '../params/Medication.params.model.js';
import { DateSearchParameter, TokenSearchParameter, ReferenceSearchParameter, StringSearchParameter } from '../params/Search.params.model.js';

// Immunization Resource Interface
export interface ImmunizationTemplateFHIR {
  [ImmunizationParameters.Date]?: DateSearchParameter;
  [ImmunizationParameters.Identifier]?: TokenSearchParameter;
  [ImmunizationParameters.Location]?: ReferenceSearchParameter;
  [ImmunizationParameters.LotNumber]?: StringSearchParameter;
  [ImmunizationParameters.Manufacturer]?: ReferenceSearchParameter;
  [ImmunizationParameters.Patient]?: ReferenceSearchParameter;
  [ImmunizationParameters.Performer]?: ReferenceSearchParameter;
  [ImmunizationParameters.Reaction]?: ReferenceSearchParameter;
  [ImmunizationParameters.Status]?: TokenSearchParameter;
  [ImmunizationParameters.VaccineCode]?: TokenSearchParameter;
  [ImmunizationParameters.ManufacturerDisplay]?: ReferenceSearchParameter;
  [ImmunizationParameters.TargetDisease]?: TokenSearchParameter;
  [MedicationParameters.Code]?: TokenSearchParameter;
}
