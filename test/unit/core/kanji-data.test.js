import { test } from 'node:test'
import assert from 'node:assert/strict'
import BitBuffer from '#lib/core/bit-buffer'
import KanjiData from '#lib/core/kanji-data'
import Mode from '#lib/core/mode'
import Utils from '#lib/core/utils'
import toSJIS from '#helper/to-sjis'
Utils.setToSJISFunction(toSJIS)

test('Kanji Data', (t) => {
  const data = '漢字漾癶'
  const length = 4
  const bitLength = 52 // length * 13

  const dataBit = [57, 250, 134, 174, 129, 134, 0]

  let kanjiData = new KanjiData(data)

  assert.strictEqual(kanjiData.mode, Mode.KANJI, 'Mode should be KANJI')
  assert.strictEqual(kanjiData.getLength(), length, 'Should return correct length')
  assert.strictEqual(kanjiData.getBitsLength(), bitLength, 'Should return correct bit length')

  let bitBuffer = new BitBuffer()
  kanjiData.write(bitBuffer)
  assert.deepStrictEqual(bitBuffer.buffer, dataBit, 'Should write correct data to buffer')

  kanjiData = new KanjiData('abc')
  bitBuffer = new BitBuffer()
  assert.throws(() => { kanjiData.write(bitBuffer) }, 'Should throw if data is invalid')
})
