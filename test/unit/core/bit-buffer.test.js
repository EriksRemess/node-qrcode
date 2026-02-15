import { test } from 'node:test'
import assert from 'node:assert/strict'
import BitBuffer from '#lib/core/bit-buffer'
test('Bit Buffer', (t) => {
  const testData = 0x41 // 'A'
  const expectedDataBits = [false, true, false, false, false, false, false, true]

  const bitBuffer = new BitBuffer()

  assert.strictEqual(bitBuffer.getLengthInBits(), 0, 'Initial length should be 0')

  bitBuffer.put(testData, 8)
  assert.strictEqual(bitBuffer.getLengthInBits(), 8, 'Length should be 8')

  for (let i = 0; i < 8; i++) {
    assert.deepStrictEqual(bitBuffer.get(i), expectedDataBits[i], 'Should return correct bit value')
  }
})
