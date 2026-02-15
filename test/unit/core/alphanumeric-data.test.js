import { test } from 'node:test'
import assert from 'node:assert/strict'
import BitBuffer from '#lib/core/bit-buffer'
import AlphanumericData from '#lib/core/alphanumeric-data'
import Mode from '#lib/core/mode'
const testData = [
  {
    data: 'A',
    length: 1,
    bitLength: 6,
    dataBit: [40]
  },
  {
    data: 'AB',
    length: 2,
    bitLength: 11,
    dataBit: [57, 160]
  },
  {
    data: 'ABC12',
    length: 5,
    bitLength: 28,
    dataBit: [57, 168, 116, 32]
  }
]

test('Alphanumeric Data', (t) => {
  testData.forEach((data) => {
    const alphanumericData = new AlphanumericData(data.data)

    assert.strictEqual(alphanumericData.mode, Mode.ALPHANUMERIC, 'Mode should be ALPHANUMERIC')
    assert.strictEqual(alphanumericData.getLength(), data.length, 'Should return correct length')
    assert.strictEqual(alphanumericData.getBitsLength(), data.bitLength, 'Should return correct bit length')

    const bitBuffer = new BitBuffer()
    alphanumericData.write(bitBuffer)
    assert.deepStrictEqual(bitBuffer.buffer, data.dataBit, 'Should write correct data to buffer')
  })
})
