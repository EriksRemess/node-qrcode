import { test } from 'node:test'
import assert from 'node:assert/strict'
import Regex from '#lib/core/regex'
test('Regex', (t) => {
  assert.ok(Regex.NUMERIC instanceof RegExp,
    'Should export a regex for NUMERIC')

  assert.ok(Regex.ALPHANUMERIC instanceof RegExp,
    'Should export a regex for ALPHANUMERIC')

  assert.ok(Regex.BYTE instanceof RegExp,
    'Should export a regex for BYTE')

  assert.ok(Regex.KANJI instanceof RegExp,
    'Should export a regex for KANJI')

  assert.ok(Regex.BYTE_KANJI instanceof RegExp,
    'Should export a regex for BYTE_KANJI')
})

test('Regex test', (t) => {
  assert.ok(Regex.testNumeric('123456'), 'Should return true if is a number')
  assert.ok(!Regex.testNumeric('a12345'), 'Should return false if is not a number')
  assert.ok(!Regex.testNumeric('ABC123'), 'Should return false if is not a number')

  assert.ok(Regex.testAlphanumeric('123ABC'), 'Should return true if is alphanumeric')
  assert.ok(Regex.testAlphanumeric('123456'), 'Should return true if is alphanumeric')
  assert.ok(!Regex.testAlphanumeric('ABCabc'), 'Should return false if is not alphanumeric')

  assert.ok(Regex.testKanji('乂ЁЖぞβ'), 'Should return true if is a kanji')
  assert.ok(!Regex.testKanji('皿a晒三A'), 'Should return false if is not a kanji')
  assert.ok(!Regex.testKanji('123456'), 'Should return false if is not a kanji')
  assert.ok(!Regex.testKanji('ABC123'), 'Should return false if is not a kanji')
  assert.ok(!Regex.testKanji('abcdef'), 'Should return false if is not a kanji')
})
