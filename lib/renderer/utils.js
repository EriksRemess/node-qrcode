function hexCharToInt (charCode) {
  if (charCode >= 48 && charCode <= 57) return charCode - 48
  if (charCode >= 65 && charCode <= 70) return charCode - 55
  if (charCode >= 97 && charCode <= 102) return charCode - 87
  return -1
}

function pairToByte (str, index) {
  const hi = hexCharToInt(str.charCodeAt(index))
  const lo = hexCharToInt(str.charCodeAt(index + 1))
  if (hi === -1 || lo === -1) return -1
  return (hi << 4) | lo
}

function nibbleDoubledToByte (str, index) {
  const nibble = hexCharToInt(str.charCodeAt(index))
  if (nibble === -1) return -1
  return (nibble << 4) | nibble
}

const DEFAULT_DARK_HEX = '#000000ff'
const DEFAULT_LIGHT_HEX = '#ffffffff'
const COLOR_CACHE = new Map()

function cacheColor (key, color) {
  if (COLOR_CACHE.size > 64) {
    COLOR_CACHE.clear()
  }

  COLOR_CACHE.set(key, color)
  return color
}

function hex2rgba (hex) {
  if (typeof hex === 'number') hex = hex.toString()

  if (typeof hex !== 'string') {
    throw new Error('Color should be defined as hex string')
  }

  const cached = COLOR_CACHE.get(hex)
  if (cached) return cached

  const raw = hex.charCodeAt(0) === 35 ? hex.slice(1) : hex
  const len = raw.length

  if (len < 3 || len === 5 || len > 8) {
    throw new Error('Invalid hex color: ' + hex)
  }

  let r
  let g
  let b
  let a
  let hexNoAlpha

  if (len === 3 || len === 4) {
    r = nibbleDoubledToByte(raw, 0)
    g = nibbleDoubledToByte(raw, 1)
    b = nibbleDoubledToByte(raw, 2)
    a = len === 4 ? nibbleDoubledToByte(raw, 3) : 255

    if (r < 0 || g < 0 || b < 0 || a < 0) {
      throw new Error('Invalid hex color: ' + hex)
    }

    hexNoAlpha = '#' + raw[0] + raw[0] + raw[1] + raw[1] + raw[2] + raw[2]
  } else {
    r = pairToByte(raw, 0)
    g = pairToByte(raw, 2)
    b = pairToByte(raw, 4)
    a = len === 8 ? pairToByte(raw, 6) : 255

    if (r < 0 || g < 0 || b < 0 || a < 0) {
      throw new Error('Invalid hex color: ' + hex)
    }

    hexNoAlpha = '#' + raw.slice(0, 6)
  }

  return cacheColor(hex, { r, g, b, a, hex: hexNoAlpha })
}

const DEFAULT_DARK_COLOR = hex2rgba(DEFAULT_DARK_HEX)
const DEFAULT_LIGHT_COLOR = hex2rgba(DEFAULT_LIGHT_HEX)

export function getOptions(options) {
  const opts = options || {}
  const color = opts.color || {}

  const margin = typeof opts.margin === 'undefined' ||
    opts.margin === null ||
    opts.margin < 0
    ? 4
    : opts.margin

  const width = opts.width && opts.width >= 21 ? opts.width : undefined
  const scale = opts.scale || 4

  return {
    width: width,
    scale: width ? 4 : scale,
    margin: margin,
    color: {
      dark: color.dark ? hex2rgba(color.dark) : DEFAULT_DARK_COLOR,
      light: color.light ? hex2rgba(color.light) : DEFAULT_LIGHT_COLOR
    },
    type: opts.type,
    rendererOpts: opts.rendererOpts || {}
  }
}

export function getScale(qrSize, opts) {
  return opts.width && opts.width >= qrSize + opts.margin * 2
    ? opts.width / (qrSize + opts.margin * 2)
    : opts.scale
}

export function getImageWidth(qrSize, opts) {
  const scale = getScale(qrSize, opts)
  return Math.floor((qrSize + opts.margin * 2) * scale)
}

export function qrToImageData(imgData, qr, opts) {
  const size = qr.modules.size
  const data = qr.modules.data
  const scale = getScale(size, opts)
  const symbolSize = Math.floor((size + opts.margin * 2) * scale)
  const scaledMargin = opts.margin * scale
  const light = opts.color.light
  const dark = opts.color.dark

  const innerStart = Math.ceil(scaledMargin)
  const innerEnd = Math.ceil(symbolSize - scaledMargin)
  const innerWidth = innerEnd - innerStart

  const colToSrc = new Int32Array(innerWidth > 0 ? innerWidth : 0)
  for (let x = 0; x < innerWidth; x++) {
    colToSrc[x] = Math.floor((innerStart + x - scaledMargin) / scale)
  }

  for (let i = 0; i < symbolSize; i++) {
    const rowOffset = i * symbolSize
    const rowOffset4 = rowOffset * 4
    const isInnerRow = i >= innerStart && i < innerEnd

    if (!isInnerRow) {
      for (let j = 0; j < symbolSize; j++) {
        const posDst = rowOffset4 + j * 4
        imgData[posDst] = light.r
        imgData[posDst + 1] = light.g
        imgData[posDst + 2] = light.b
        imgData[posDst + 3] = light.a
      }

      continue
    }

    for (let j = 0; j < innerStart; j++) {
      const posDst = rowOffset4 + j * 4
      imgData[posDst] = light.r
      imgData[posDst + 1] = light.g
      imgData[posDst + 2] = light.b
      imgData[posDst + 3] = light.a
    }

    const iSrc = Math.floor((i - scaledMargin) / scale)
    const srcRowOffset = iSrc * size

    for (let j = innerStart; j < innerEnd; j++) {
      const posDst = rowOffset4 + j * 4
      const module = data[srcRowOffset + colToSrc[j - innerStart]]
      const pxColor = module ? dark : light

      imgData[posDst] = pxColor.r
      imgData[posDst + 1] = pxColor.g
      imgData[posDst + 2] = pxColor.b
      imgData[posDst + 3] = pxColor.a
    }

    for (let j = innerEnd; j < symbolSize; j++) {
      const posDst = rowOffset4 + j * 4
      imgData[posDst] = light.r
      imgData[posDst + 1] = light.g
      imgData[posDst + 2] = light.b
      imgData[posDst + 3] = light.a
    }
  }
}

export default { getOptions, getScale, getImageWidth, qrToImageData };
