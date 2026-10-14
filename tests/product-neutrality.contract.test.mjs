// Flow contract: the FHIR foundation defines standards-based contracts without naming downstream products, gateways, portals, SDKs, or data packages that consume it.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

const productNames = [
  ['SOS', 'Chain'].join(''),
  ['Vet', 'Chain'].join(''),
  ['Pet', 'Chain'].join(''),
  ['U', 'H', 'C'].join(''),
]
const packagePrefixes = ['s' + 'os', 'v' + 'et', 'u' + 'hc']
const DOWNSTREAM_PRODUCT_LANGUAGE = new RegExp(
  `\\b(?:${productNames.join('|')})\\b|\\b(?:${packagePrefixes.join('|')})-(?:data|sdk|gw|portal)[a-z0-9-]*\\b`,
  'iu',
)

const trackedFiles = execFileSync('git', ['ls-files'], {
  encoding: 'utf8',
})
  .trim()
  .split('\n')
  .filter(
    (path) =>
      path &&
      existsSync(path) &&
      /(?:^|\/)(?:[^/]+\.(?:md|ts|mts|js|mjs)|README|SYNC)$/u.test(path),
  )

test('does not cite downstream consumers in maintained FHIR foundation files', () => {
  for (const path of trackedFiles) {
    assert.doesNotMatch(path, DOWNSTREAM_PRODUCT_LANGUAGE, path)
    assert.doesNotMatch(readFileSync(path, 'utf8'), DOWNSTREAM_PRODUCT_LANGUAGE, path)
  }
})
