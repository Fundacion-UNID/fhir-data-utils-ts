// Copyright 2026 Connecting Solution & Applications Ltd under the Apache License, Version 2.0.
// Flow contract: a human-health UI consumes the reviewed LOINC subject-matter-domain catalogue as stable codes, keeps labels separate, and never presents this document ontology as a veterinary service-type coding system.
import assert from 'node:assert/strict'
import test from 'node:test'

import { LoincSubjectMatterDomain, LoincSubjectMatterDomainSystem } from '../dist/data/index.js'

test('exports the deduplicated LOINC subject matter domain catalogue supplied for human-health service classification', () => {
  assert.equal(LoincSubjectMatterDomainSystem, 'http://loinc.org')
  assert.ok(LoincSubjectMatterDomain.length > 150)
  assert.equal(new Set(LoincSubjectMatterDomain.map(item => item.code)).size, LoincSubjectMatterDomain.length)
  assert.deepEqual(
    LoincSubjectMatterDomain.find(item => item.code === 'LP172940-1'),
    { system: 'http://loinc.org', code: 'LP172940-1', display: 'Emergency medicine' },
  )
  assert.deepEqual(
    LoincSubjectMatterDomain.find(item => item.code === 'LP173021-9'),
    { system: 'http://loinc.org', code: 'LP173021-9', display: 'Research' },
  )
  assert.equal(LoincSubjectMatterDomain.some(item => item.display === 'Veterinary medicine'), false)
})
