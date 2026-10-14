import { SpecimenParameters } from '../params/index.js';
import { TokenSearchParameter, DateSearchParameter, ReferenceSearchParameter } from '../params/Search.params.model.js';

// Specimen Resource Interface
export interface SpecimenTemplateFHIR {
  [SpecimenParameters.AccessionIdentifier]?: TokenSearchParameter;
  [SpecimenParameters.CollectionDate]?: DateSearchParameter;
  [SpecimenParameters.ContainerIdentifier]?: TokenSearchParameter;
  [SpecimenParameters.Identifier]?: TokenSearchParameter;
  [SpecimenParameters.Parent]?: ReferenceSearchParameter;
  [SpecimenParameters.Patient]?: ReferenceSearchParameter;
  [SpecimenParameters.Status]?: TokenSearchParameter;
  [SpecimenParameters.Type]?: TokenSearchParameter;
}
  