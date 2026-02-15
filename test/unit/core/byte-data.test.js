import { test } from 'node:test'
import assert from 'node:assert/strict'
import BitBuffer from '#lib/core/bit-buffer'
import ByteData from '#lib/core/byte-data'
import Mode from '#lib/core/mode'
test('Byte Data: String Input', () => {
  const text = '1234'
  const textBitLength = 32
  const textByte = [49, 50, 51, 52] // 1, 2, 3, 4
  const utf8Text = '\u00bd + \u00bc = \u00be' // 9 char, 12 byte

  const byteData = new ByteData(text)

  assert.strictEqual(byteData.mode, Mode.BYTE, 'Mode should be BYTE')
  assert.strictEqual(byteData.getLength(), text.length, 'Should return correct length')
  assert.strictEqual(byteData.getBitsLength(), textBitLength, 'Should return correct bit length')

  const bitBuffer = new BitBuffer()
  byteData.write(bitBuffer)
  assert.deepStrictEqual(bitBuffer.buffer, textByte, 'Should write correct data to buffer')

  const byteDataUtf8 = new ByteData(utf8Text)
  assert.strictEqual(byteDataUtf8.getLength(), 12, 'Should return correct length for utf8 chars')
})

test('Byte Data: Byte Input', () => {
  const bytes = new Uint8ClampedArray([1, 231, 32, 22])

  const byteData = new ByteData(bytes)
  assert.strictEqual(byteData.getLength(), bytes.length, 'Should return correct length')
  assert.strictEqual(byteData.getBitsLength(), bytes.length * 8, 'Should return correct bit length')

  const bitBuffer = new BitBuffer()
  byteData.write(bitBuffer)
  assert.deepStrictEqual(bitBuffer.buffer, Array.from(bytes), 'Should write correct data to buffer')
})
