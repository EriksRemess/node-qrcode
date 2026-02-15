import GF from './galois-field.js';

/**
 * Multiplies two polynomials inside Galois Field
 *
 * @param  {Uint8Array} p1 Polynomial
 * @param  {Uint8Array} p2 Polynomial
 * @return {Uint8Array}    Product of p1 and p2
 */
export function mul(p1, p2) {
  const coeff = new Uint8Array(p1.length + p2.length - 1)

  for (let i = 0; i < p1.length; i++) {
    for (let j = 0; j < p2.length; j++) {
      coeff[i + j] ^= GF.mul(p1[i], p2[j])
    }
  }

  return coeff
}

/**
 * Calculate the remainder of polynomials division
 *
 * @param  {Uint8Array} divident Polynomial
 * @param  {Uint8Array} divisor  Polynomial
 * @return {Uint8Array}          Remainder
 */
export function mod(divident, divisor) {
  const result = new Uint8Array(divident)
  let offset = 0
  const limit = result.length - divisor.length

  while (offset <= limit) {
    const coeff = result[offset]

    if (coeff !== 0) {
      for (let i = 0; i < divisor.length; i++) {
        result[offset + i] ^= GF.mul(divisor[i], coeff)
      }
    }

    while (offset < result.length && result[offset] === 0) offset++
  }

  return result.slice(offset)
}

/**
 * Generate an irreducible generator polynomial of specified degree
 * (used by Reed-Solomon encoder)
 *
 * @param  {Number} degree Degree of the generator polynomial
 * @return {Uint8Array}    Buffer containing polynomial coefficients
 */
export function generateECPolynomial(degree) {
  let poly = new Uint8Array([1])
  const factor = new Uint8Array(2)
  factor[0] = 1

  for (let i = 0; i < degree; i++) {
    factor[1] = GF.exp(i)
    poly = mul(poly, factor)
  }

  return poly
}

export default { mul, mod, generateECPolynomial };
