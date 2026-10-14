// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import assert from 'node:assert/strict'
import test from 'node:test'
import * as fhir from '../dist/index.js'

const STUDY = Object.freeze({
  resourceType: fhir.ResourceTypesFhirR5.ResearchStudy,
  id: 'study-1',
  identifier: [{ system: 'urn:ietf:rfc:3986', value: 'urn:uuid:study-1' }],
  name: 'stable-study-name',
  title: 'Study title',
  status: 'active',
  period: { start: '2026-09-21', end: '2027-09-21' },
  condition: [{ coding: [{ system: 'http://snomed.info/sct', code: '64572001' }] }],
})

const PARTY = Object.freeze({
  name: 'Principal investigator',
  role: { coding: [{ system: fhir.ResearchStudyR5PartyRoleSystem, code: 'primary-investigator' }] },
  period: [{ start: '2026-09-21', end: '2027-09-21' }],
  party: { reference: 'PractitionerRole/member-1', type: 'PractitionerRole' },
})

test('ResearchStudy projects official R5 search claims and keeps parties in correlated rows', () => {
  const study = fhir.projectResearchStudyR5FlatClaimsResource(STUDY)
  assert.deepEqual(study.meta.claims[fhir.ResearchStudyClaim.Name], [STUDY.name])
  assert.deepEqual(study.meta.claims[fhir.ResearchStudyClaim.Date], [STUDY.period.start, STUDY.period.end])
  assert.deepEqual(study.meta.claims[fhir.ResearchStudyClaim.Condition], ['http://snomed.info/sct|64572001'])

  const parties = fhir.projectResearchStudyAssociatedPartyFlatClaimResources({
    researchStudyId: STUDY.id,
    associatedParties: [PARTY],
  })
  assert.equal(parties.length, 1)
  assert.deepEqual(parties[0].meta.claims[fhir.ResearchStudyClaim.Party], [PARTY.party.reference])
  assert.deepEqual(parties[0].meta.claims[fhir.ResearchStudyClaim.PartyRole], [
    `${fhir.ResearchStudyR5PartyRoleSystem}|primary-investigator`,
  ])
})

test('ResearchStudy rejects mixed persistence rows, malformed parties and invented claims', () => {
  assert.throws(
    () => fhir.projectResearchStudyR5FlatClaimsResource({ ...STUDY, associatedParty: [PARTY] }),
    /parties_require_separate_resources/,
  )
  assert.throws(
    () => fhir.normalizeResearchStudyAssociatedParties([{ ...PARTY, party: { reference: 'Patient/not-a-professional' } }]),
    /party_reference_invalid/,
  )
  assert.throws(
    () => fhir.normalizeResearchStudyR5FlatClaimsResource({
      resourceType: fhir.ResourceTypesFhirR5.ResearchStudy,
      id: STUDY.id,
      meta: { claims: { 'ResearchStudy.authorization': ['permit'] } },
    }),
    /research_study_flat_claim_invalid/,
  )
})

test('Group projects official R5 search claims and separates each PractitionerRole member row', () => {
  const group = {
    resourceType: fhir.ResourceTypesFhirR5.Group,
    id: 'group-1',
    type: 'practitioner',
    membership: 'enumerated',
    name: 'Study team',
    member: [
      { entity: { reference: 'PractitionerRole/member-1', type: 'PractitionerRole' } },
      { entity: { reference: 'PractitionerRole/member-2', type: 'PractitionerRole' }, inactive: true },
    ],
  }
  const normalized = fhir.normalizeGroupR5ResearchTeam(group)
  assert.equal(normalized.member.length, 2)
  const rows = fhir.projectGroupPractitionerRoleMemberFlatClaimResources({ groupId: group.id, members: group.member })
  assert.equal(rows.length, 2)
  assert.deepEqual(rows[0].meta.claims[fhir.GroupClaim.Member], ['PractitionerRole/member-1'])
  assert.deepEqual(rows[1].meta.claims[fhir.GroupClaim.Member], ['PractitionerRole/member-2'])
})

test('Group rejects embedded members in the parent row and authorization-shaped properties', () => {
  assert.throws(
    () => fhir.projectGroupR5FlatClaimsResource({
      resourceType: fhir.ResourceTypesFhirR5.Group,
      id: 'group-1',
      type: 'practitioner',
      membership: 'enumerated',
      member: [{ entity: { reference: 'PractitionerRole/member-1' } }],
    }),
    /members_require_separate_resources/,
  )
  assert.throws(
    () => fhir.normalizeGroupR5ResearchTeam({
      resourceType: fhir.ResourceTypesFhirR5.Group,
      type: 'practitioner',
      membership: 'enumerated',
      member: [],
      permission: 'permit',
    }),
    /group_authorization_property_forbidden/,
  )
  assert.throws(
    () => fhir.normalizeGroupPractitionerRoleMembers([{ entity: { reference: 'Practitioner/member-1' } }]),
    /practitioner_role_reference_invalid/,
  )
})
