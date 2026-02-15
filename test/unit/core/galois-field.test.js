import { test } from 'node:test'
import assert from 'node:assert/strict'
import GF from '#lib/core/galois-field'
test('Galois Field', (t) => {
  assert.throws(() => { GF.log(0) }, 'Should throw for log(n) with n < 1')

  for (let i = 1; i < 255; i++) {
    assert.strictEqual(GF.log(GF.exp(i)), i, 'log and exp should be one the inverse of the other')
    assert.strictEqual(GF.exp(GF.log(i)), i, 'exp and log should be one the inverse of the other')
  }

  assert.strictEqual(GF.mul(0, 1), 0, 'Should return 0 if first param is 0')
  assert.strictEqual(GF.mul(1, 0), 0, 'Should return 0 if second param is 0')
  assert.strictEqual(GF.mul(0, 0), 0, 'Should return 0 if both params are 0')

  for (let j = 1; j < 255; j++) {
    assert.strictEqual(GF.mul(j, 255 - j), GF.mul(255 - j, j), 'Multiplication should be commutative')
  }
})
