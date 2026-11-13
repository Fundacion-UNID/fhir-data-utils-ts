import {FhirCodeSystems} from './constants/fhir-code-systems.js'

function category<const Code extends string>(code:Code){
  const system=FhirCodeSystems.CommunicationCategory
  const attributeValue=`${system}|${code}` as const
  return Object.freeze({system,code,attributeValue,/** @deprecated Use attributeValue. */claim:attributeValue})
}
/** FHIR R4 Communication category vocabulary; a category conveys no authority. */
export const CommunicationCategoryCodes=Object.freeze({
  Alert:category('alert'),Notification:category('notification'),
  Reminder:category('reminder'),Instruction:category('instruction'),
})
