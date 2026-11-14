// Flow contract: consumers exchange a typed native Communication projection without importing transport, storage, identity or authorization contracts.
import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

test('compiles the public native Communication types with positive and negative consumer examples', () => {
  const root = fileURLToPath(new URL('../', import.meta.url))
  const result = execFileSync(process.execPath, [
    fileURLToPath(new URL('../node_modules/typescript/bin/tsc', import.meta.url)),
    '--noEmit', '--strict', '--skipLibCheck', '--module', 'NodeNext',
    fileURLToPath(new URL('./fixtures/native-communication-consumer.ts', import.meta.url)),
  ], { cwd: root, encoding: 'utf8' })
  assert.equal(result, '')
})
