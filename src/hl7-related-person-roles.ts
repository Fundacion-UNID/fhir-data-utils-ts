/** HL7 functional coding descriptors; a coding never establishes legal evidence or access authority. */
export const HL7_CODING_SYSTEM_V3_ROLE_CODE='http://terminology.hl7.org/CodeSystem/v3-RoleCode' as const
export const HL7_CODING_SYSTEM_V3_ROLE_CLASS='http://terminology.hl7.org/CodeSystem/v3-RoleClass' as const
export type Hl7RelatedPersonFunctionalRoleEntry=Readonly<{
  code:string
  display:string
  definition:string
  codingSystem:typeof HL7_CODING_SYSTEM_V3_ROLE_CODE|typeof HL7_CODING_SYSTEM_V3_ROLE_CLASS
}>

/** Curated functional tags from the HL7 RoleCode and RoleClass code systems. */
export const HL7_RELATED_PERSON_FUNCTIONAL_ROLES:readonly Hl7RelatedPersonFunctionalRoleEntry[]=Object.freeze([
  Object.freeze({code:'RESPRSN',display:'Responsible party',definition:'A party with legal responsibility for another party.',codingSystem:HL7_CODING_SYSTEM_V3_ROLE_CODE}),
  Object.freeze({code:'CAREGIVER',display:'Caregiver',definition:'A person providing primary care at home.',codingSystem:HL7_CODING_SYSTEM_V3_ROLE_CLASS}),
  Object.freeze({code:'ECON',display:'Emergency contact',definition:'A contact for use in an emergency.',codingSystem:HL7_CODING_SYSTEM_V3_ROLE_CLASS}),
  Object.freeze({code:'DEPEN',display:'Dependent',definition:'A person covered through association with a subscriber.',codingSystem:HL7_CODING_SYSTEM_V3_ROLE_CLASS}),
  Object.freeze({code:'BILL',display:'Billing contact',definition:'A contact for billing in a provider context.',codingSystem:HL7_CODING_SYSTEM_V3_ROLE_CODE}),
  Object.freeze({code:'POWATT',display:'Power of attorney',definition:'A person authorized to act legally on behalf of another.',codingSystem:HL7_CODING_SYSTEM_V3_ROLE_CODE}),
])

/** HL7 v3 ActReason codes used in healthcare Consent projections. */
export const HealthcareConsentPurposes=Object.freeze({
  Treatment:'TREAT',EmergencyTreatment:'ETREAT',Research:'HRESCH',CareManagement:'CAREMGT',
  Operations:'HOPERAT',PatientAdministration:'PATADMIN',RecordsManagement:'RECORDMGT',
} as const)
