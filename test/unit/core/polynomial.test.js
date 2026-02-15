import { test } from 'node:test'
import assert from 'node:assert/strict'
import Poly from '#lib/core/polynomial'
test('Generator polynomial', (t) => {
  const result = Poly.generateECPolynomial(0)
  assert.ok(result instanceof Uint8Array, 'Should return an Uint8Array')
  assert.deepStrictEqual(result, new Uint8Array([1]), 'Should return coeff [1] for polynomial of degree 0')

  for (let e = 2; e <= 68; e++) {
    assert.strictEqual(Poly.generateECPolynomial(e).length, e + 1, 'Should return a number of coefficients equal to (degree + 1)')
  }
})

test('Polynomial', (t) => {
  const p1 = [0, 1, 2, 3, 4]
  const p2 = [5, 6]

  let result = Poly.mul(p1, p2)
  assert.ok(result instanceof Uint8Array, 'Should return an Uint8Array')
  assert.strictEqual(result.length, 6, 'Should return correct number of coefficients')

  result = Poly.mod(p1, Poly.generateECPolynomial(2))
  assert.ok(result instanceof Uint8Array, 'Should return an Uint8Array')
  assert.strictEqual(result.length, 2, 'Should return correct number of coefficients')
})
