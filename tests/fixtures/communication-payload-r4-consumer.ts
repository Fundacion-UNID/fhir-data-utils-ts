// Flow contract: callers author exclusive R4 payload choices through the public FHIR surface; R5 coded content and wrong primitive types remain rejected by TypeScript.
import {CommunicationClaim,communicationPayloadItemFlatToFhirR4,communicationPayloadItemFhirR4ToFlat,communicationPayloadProfileFlatToFhirR4,type FhirR4CommunicationPayloadItem} from 'fhir-data-utils-ts'
import {communicationPayloadProfileFhirR4ToFlat} from 'fhir-data-utils-ts/converters'
const body:FhirR4CommunicationPayloadItem={contentString:'Synthetic message'}
const reference:FhirR4CommunicationPayloadItem={contentReference:{reference:'Bundle/synthetic-message'}}
const claims=communicationPayloadItemFhirR4ToFlat(body)
const text:string|undefined=claims[CommunicationClaim.ContentString]
const item=communicationPayloadItemFlatToFhirR4(claims)
const parts=communicationPayloadProfileFlatToFhirR4(communicationPayloadProfileFhirR4ToFlat([body,reference]))
// @ts-expect-error A single R4 item cannot carry two content choices.
const conflicting:FhirR4CommunicationPayloadItem={contentString:'Synthetic message',contentReference:{reference:'Patient/synthetic'}}
// @ts-expect-error R5 coded payloads are not an R4 choice.
const wrongVersion:FhirR4CommunicationPayloadItem={contentCodeableConcept:{text:'Synthetic message'}}
// @ts-expect-error Native string content is a string, not a number.
const wrongPrimitive:FhirR4CommunicationPayloadItem={contentString:42}
// @ts-expect-error Flat payload values cannot be numeric.
communicationPayloadItemFlatToFhirR4({[CommunicationClaim.ContentString]:42})
void [text,item,parts,conflicting,wrongVersion,wrongPrimitive]

// @ts-expect-error Projected arrays are readonly exchange values.
parts?.push(body)
// @ts-expect-error Imported flat claims are readonly values.
claims[CommunicationClaim.ContentString]='Changed'
