import { test } from 'node:test'
import assert from 'node:assert/strict'
import BitMatrix from '#lib/core/bit-matrix'
test('Bit Matrix', (t) => {
  assert.throws(() => { BitMatrix(0) }, 'Should throw if size is 0')
  assert.throws(() => { BitMatrix(-1) }, 'Should throw if size less than 0')

  const bm = new BitMatrix(2)

  assert.strictEqual(bm.size, 2, 'Should have correct size')
  assert.strictEqual(bm.data.length, 4, 'Should correctly set buffer size')

  bm.set(0, 1, true, true)
  assert.ok(bm.get(0, 1), 'Should correctly set bit to true')
  assert.ok(bm.isReserved(0, 1), 'Should correctly set bit as reserved')

  bm.xor(0, 1, 1)
  assert.ok(!bm.get(0, 1), 'Should correctly xor bit')

  bm.set(0, 1, false)
  assert.ok(!bm.get(0, 1), 'Should correctly set bit to false')
})
