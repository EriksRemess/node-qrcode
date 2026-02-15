import { test } from 'node:test'
import assert from 'node:assert/strict'
import Utils from '#lib/core/utils'
/**
 * QR Code sizes. Each element refers to a version
 * @type {Array}
 */
const EXPECTED_SYMBOL_SIZES = [
  21, 25, 29, 33, 37, 41, 45,
  49, 53, 57, 61, 65, 69, 73,
  77, 81, 85, 89, 93, 97, 101,
  105, 109, 113, 117, 121, 125,
  129, 133, 137, 141, 145, 149,
  153, 157, 161, 165, 169, 173, 177]

test('Symbol size', (t) => {
  assert.throws(() => { Utils.getSymbolSize() }, 'Should throw if version is undefined')
  assert.throws(() => { Utils.getSymbolSize(0) }, 'Should throw if version is not in range')
  assert.throws(() => { Utils.getSymbolSize(41) }, 'Should throw if version is not in range')

  for (let i = 1; i <= 40; i++) {
    assert.strictEqual(Utils.getSymbolSize(i), EXPECTED_SYMBOL_SIZES[i - 1], 'Should return correct symbol size')
  }
})

test('Symbol codewords', (t) => {
  for (let i = 1; i <= 40; i++) {
    assert.ok(Utils.getSymbolTotalCodewords(i), 'Should return positive number')
  }
})

test('BCH Digit', (t) => {
  const testData = [
    { data: 0, bch: 0 },
    { data: 1, bch: 1 },
    { data: 2, bch: 2 },
    { data: 4, bch: 3 },
    { data: 8, bch: 4 }
  ]

  testData.forEach((d) => {
    assert.strictEqual(Utils.getBCHDigit(d.data), d.bch,
      'Should return correct BCH for value: ' + d.data)
  })
})

test('Set/Get SJIS function', (t) => {
  assert.throws(() => { Utils.setToSJISFunction() },
    'Should throw if param is not a function')

  assert.ok(!Utils.isKanjiModeEnabled(),
    'Kanji mode should be disabled if "toSJIS" function is not set')

  const testFunc = function testFunc (c) {
    return 'test_' + c
  }

  Utils.setToSJISFunction(testFunc)

  assert.ok(Utils.isKanjiModeEnabled(),
    'Kanji mode should be enabled if "toSJIS" function is set')

  assert.strictEqual(Utils.toSJIS('a'), 'test_a',
    'Should correctly call "toSJIS" function')
})
