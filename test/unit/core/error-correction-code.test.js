import { test } from 'node:test'
import assert from 'node:assert/strict'
import Utils from '#lib/core/utils'
import Version from '#lib/core/version'
import ECLevel from '#lib/core/error-correction-level'
import ECCode from '#lib/core/error-correction-code'
import Mode from '#lib/core/mode'
test('Error correction codewords', (t) => {
  const levels = [ECLevel.L, ECLevel.M, ECLevel.Q, ECLevel.H]

  for (let v = 1; v <= 40; v++) {
    const totalCodewords = Utils.getSymbolTotalCodewords(v)
    const reservedByte = Math.ceil((Mode.getCharCountIndicator(Mode.BYTE, v) + 4) / 8)

    for (let l = 0; l < levels.length; l++) {
      const dataCodewords = Version.getCapacity(v, levels[l], Mode.BYTE) + reservedByte

      const expectedCodewords = totalCodewords - dataCodewords

      assert.strictEqual(ECCode.getTotalCodewordsCount(v, levels[l]), expectedCodewords,
        'Should return correct codewords number')
    }
  }

  assert.strictEqual(ECCode.getTotalCodewordsCount(1), undefined,
    'Should return undefined if EC level is not specified')
})

test('Error correction blocks', (t) => {
  const levels = [ECLevel.L, ECLevel.M, ECLevel.Q, ECLevel.H]

  for (let v = 1; v <= 40; v++) {
    for (let l = 0; l < levels.length; l++) {
      assert.ok(ECCode.getBlocksCount(v, levels[l]), 'Should return a positive number')
    }
  }

  assert.strictEqual(ECCode.getBlocksCount(1), undefined,
    'Should return undefined if EC level is not specified')
})
