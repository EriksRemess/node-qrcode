import Mode from './mode.js';
import NumericData from './numeric-data.js';
import AlphanumericData from './alphanumeric-data.js';
import ByteData from './byte-data.js';
import KanjiData from './kanji-data.js';
import Regex from './regex.js';
import Utils from './utils.js';

/**
 * Returns UTF8 byte length
 *
 * @param  {String} str Input string
 * @return {Number}     Number of byte
 */
function getStringByteLength (str) {
  return Buffer.byteLength(str, 'utf8')
}

/**
 * Get a list of segments of the specified mode
 * from a string
 *
 * @param  {Mode}   mode Segment mode
 * @param  {String} str  String to process
 * @return {Array}       Array of object with segments data
 */
function getSegments (regex, mode, str) {
  regex.lastIndex = 0
  const segments = []
  let result

  while ((result = regex.exec(str)) !== null) {
    const match = result[0]
    segments.push({
      data: match,
      index: result.index,
      mode: mode,
      length: match.length
    })
  }

  return segments
}

/**
 * Extracts a series of segments with the appropriate
 * modes from a string
 *
 * @param  {String} dataStr Input string
 * @return {Array}          Array of object with segments data
 */
function getSegmentsFromString (dataStr) {
  const numSegs = getSegments(Regex.NUMERIC, Mode.NUMERIC, dataStr)
  const alphaNumSegs = getSegments(Regex.ALPHANUMERIC, Mode.ALPHANUMERIC, dataStr)
  let byteSegs
  let kanjiSegs

  if (Utils.isKanjiModeEnabled()) {
    byteSegs = getSegments(Regex.BYTE, Mode.BYTE, dataStr)
    kanjiSegs = getSegments(Regex.KANJI, Mode.KANJI, dataStr)
  } else {
    byteSegs = getSegments(Regex.BYTE_KANJI, Mode.BYTE, dataStr)
    kanjiSegs = []
  }

  const segs = numSegs.concat(alphaNumSegs, byteSegs, kanjiSegs)

  segs.sort(function (s1, s2) {
    return s1.index - s2.index
  })

  return segs
}

/**
 * Returns how many bits are needed to encode a string of
 * specified length with the specified mode
 *
 * @param  {Number} length String length
 * @param  {Mode} mode     Segment mode
 * @return {Number}        Bit length
 */
function getSegmentBitsLength (length, mode) {
  switch (mode) {
    case Mode.NUMERIC:
      return NumericData.getBitsLength(length)
    case Mode.ALPHANUMERIC:
      return AlphanumericData.getBitsLength(length)
    case Mode.KANJI:
      return KanjiData.getBitsLength(length)
    case Mode.BYTE:
      return ByteData.getBitsLength(length)
  }
}

/**
 * Merges adjacent segments which have the same mode
 *
 * @param  {Array} segs Array of object with segments data
 * @return {Array}      Array of object with segments data
 */
function mergeSegments (segs) {
  const acc = []

  for (let i = 0; i < segs.length; i++) {
    const curr = segs[i]
    const prevIndex = acc.length - 1
    const prevSeg = prevIndex >= 0 ? acc[prevIndex] : null

    if (prevSeg && prevSeg.mode === curr.mode) {
      acc[prevIndex].data += curr.data
    } else {
      acc.push(curr)
    }
  }

  return acc
}

/**
 * Generates a list of all possible nodes combination which
 * will be used to build a segments graph.
 *
 * Nodes are divided by groups. Each group will contain a list of all the modes
 * in which is possible to encode the given text.
 *
 * For example the text '12345' can be encoded as Numeric, Alphanumeric or Byte.
 * The group for '12345' will contain then 3 objects, one for each
 * possible encoding mode.
 *
 * Each node represents a possible segment.
 *
 * @param  {Array} segs Array of object with segments data
 * @return {Array}      Array of object with segments data
 */
function buildNodes (segs) {
  const nodes = []
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i]

    switch (seg.mode) {
      case Mode.NUMERIC:
        nodes.push([seg,
          { data: seg.data, mode: Mode.ALPHANUMERIC, length: seg.length },
          { data: seg.data, mode: Mode.BYTE, length: seg.length }
        ])
        break
      case Mode.ALPHANUMERIC:
        nodes.push([seg,
          { data: seg.data, mode: Mode.BYTE, length: seg.length }
        ])
        break
      case Mode.KANJI:
        nodes.push([seg,
          { data: seg.data, mode: Mode.BYTE, length: getStringByteLength(seg.data) }
        ])
        break
      case Mode.BYTE:
        nodes.push([
          { data: seg.data, mode: Mode.BYTE, length: getStringByteLength(seg.data) }
        ])
    }
  }

  return nodes
}

/**
 * Finds the shortest (fewest bits) path through node groups.
 * This is a layered dynamic-programming solver specialized for QR segments.
 *
 * @param  {Array} nodes    Array of node groups
 * @param  {Number} version QR Code version
 * @return {Array}          Optimized sequence of nodes
 */
function findOptimizedNodes (nodes, version) {
  if (nodes.length === 0) {
    return []
  }

  const switchCost = {
    [Mode.NUMERIC.id]: 4 + Mode.getCharCountIndicator(Mode.NUMERIC, version),
    [Mode.ALPHANUMERIC.id]: 4 + Mode.getCharCountIndicator(Mode.ALPHANUMERIC, version),
    [Mode.BYTE.id]: 4 + Mode.getCharCountIndicator(Mode.BYTE, version),
    [Mode.KANJI.id]: 4 + Mode.getCharCountIndicator(Mode.KANJI, version)
  }

  const backtrack = new Array(nodes.length)

  const firstGroup = nodes[0]
  let prevCosts = new Array(firstGroup.length)
  let prevLastCounts = new Array(firstGroup.length)

  backtrack[0] = new Array(firstGroup.length)
  for (let i = 0; i < firstGroup.length; i++) {
    const node = firstGroup[i]
    prevCosts[i] = getSegmentBitsLength(node.length, node.mode) + switchCost[node.mode.id]
    prevLastCounts[i] = node.length
    backtrack[0][i] = -1
  }

  for (let groupIndex = 1; groupIndex < nodes.length; groupIndex++) {
    const prevGroup = nodes[groupIndex - 1]
    const currentGroup = nodes[groupIndex]
    const currentCosts = new Array(currentGroup.length)
    const currentLastCounts = new Array(currentGroup.length)
    const currentBacktrack = new Array(currentGroup.length)

    for (let currIndex = 0; currIndex < currentGroup.length; currIndex++) {
      const currNode = currentGroup[currIndex]
      let bestCost = Infinity
      let bestPrevIndex = 0
      let bestLastCount = 0

      for (let prevIndex = 0; prevIndex < prevGroup.length; prevIndex++) {
        const prevNode = prevGroup[prevIndex]
        const prevLastCount = prevLastCounts[prevIndex]

        let edgeCost
        let lastCount

        if (prevNode.mode === currNode.mode) {
          edgeCost =
            getSegmentBitsLength(prevLastCount + currNode.length, currNode.mode) -
            getSegmentBitsLength(prevLastCount, currNode.mode)
          lastCount = prevLastCount + currNode.length
        } else {
          edgeCost = getSegmentBitsLength(currNode.length, currNode.mode) + switchCost[currNode.mode.id]
          lastCount = currNode.length
        }

        const totalCost = prevCosts[prevIndex] + edgeCost

        if (totalCost < bestCost) {
          bestCost = totalCost
          bestPrevIndex = prevIndex
          bestLastCount = lastCount
        }
      }

      currentCosts[currIndex] = bestCost
      currentLastCounts[currIndex] = bestLastCount
      currentBacktrack[currIndex] = bestPrevIndex
    }

    prevCosts = currentCosts
    prevLastCounts = currentLastCounts
    backtrack[groupIndex] = currentBacktrack
  }

  let bestFinalIndex = 0
  let bestFinalCost = prevCosts[0]
  for (let i = 1; i < prevCosts.length; i++) {
    if (prevCosts[i] < bestFinalCost) {
      bestFinalCost = prevCosts[i]
      bestFinalIndex = i
    }
  }

  const optimized = new Array(nodes.length)
  let idx = bestFinalIndex

  for (let groupIndex = nodes.length - 1; groupIndex >= 0; groupIndex--) {
    optimized[groupIndex] = nodes[groupIndex][idx]
    idx = backtrack[groupIndex][idx]
  }

  return optimized
}

/**
 * Builds a segment from a specified data and mode.
 * If a mode is not specified, the more suitable will be used.
 *
 * @param  {String} data             Input data
 * @param  {Mode | String} modesHint Data mode
 * @return {Segment}                 Segment
 */
function buildSingleSegment (data, modesHint) {
  let mode
  const bestMode = Mode.getBestModeForData(data)

  mode = Mode.from(modesHint, bestMode)

  // Make sure data can be encoded
  if (mode !== Mode.BYTE && mode.bit < bestMode.bit) {
    throw new Error('"' + data + '"' +
      ' cannot be encoded with mode ' + Mode.toString(mode) +
      '.\n Suggested mode is: ' + Mode.toString(bestMode))
  }

  // Use Mode.BYTE if Kanji support is disabled
  if (mode === Mode.KANJI && !Utils.isKanjiModeEnabled()) {
    mode = Mode.BYTE
  }

  switch (mode) {
    case Mode.NUMERIC:
      return new NumericData(data)

    case Mode.ALPHANUMERIC:
      return new AlphanumericData(data)

    case Mode.KANJI:
      return new KanjiData(data)

    case Mode.BYTE:
      return new ByteData(data)
  }
}

/**
 * Builds a list of segments from an array.
 * Array can contain Strings or Objects with segment's info.
 *
 * For each item which is a string, will be generated a segment with the given
 * string and the more appropriate encoding mode.
 *
 * For each item which is an object, will be generated a segment with the given
 * data and mode.
 * Objects must contain at least the property "data".
 * If property "mode" is not present, the more suitable mode will be used.
 *
 * @param  {Array} array Array of objects with segments data
 * @return {Array}       Array of Segments
 */
export function fromArray(array) {
  const acc = []

  for (let i = 0; i < array.length; i++) {
    const seg = array[i]

    if (typeof seg === 'string') {
      acc.push(buildSingleSegment(seg, null))
    } else if (seg.data) {
      acc.push(buildSingleSegment(seg.data, seg.mode))
    }
  }

  return acc
}

/**
 * Builds an optimized sequence of segments from a string,
 * which will produce the shortest possible bitstream.
 *
 * @param  {String} data    Input string
 * @param  {Number} version QR Code version
 * @return {Array}          Array of segments
 */
export function fromString(data, version) {
  const segs = getSegmentsFromString(data, Utils.isKanjiModeEnabled())

  const nodes = buildNodes(segs)
  const optimizedSegs = findOptimizedNodes(nodes, version)

  return fromArray(mergeSegments(optimizedSegs))
}

/**
 * Splits a string in various segments with the modes which
 * best represent their content.
 * The produced segments are far from being optimized.
 * The output of this function is only used to estimate a QR Code version
 * which may contain the data.
 *
 * @param  {string} data Input string
 * @return {Array}       Array of segments
 */
export function rawSplit(data) {
  return fromArray(
    getSegmentsFromString(data, Utils.isKanjiModeEnabled())
  )
}

export default { fromArray, fromString, rawSplit };
