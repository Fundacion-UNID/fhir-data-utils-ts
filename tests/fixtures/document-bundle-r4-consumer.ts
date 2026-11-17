// Flow contract: explicit R4 structural inspection accepts untrusted parsed input and returns readonly display-only results, not validated clinical identity.
import {validateR4DocumentBundleStructure,type FhirBundle} from 'fhir-data-utils-ts'
import {getR4DocumentBundlePatientFullName,type R4DocumentBundleStructureResult} from 'fhir-data-utils-ts/document-bundle-r4'
const input:FhirBundle={resourceType:'Bundle',type:'document',entry:[{resource:{resourceType:'Composition'}}]}
const result:R4DocumentBundleStructureResult=validateR4DocumentBundleStructure(input)
const display:string|undefined=getR4DocumentBundlePatientFullName(input)
// @ts-expect-error A missing display name cannot be assumed to be present.
const assumed:string=getR4DocumentBundlePatientFullName(undefined)
// @ts-expect-error Structure issues are readonly.
result.issues.push('Changed')
// @ts-expect-error Inspection does not expose identity authority.
const authority:boolean=result.verifiedIdentity
void [display,assumed,authority]
