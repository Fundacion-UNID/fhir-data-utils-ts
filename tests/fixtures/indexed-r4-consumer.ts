// Flow contract: explicit indexed semantic, structural compatibility and document-support profiles never infer a native version, resource family or authority.
import {indexedR4ResourceToClaims,indexedR4ClaimsToResource,indexedStructuralResourceToClaims,documentSupportResourceToClaims} from 'fhir-data-utils-ts/indexed-r4'
const profile={profile:'indexed-r4-semantic'} as const
const claims=indexedR4ResourceToClaims({resourceType:'Observation'},profile)
const native=indexedR4ClaimsToResource('Observation',claims,profile)
indexedStructuralResourceToClaims({resourceType:'EncounterHistory'},{profile:'indexed-structural-compat-v1'})
documentSupportResourceToClaims({resourceType:'Patient'},{profile:'document-support-r4-v1'})
// @ts-expect-error Explicit semantic import has no structural fallback.
indexedR4ResourceToClaims({resourceType:'Medication'},profile)
// @ts-expect-error R5 is not this native semantic projection profile.
indexedR4ResourceToClaims({resourceType:'Observation'},{profile:'indexed-r5-semantic'})
// @ts-expect-error Version-specific namespaces are not the internal compatibility tag.
indexedR4ResourceToClaims({resourceType:'Observation'},{...profile,context:'org.hl7.fhir.r5'})
// @ts-expect-error Encounter has no admitted output projection in this caller profile.
indexedR4ClaimsToResource('Encounter',{},profile)
// @ts-expect-error Structural compatibility types do not expand to arbitrary native families.
indexedStructuralResourceToClaims({resourceType:'Goal'},{profile:'indexed-structural-compat-v1'})
// @ts-expect-error Document support is not all clinical/actor vocabularies.
documentSupportResourceToClaims({resourceType:'RelatedPerson'},{profile:'document-support-r4-v1'})
void native
