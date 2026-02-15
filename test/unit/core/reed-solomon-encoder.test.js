import { test } from 'node:test'
import assert from 'node:assert/strict'
import RS from '#lib/core/reed-solomon-encoder'
test('Reed-Solomon encoder', (t) => {
  let enc = new RS()

  assert.ok(!enc.genPoly, 'Should have an undefined generator polynomial')
  assert.throws(() => { enc.encode([]) }, 'Should throw if generator polynomial is undefined')

  enc.initialize(2)
  assert.strictEqual(enc.degree, 2, 'Should set correct degree value')
  assert.ok(enc.genPoly, 'Generator polynomial should be defined')

  const result = enc.encode(new Uint8Array([48, 49, 50, 51, 52]))
  assert.strictEqual(result.length, 2, 'Should return a number of codewords equal to gen poly degree')

  enc = new RS(2)
  const genPoly = enc.genPoly
  assert.strictEqual(enc.degree, 2, 'Should set correct degree value')
  assert.ok(genPoly, 'Generator polynomial should be defined')

  enc.initialize(3)
  assert.notStrictEqual(enc.genPoly, genPoly, 'Should reinitialize the generator polynomial')

  enc = new RS(0)
  assert.ok(!enc.genPoly, 'Should not create a generator polynomial if degree is 0')

  enc = new RS(1)
  assert.deepStrictEqual(enc.encode(new Uint8Array([0])), new Uint8Array([0]),
    'Should return correct buffer')
})
