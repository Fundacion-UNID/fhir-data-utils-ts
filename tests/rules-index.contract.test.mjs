// Flow contract: every repository rule is linked from one resolvable index and every Node gate delegates runtime authority to the approved Node.js 26 skill.
import assert from 'node:assert/strict'
import { access, readdir, readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function localMarkdownTargets(markdown) {
  return [...markdown.matchAll(/\[[^\]]+\]\(([^)]+)\)/gu)]
    .map(([, target]) => target)
    .filter((target) => !/^(?:https?:|mailto:|#)/u.test(target))
}

test('indexes every local skill through resolvable repository links', async () => {
  const agentsPath = resolve(repositoryRoot, 'AGENTS.md')
  const indexPath = resolve(repositoryRoot, 'docs/RULES_INDEX.md')
  const agents = await readFile(agentsPath, 'utf8')
  const index = await readFile(indexPath, 'utf8')
  const skillNames = (await readdir(resolve(repositoryRoot, '.codex/skills'), {
    withFileTypes: true,
  }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)

  assert.match(agents, /docs\/RULES_INDEX\.md/u)
  for (const skillName of skillNames) {
    assert.match(index, new RegExp(`\\.codex/skills/${skillName}/SKILL\\.md`, 'u'))
  }

  for (const [filePath, markdown] of [[agentsPath, agents], [indexPath, index]]) {
    for (const target of localMarkdownTargets(markdown)) {
      const pathOnly = target.split('#', 1)[0]
      if (pathOnly) await access(resolve(dirname(filePath), pathOnly))
    }
  }
})

test('delegates every executable Node gate to the canonical Node.js 26 runtime skill', async () => {
  const runtimeSkillPath = resolve(
    repositoryRoot,
    '.codex/skills/preserve-workspace-node-runtime/SKILL.md',
  )
  const runtimeSkill = await readFile(runtimeSkillPath, 'utf8')
  const governedSkillPaths = [
    '.codex/skills/govern-fhir-data-utilities/SKILL.md',
    '.codex/skills/govern-fhir-observation-components/SKILL.md',
  ]

  assert.match(runtimeSkill, /Node(?:\.js)? `?26\.13\.0`?/u)
  assert.match(runtimeSkill, /package\.json#engines.*compatibility metadata/is)

  for (const relativePath of governedSkillPaths) {
    const skill = await readFile(resolve(repositoryRoot, relativePath), 'utf8')
    assert.match(skill, /preserve-workspace-node-runtime/u, relativePath)
    assert.doesNotMatch(skill, /(?:Use|Run) Node 24/u, relativePath)
  }
})
