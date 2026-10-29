/**
 * Provider smoke test: run without DSH by faking `ctx.skills`.
 *   node test/provider.test.mjs
 */
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { apply } from '../lib/index.js'

let registered
apply({
  skills: {
    registerProvider(factory) {
      registered = factory({})
    },
  },
})

const list = await registered.list()
assert.equal(list.length, 7, `expected 7 skills, got ${list.length}`)

const studio = list.find((item) => item.name === 'git-workflow-studio')
assert.ok(studio, 'router skill git-workflow-studio not discovered')
assert.equal(studio.provider, 'jojo-adam-git-workflow')
assert.ok(studio.description.length > 20, 'router description too short')

const loaded = await registered.get(studio)
assert.ok(loaded.content.includes('Git 工作流工作室'), 'router body missing heading')

// 每个技能都必须在磁盘上有 SKILL.md，且带 whenToUse（DSH 技能发现靠它）
for (const item of list) {
  assert.ok(existsSync(join(item.resourceBase.path, 'SKILL.md')), `${item.name}: SKILL.md missing`)
  assert.ok(
    typeof item.whenToUse === 'string' && item.whenToUse.length > 5,
    `${item.name}: whenToUse missing`,
  )
}

const names = list.map((item) => item.name).sort()
console.log(`ok — ${list.length} skills: ${names.join(', ')}`)
