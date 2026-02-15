/**
 * Data mask pattern reference
 * @type {Object}
 */
export const Patterns = {
  PATTERN000: 0,
  PATTERN001: 1,
  PATTERN010: 2,
  PATTERN011: 3,
  PATTERN100: 4,
  PATTERN101: 5,
  PATTERN110: 6,
  PATTERN111: 7
};

/**
 * Weighted penalty scores for the undesirable features
 * @type {Object}
 */
const PenaltyScores = {
  N1: 3,
  N2: 3,
  N3: 40,
  N4: 10
}

/**
 * Check if mask pattern value is valid
 *
 * @param  {Number}  mask    Mask pattern
 * @return {Boolean}         true if valid, false otherwise
 */
export function isValid(mask) {
  return mask != null && mask !== '' && !isNaN(mask) && mask >= 0 && mask <= 7
}

/**
 * Returns mask pattern from a value.
 * If value is not valid, returns undefined
 *
 * @param  {Number|String} value        Mask pattern value
 * @return {Number}                     Valid mask pattern or undefined
 */
export function from(value) {
  return isValid(value) ? parseInt(value, 10) : undefined
}

/**
* Find adjacent modules in row/column with the same color
* and assign a penalty value.
*
* Points: N1 + i
* i is the amount by which the number of adjacent modules of the same color exceeds 5
*/
export function getPenaltyN1(data) {
  const size = data.size
  const modules = data.data
  let points = 0
  let sameCountCol = 0
  let sameCountRow = 0
  let lastCol = null
  let lastRow = null

  for (let row = 0; row < size; row++) {
    const rowOffset = row * size
    sameCountCol = sameCountRow = 0
    lastCol = lastRow = null

    for (let col = 0; col < size; col++) {
      let module = modules[rowOffset + col]
      if (module === lastCol) {
        sameCountCol++
      } else {
        if (sameCountCol >= 5) points += PenaltyScores.N1 + (sameCountCol - 5)
        lastCol = module
        sameCountCol = 1
      }

      module = modules[col * size + row]
      if (module === lastRow) {
        sameCountRow++
      } else {
        if (sameCountRow >= 5) points += PenaltyScores.N1 + (sameCountRow - 5)
        lastRow = module
        sameCountRow = 1
      }
    }

    if (sameCountCol >= 5) points += PenaltyScores.N1 + (sameCountCol - 5)
    if (sameCountRow >= 5) points += PenaltyScores.N1 + (sameCountRow - 5)
  }

  return points
}

/**
 * Find 2x2 blocks with the same color and assign a penalty value
 *
 * Points: N2 * (m - 1) * (n - 1)
 */
export function getPenaltyN2(data) {
  const size = data.size
  const modules = data.data
  let points = 0

  for (let row = 0; row < size - 1; row++) {
    const rowOffset = row * size
    const nextRowOffset = rowOffset + size

    for (let col = 0; col < size - 1; col++) {
      const last = modules[rowOffset + col] +
        modules[rowOffset + col + 1] +
        modules[nextRowOffset + col] +
        modules[nextRowOffset + col + 1]

      if (last === 4 || last === 0) points++
    }
  }

  return points * PenaltyScores.N2
}

/**
 * Find 1:1:3:1:1 ratio (dark:light:dark:light:dark) pattern in row/column,
 * preceded or followed by light area 4 modules wide
 *
 * Points: N3 * number of pattern found
 */
export function getPenaltyN3(data) {
  const size = data.size
  const modules = data.data
  let points = 0
  let bitsCol = 0
  let bitsRow = 0

  for (let row = 0; row < size; row++) {
    const rowOffset = row * size
    bitsCol = bitsRow = 0
    for (let col = 0; col < size; col++) {
      bitsCol = ((bitsCol << 1) & 0x7FF) | modules[rowOffset + col]
      if (col >= 10 && (bitsCol === 0x5D0 || bitsCol === 0x05D)) points++

      bitsRow = ((bitsRow << 1) & 0x7FF) | modules[col * size + row]
      if (col >= 10 && (bitsRow === 0x5D0 || bitsRow === 0x05D)) points++
    }
  }

  return points * PenaltyScores.N3
}

/**
 * Calculate proportion of dark modules in entire symbol
 *
 * Points: N4 * k
 *
 * k is the rating of the deviation of the proportion of dark modules
 * in the symbol from 50% in steps of 5%
 */
export function getPenaltyN4(data) {
  let darkCount = 0
  const modulesCount = data.data.length

  for (let i = 0; i < modulesCount; i++) darkCount += data.data[i]

  const k = Math.abs(Math.ceil((darkCount * 100 / modulesCount) / 5) - 10)

  return k * PenaltyScores.N4
}

/**
 * Apply a mask pattern to a BitMatrix
 *
 * @param  {Number}    pattern Pattern reference number
 * @param  {BitMatrix} data    BitMatrix data
 */
export function applyMask(pattern, data) {
  const size = data.size
  const modules = data.data
  const reserved = data.reservedBit

  for (let row = 0; row < size; row++) {
    const rowOffset = row * size

    for (let col = 0; col < size; col++) {
      const index = rowOffset + col
      if (reserved[index]) continue

      let mask = false

      switch (pattern) {
        case Patterns.PATTERN000:
          mask = (row + col) % 2 === 0
          break
        case Patterns.PATTERN001:
          mask = row % 2 === 0
          break
        case Patterns.PATTERN010:
          mask = col % 3 === 0
          break
        case Patterns.PATTERN011:
          mask = (row + col) % 3 === 0
          break
        case Patterns.PATTERN100:
          mask = ((row >> 1) + ((col / 3) | 0)) % 2 === 0
          break
        case Patterns.PATTERN101: {
          const mul = row * col
          mask = mul % 2 + mul % 3 === 0
          break
        }
        case Patterns.PATTERN110: {
          const mul = row * col
          mask = (mul % 2 + mul % 3) % 2 === 0
          break
        }
        case Patterns.PATTERN111: {
          const mul = row * col
          mask = (mul % 3 + (row + col) % 2) % 2 === 0
          break
        }
        default:
          throw new Error('bad maskPattern:' + pattern)
      }

      if (mask) modules[index] ^= 1
    }
  }
}

/**
 * Returns the best mask pattern for data
 *
 * @param  {BitMatrix} data
 * @return {Number} Mask pattern reference number
 */
export function getBestMask(data, setupFormatFunc) {
  const numPatterns = 8
  let bestPattern = 0
  let lowerPenalty = Infinity

  for (let p = 0; p < numPatterns; p++) {
    setupFormatFunc(p)
    applyMask(p, data)

    // Calculate penalty
    const penalty =
      getPenaltyN1(data) +
      getPenaltyN2(data) +
      getPenaltyN3(data) +
      getPenaltyN4(data)

    // Undo previously applied mask
    applyMask(p, data)

    if (penalty < lowerPenalty) {
      lowerPenalty = penalty
      bestPattern = p
    }
  }

  return bestPattern
}

export default { isValid, from, getPenaltyN1, getPenaltyN2, getPenaltyN3, getPenaltyN4, applyMask, getBestMask, Patterns };
