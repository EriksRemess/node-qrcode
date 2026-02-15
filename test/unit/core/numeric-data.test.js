import { test } from 'node:test'
import assert from 'node:assert/strict'
import BitBuffer from '#lib/core/bit-buffer'
import NumericData from '#lib/core/numeric-data'
import Mode from '#lib/core/mode'
const testData = [
  {
    data: 8,
    length: 1,
    bitLength: 4,
    dataBit: [128]
  },
  {
    data: 16,
    length: 2,
    bitLength: 7,
    dataBit: [32]
  },
  {
    data: 128,
    length: 3,
    bitLength: 10,
    dataBit: [32, 0]
  },
  {
    data: 12345,
    length: 5,
    bitLength: 17,

    // (123)d -> (0001111011)b 10bit
    //  (45)d ->    (0101101)b  7bit
    //
    //  (00011110)b -> (30)d
    //  (11010110)b -> (214)d
    //  (10000000)b -> (128)d
    dataBit: [30, 214, 128]
  }
]

test('Numeric Data', (t) => {
  testData.forEach((data) => {
    const numericData = new NumericData(data.data)

    assert.strictEqual(numericData.mode, Mode.NUMERIC, 'Mode should be NUMERIC')
    assert.strictEqual(numericData.getLength(), data.length, 'Should return correct length')
    assert.strictEqual(numericData.getBitsLength(), data.bitLength, 'Should return correct bit length')

    const bitBuffer = new BitBuffer()
    numericData.write(bitBuffer)
    assert.deepStrictEqual(bitBuffer.buffer, data.dataBit, 'Should write correct data to buffer')
  })
})
