/**
 * Candidate SNOMED CT C80 to LOINC specialty map supplied for review.
 *
 * This is not an official SNOMED or LOINC map. The declared relationship is
 * preserved so consumers can automate only strict equivalence and present
 * wider, related, inexact or unmatched rows for professional governance.
 */
export const ClinicalSpecialtyMappingEquivalence = Object.freeze({
  Equivalent: 'equivalent',
  Wider: 'wider',
  RelatedTo: 'relatedto',
  Inexact: 'inexact',
  Unmatched: 'unmatched',
} as const)

export type ClinicalSpecialtyMappingEquivalenceCode =
  typeof ClinicalSpecialtyMappingEquivalence[keyof typeof ClinicalSpecialtyMappingEquivalence]

export type ClinicalSpecialtyMapping = Readonly<{
  snomedSystem: 'http://snomed.info/sct'
  snomedCode: string
  snomedDisplay: string
  loincSystem?: 'http://loinc.org'
  loincCode?: string
  loincDisplay?: string
  equivalence: ClinicalSpecialtyMappingEquivalenceCode
  automatic: boolean
}>

const E = ClinicalSpecialtyMappingEquivalence.Equivalent
const W = ClinicalSpecialtyMappingEquivalence.Wider
const R = ClinicalSpecialtyMappingEquivalence.RelatedTo
const I = ClinicalSpecialtyMappingEquivalence.Inexact
const U = ClinicalSpecialtyMappingEquivalence.Unmatched

type MappingRow = readonly [string, string, string?, string?, ClinicalSpecialtyMappingEquivalenceCode?]

const suppliedRows: readonly MappingRow[] = Object.freeze([
  ['408467006', 'Adult mental illness', 'LP172958-3', 'Mental health', W],
  ['394577000', 'Anesthetics', 'LP172918-7', 'Anesthesiology', E],
  ['394578005', 'Audiological medicine', 'LP172919-5', 'Audiology', I],
  ['421661004', 'Blood banking and transfusion medicine', 'LP172920-3', 'Blood banking and transfusion medicine', E],
  ['408462000', 'Burns care', 'LP268363-1', 'Burn management', I],
  ['394579002', 'Cardiology', 'LA7179-0', 'Medicine.cardiology', E],
  ['394804000', 'Clinical cytogenetics and molecular genetics', 'LP172929-4', 'Clinical genetics', W],
  ['394580004', 'Clinical genetics', 'LP172929-4', 'Clinical genetics', E],
  ['394803006', 'Clinical hematology', 'LP175685-9', 'Hematology', I],
  ['408480009', 'Clinical immunology', 'LP345043-6', 'Immunology', W],
  ['408454008', 'Clinical microbiology', 'LP208903-7', 'Pathology - Medical microbiology', I],
  ['394809005', 'Clinical neuro-physiology', 'LP172931-0', 'Clinical neurophysiology', E],
  ['394592004', 'Clinical oncology', 'LP172901-3', 'Oncology', I],
  ['394600006', 'Clinical pharmacology', 'LP220238-2', 'Clinical pharmacology', E],
  ['394601005', 'Clinical physiology', undefined, undefined, U],
  ['394581000', 'Community medicine', 'LP204156-6', 'Community health care', I],
  ['408478003', 'Critical care medicine', 'LP172933-6', 'Critical care medicine', E],
  ['394812008', 'Dental medicine specialties', 'LP172934-4', 'Dentistry', W],
  ['408444009', 'Dental-General dental practice', 'LP172934-4', 'Dentistry', W],
  ['394582007', 'Dermatology', 'LP172935-1', 'Dermatology', E],
  ['408475000', 'Diabetic medicine', 'LP172938-5', 'Diabetology', E],
  ['410005002', 'Dive medicine', 'LP173035-9', 'Undersea and hyperbaric medicine', I],
  ['394583002', 'Endocrinology', 'LP172941-9', 'Endocrinology', E],
  ['419772000', 'Family practice', 'LP172943-5', 'Family medicine', E],
  ['394584008', 'Gastroenterology', 'LP172945-0', 'Gastroenterology', E],
  ['408443003', 'General medical practice', 'LP173010-2', 'Primary care', I],
  ['394802001', 'General medicine', 'LP172946-8', 'General medicine', E],
  ['394915009', 'General pathology', 'LP172984-9', 'Pathology', I],
  ['394814009', 'General practice', 'LP173010-2', 'Primary care', I],
  ['394808002', 'Genito-urinary medicine', 'LP173036-7', 'Urology', W],
  ['394811001', 'Geriatric medicine', 'LP172947-6', 'Geriatric medicine', E],
  ['408446006', 'Gynecological oncology', 'LP202989-2', 'Gynecologic oncology', E],
  ['394586005', 'Gynecology', 'LP221284-5', 'Gynecology', E],
  ['394916005', 'Hematopathology', 'LP172984-9', 'Pathology', W],
  ['408472002', 'Hepatology', 'LP172950-0', 'Hepatology', E],
  ['394597005', 'Histopathology', 'LP208907-8', 'Anatomic pathology', W],
  ['394598000', 'Immunopathology', 'LP345043-6', 'Immunology', W],
  ['394807007', 'Infectious diseases', 'LP172951-8', 'Infectious disease', E],
  ['419192003', 'Internal medicine', 'LP172952-6', 'Internal medicine', E],
  ['408468001', 'Learning disability', undefined, undefined, U],
  ['394593009', 'Medical oncology', 'LP175686-7', 'Medical Oncology', E],
  ['394813003', 'Medical ophthalmology', 'LP172974-0', 'Ophthalmology', W],
  ['410001006', 'Military medicine', undefined, undefined, U],
  ['394589003', 'Nephrology', 'LP172962-5', 'Nephrology', E],
  ['394591006', 'Neurology', 'LP172964-1', 'Neurology', E],
  ['394599008', 'Neuropathology', 'LP208907-8', 'Anatomic pathology', W],
  ['394649004', 'Nuclear medicine', 'LP172968-2', 'Nuclear medicine', E],
  ['408470005', 'Obstetrics', 'LP221283-7', 'Obstetrics', E],
  ['394585009', 'Obstetrics and gynecology', 'LP172971-6', 'Obstetrics and gynecology', E],
  ['394821009', 'Occupational medicine', 'LP172972-4', 'Occupational medicine', E],
  ['422191005', 'Ophthalmic surgery', 'LP172974-0', 'Ophthalmology', W],
  ['394594003', 'Ophthalmology', 'LP172974-0', 'Ophthalmology', E],
  ['416304004', 'Osteopathic manipulative medicine', 'LP434767-2', 'Osteopathic medicine', I],
  ['418960008', 'Otolaryngology', 'LP172980-7', 'Otolaryngology', E],
  ['394882004', 'Pain management', 'LP172981-5', 'Pain medicine', I],
  ['394806003', 'Palliative medicine', 'LP172982-3', 'Palliative care', I],
  ['394588006', 'Pediatric (Child and adolescent) psychiatry', 'LP172922-9', 'Child and adolescent psychiatry', E],
  ['408459003', 'Pediatric cardiology', 'LP172985-6', 'Pediatric cardiology', E],
  ['394607009', 'Pediatric dentistry', 'LP172934-4', 'Dentistry', W],
  ['419610006', 'Pediatric endocrinology', 'LP172989-8', 'Pediatric endocrinology', E],
  ['418058008', 'Pediatric gastroenterology', 'LP172990-6', 'Pediatric gastroenterology', E],
  ['420208008', 'Pediatric genetics', 'LP172956-7', 'Medical genetics', W],
  ['418652005', 'Pediatric hematology', 'LP172991-4', 'Pediatric hematology-oncology', W],
  ['418535003', 'Pediatric immunology', 'LP345043-6', 'Immunology', W],
  ['418862001', 'Pediatric infectious diseases', 'LP172992-2', 'Pediatric infectious diseases', E],
  ['419365004', 'Pediatric nephrology', 'LP172993-0', 'Pediatric nephrology', E],
  ['418002000', 'Pediatric oncology', 'LP172991-4', 'Pediatric hematology-oncology', I],
  ['419983000', 'Pediatric ophthalmology', 'LP172974-0', 'Ophthalmology', W],
  ['419170002', 'Pediatric pulmonology', 'LP172995-5', 'Pediatric pulmonology', E],
  ['419472004', 'Pediatric rheumatology', 'LP172998-9', 'Pediatric rheumatology', E],
  ['394539006', 'Pediatric surgery', 'LP172999-7', 'Pediatric surgery', E],
  ['420112009', 'Pediatric surgery-bone marrow transplantation', 'LP417851-5', 'Bone Marrow Transplant', I],
  ['409968004', 'Preventive medicine', 'LP173009-4', 'Preventive medicine', E],
  ['394587001', 'Psychiatry', 'LP173011-0', 'Psychiatry', E],
  ['394913002', 'Psychotherapy', 'LP173012-8', 'Psychology', R],
  ['408440000', 'Public health medicine', 'LP173014-4', 'Public health', I],
  ['418112009', 'Pulmonary medicine', 'LP173015-1', 'Pulmonary disease', I],
  ['419815003', 'Radiation oncology', 'LP173016-9', 'Radiation oncology', E],
  ['394914008', 'Radiology', 'LP173018-5', 'Radiology', E],
  ['408455009', 'Radiology-Interventional radiology', 'LP172896-5', 'Interventional radiology', E],
  ['394602003', 'Rehabilitation', 'LP173004-5', 'Physical medicine and rehabilitation', I],
  ['408447002', 'Respite care', 'LP173240-5', 'Respite', R],
  ['394810000', 'Rheumatology', 'LP173023-5', 'Rheumatology', E],
  ['408450004', 'Sleep studies', 'LP248728-0', 'Sleep medicine', I],
  ['408476004', 'Surgery-Bone and marrow transplantation', 'LP417851-5', 'Bone Marrow Transplant', I],
  ['408469009', 'Surgery-Breast surgery', 'LA7201-2', 'Surgery.breast', E],
  ['408466002', 'Surgery-Cardiac surgery', 'LP207300-7', 'Cardiac surgery', E],
  ['408471009', 'Surgery-Cardiothoracic transplantation', 'LP173033-4', 'Transplant surgery', W],
  ['408464004', 'Surgery-Colorectal surgery', 'LP172932-8', 'Colon and rectal surgery', E],
  ['408441001', 'Surgery-Dental-Endodontics', 'LP172934-4', 'Dentistry', W],
  ['408465003', 'Surgery-Dental-Oral and maxillofacial surgery', 'LP172902-1', 'Oral and maxillofacial surgery', E],
  ['394605001', 'Surgery-Dental-Oral surgery', 'LP172902-1', 'Oral and maxillofacial surgery', I],
  ['394608004', 'Surgery-Dental-Orthodontics / Dentistry-surgical-Orthodontics', 'LP172934-4', 'Dentistry', W],
  ['408461007', 'Surgery-Dental-Periodontal surgery', 'LP172934-4', 'Dentistry', W],
  ['408460008', 'Prosthodontics / surgical-Prosthodontics', 'LP172934-4', 'Dentistry', W],
  ['394606000', 'Surgery-Dentistry-Restorative dentistry', 'LP172934-4', 'Dentistry', W],
  ['408449004', 'Surgery-Dentistry--surgical', 'LP172934-4', 'Dentistry', W],
  ['418018006', 'Surgery-Dermatologic surgery', 'LP172935-1', 'Dermatology', W],
  ['394604002', 'Surgery-Ear, nose and throat surgery', 'LP172980-7', 'Otolaryngology', I],
  ['394609007', 'Surgery-general', 'LA7205-3', 'Surgery.general', E],
  ['408474001', 'Surgery-Hepatobiliary and pancreatic surgery', 'LP172950-0', 'Hepatology', W],
  ['394610002', 'Surgery-Neurosurgery', 'LP172963-3', 'Neurological surgery', E],
  ['394611003', 'Surgery-Plastic surgery', 'LP173006-0', 'Plastic surgery', E],
  ['408477008', 'Surgery-Transplantation surgery', 'LP173033-4', 'Transplant surgery', E],
  ['394801008', 'Surgery-Trauma and orthopedics', 'LP434806-8', 'Orthopaedic surgery', I],
  ['408463005', 'Surgery-Vascular', 'LP173039-1', 'Vascular surgery', E],
  ['419321007', 'Surgical oncology', 'LP207940-0', 'Surgical oncology', E],
  ['394576009', 'Surgical-Accident & emergency', 'LP172940-1', 'Emergency medicine', I],
  ['394590007', 'Thoracic medicine', 'LP173031-8', 'Thoracic and cardiac surgery', R],
  ['409967009', 'Toxicology', 'LP172957-5', 'Medical toxicology', I],
  ['408448007', 'Tropical medicine', undefined, undefined, U],
  ['419043006', 'Urological oncology', 'LP173036-7', 'Urology', W],
  ['394612005', 'Urology', 'LP173036-7', 'Urology', E],
  ['394733009', 'Medical specialty--OTHER--NOT LISTED', 'LA46-8', 'Other', I],
  ['394732004', 'Surgical specialty--OTHER-NOT LISTED', 'LA46-8', 'Other', I],
])

export const SnomedC80ToLoincSpecialtyConceptMap: readonly ClinicalSpecialtyMapping[] = Object.freeze(
  suppliedRows.map(([snomedCode, snomedDisplay, loincCode, loincDisplay, equivalence = U]) => Object.freeze({
    snomedSystem: 'http://snomed.info/sct' as const,
    snomedCode,
    snomedDisplay,
    ...(loincCode ? { loincSystem: 'http://loinc.org' as const, loincCode, loincDisplay } : {}),
    equivalence,
    automatic: equivalence === E,
  })),
)

/** Returns a portable LOINC specialty only for a strict reviewed equivalence. */
export function findAutomaticLoincSpecialty(snomedCode: string): Readonly<{
  system: 'http://loinc.org'
  code: string
  display: string
}> | undefined {
  const mapping = SnomedC80ToLoincSpecialtyConceptMap.find(item => item.snomedCode === snomedCode)
  if (!mapping?.automatic || !mapping.loincCode || !mapping.loincDisplay) return undefined
  return Object.freeze({ system: 'http://loinc.org', code: mapping.loincCode, display: mapping.loincDisplay })
}
