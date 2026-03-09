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
const VALID_SHAPES = new Set(['square', 'rounded'])
const ROUNDED_RADIUS = 0.2
const COVERAGE_SAMPLE_STEPS = 4

function getShape(shape) {
  if (typeof shape === 'undefined') return 'square'

  if (!VALID_SHAPES.has(shape)) {
    throw new Error('Invalid shape: ' + shape)
  }

  return shape
}

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
    shape: getShape(opts.shape),
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

function isInsideRoundedModule(localX, localY, top, right, bottom, left) {
  const tl = !top && !left ? ROUNDED_RADIUS : 0
  const tr = !top && !right ? ROUNDED_RADIUS : 0
  const br = !bottom && !right ? ROUNDED_RADIUS : 0
  const bl = !bottom && !left ? ROUNDED_RADIUS : 0

  if (tl > 0 && localX < tl && localY < tl) {
    const dx = localX - tl
    const dy = localY - tl
    return dx * dx + dy * dy <= tl * tl
  }

  if (tr > 0 && localX > 1 - tr && localY < tr) {
    const dx = localX - (1 - tr)
    const dy = localY - tr
    return dx * dx + dy * dy <= tr * tr
  }

  if (br > 0 && localX > 1 - br && localY > 1 - br) {
    const dx = localX - (1 - br)
    const dy = localY - (1 - br)
    return dx * dx + dy * dy <= br * br
  }

  if (bl > 0 && localX < bl && localY > 1 - bl) {
    const dx = localX - bl
    const dy = localY - (1 - bl)
    return dx * dx + dy * dy <= bl * bl
  }

  return true
}

function isDarkShapeSample(qr, moduleX, moduleY, localX, localY) {
  const size = qr.modules.size
  const data = qr.modules.data
  const rowOffset = moduleY * size

  if (!data[rowOffset + moduleX]) {
    return false
  }

  const top = moduleY > 0 && data[rowOffset - size + moduleX]
  const right = moduleX < size - 1 && data[rowOffset + moduleX + 1]
  const bottom = moduleY < size - 1 && data[rowOffset + size + moduleX]
  const left = moduleX > 0 && data[rowOffset + moduleX - 1]

  return isInsideRoundedModule(localX, localY, top, right, bottom, left)
}

function blendAreaColors(light, dark, darkCoverage) {
  if (darkCoverage <= 0) return light
  if (darkCoverage >= 1) return dark

  const lightCoverage = 1 - darkCoverage
  const darkAlpha = dark.a / 255
  const lightAlpha = light.a / 255
  const outAlpha = darkCoverage * darkAlpha + lightCoverage * lightAlpha

  if (outAlpha <= 0) {
    return { r: 0, g: 0, b: 0, a: 0 }
  }

  return {
    r: Math.round((darkCoverage * darkAlpha * dark.r + lightCoverage * lightAlpha * light.r) / outAlpha),
    g: Math.round((darkCoverage * darkAlpha * dark.g + lightCoverage * lightAlpha * light.g) / outAlpha),
    b: Math.round((darkCoverage * darkAlpha * dark.b + lightCoverage * lightAlpha * light.b) / outAlpha),
    a: Math.round(outAlpha * 255)
  }
}

function getShapePixelColor(qr, pxX, pxY, scale, scaledMargin, light, dark) {
  let darkSamples = 0
  const totalSamples = COVERAGE_SAMPLE_STEPS * COVERAGE_SAMPLE_STEPS

  for (let sampleY = 0; sampleY < COVERAGE_SAMPLE_STEPS; sampleY++) {
    const y = pxY + (sampleY + 0.5) / COVERAGE_SAMPLE_STEPS
    const sourceY = (y - scaledMargin) / scale
    const moduleY = Math.floor(sourceY)

    if (moduleY < 0 || moduleY >= qr.modules.size) {
      continue
    }

    for (let sampleX = 0; sampleX < COVERAGE_SAMPLE_STEPS; sampleX++) {
      const x = pxX + (sampleX + 0.5) / COVERAGE_SAMPLE_STEPS
      const sourceX = (x - scaledMargin) / scale
      const moduleX = Math.floor(sourceX)

      if (moduleX < 0 || moduleX >= qr.modules.size) {
        continue
      }

      if (isDarkShapeSample(qr, moduleX, moduleY, sourceX - moduleX, sourceY - moduleY)) {
        darkSamples++
      }
    }
  }

  return blendAreaColors(light, dark, darkSamples / totalSamples)
}

function qrToImageDataClamped(imgData, qr, opts) {
  if (opts.shape !== 'square') {
    qrToImageDataGeneric(imgData, qr, opts)
    return
  }

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

function qrToImageDataByte(imgData, qr, opts) {
  if (opts.shape !== 'square') {
    qrToImageDataGeneric(imgData, qr, opts)
    return
  }

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

function qrToImageDataGeneric(imgData, qr, opts) {
  const size = qr.modules.size
  const scale = getScale(size, opts)
  const symbolSize = Math.floor((size + opts.margin * 2) * scale)
  const scaledMargin = opts.margin * scale
  const light = opts.color.light
  const dark = opts.color.dark

  for (let y = 0; y < symbolSize; y++) {
    const rowOffset4 = y * symbolSize * 4

    for (let x = 0; x < symbolSize; x++) {
      const posDst = rowOffset4 + x * 4
      const pxColor = getShapePixelColor(qr, x, y, scale, scaledMargin, light, dark)

      imgData[posDst] = pxColor.r
      imgData[posDst + 1] = pxColor.g
      imgData[posDst + 2] = pxColor.b
      imgData[posDst + 3] = pxColor.a
    }
  }
}

export function qrToImageData(imgData, qr, opts) {
  if (imgData instanceof Uint8ClampedArray) {
    qrToImageDataClamped(imgData, qr, opts)
    return
  }

  qrToImageDataByte(imgData, qr, opts)
}

export default { getOptions, getScale, getImageWidth, qrToImageData };
