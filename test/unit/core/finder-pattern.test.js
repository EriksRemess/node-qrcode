import { test } from 'node:test'
import assert from 'node:assert/strict'
import pattern from '#lib/core/finder-pattern'
test('Finder pattern', (t) => {
  for (let i = 1; i <= 40; i++) {
    assert.strictEqual(pattern.getPositions(i).length, 3, 'Should always return 3 pattern positions')
  }
})
