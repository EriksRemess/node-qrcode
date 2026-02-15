import { test } from 'node:test'
import assert from 'node:assert/strict'
import toSJIS from '#helper/to-sjis'
test('SJIS from char', (t) => {
  assert.ok(!toSJIS(''),
    'Should return undefined if character is invalid')

  assert.ok(!toSJIS('A'),
    'Should return undefined if character is not a kanji')

  assert.strictEqual(toSJIS('襦'), 0xe640,
    'Should return correct SJIS value')

  assert.strictEqual(toSJIS('￢'), 0x81ca,
    'Should return correct SJIS value')

  assert.strictEqual(toSJIS('≧'), 0x8186,
    'Should return correct SJIS value')

  assert.strictEqual(toSJIS('⊥'), 0x81db,
    'Should return correct SJIS value')

  assert.strictEqual(toSJIS('愛'), 0x88a4,
    'Should return correct SJIS value')

  assert.strictEqual(toSJIS('衣'), 0x88df,
    'Should return correct SJIS value')

  assert.strictEqual(toSJIS('蔭'), 0x88fc,
    'Should return correct SJIS value')
})
