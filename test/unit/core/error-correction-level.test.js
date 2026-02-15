import { test } from 'node:test'
import assert from 'node:assert/strict'
import ECLevel from '#lib/core/error-correction-level'
const EC_LEVELS = [ECLevel.L, ECLevel.M, ECLevel.Q, ECLevel.H]

test('Error level from input value', (t) => {
  const values = [['l', 'low'], ['m', 'medium'], ['q', 'quartile'], ['h', 'high']]

  for (let l = 0; l < values.length; l++) {
    for (let i = 0; i < values[l].length; i++) {
      assert.strictEqual(ECLevel.from(values[l][i]), EC_LEVELS[l])
      assert.strictEqual(ECLevel.from(values[l][i].toUpperCase()), EC_LEVELS[l])
    }
  }

  assert.strictEqual(ECLevel.from(ECLevel.L), ECLevel.L, 'Should return passed level if value is valid')
  assert.strictEqual(ECLevel.from(undefined, ECLevel.M), ECLevel.M, 'Should return default level if value is undefined')
  assert.strictEqual(ECLevel.from('', ECLevel.Q), ECLevel.Q, 'Should return default level if value is invalid')
})

test('Error level validity', (t) => {
  for (let l = 0; l < EC_LEVELS.length; l++) {
    assert.ok(ECLevel.isValid(EC_LEVELS[l]), 'Should return true if error level is valid')
  }

  assert.ok(!ECLevel.isValid(undefined), 'Should return false if level is undefined')
  assert.ok(!ECLevel.isValid({}), 'Should return false if bit property is undefined')
  assert.ok(!ECLevel.isValid({ bit: -1 }), 'Should return false if bit property value is < 0')
  assert.ok(!ECLevel.isValid({ bit: 4 }), 'Should return false if bit property value is > 3')
})
