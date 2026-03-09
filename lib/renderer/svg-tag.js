import Utils from '#lib/renderer/utils';

const OPACITY = new Array(256)
for (let i = 0; i < 256; i++) {
  OPACITY[i] = (i / 255).toFixed(2).slice(1)
}

const FILL_ATTR_CACHE = new WeakMap()
const STROKE_ATTR_CACHE = new WeakMap()
const CIRCLE_RADIUS = 0.55
const ROUNDED_RECT_RADIUS = 0.2

function getColorAttrib (color, attrib) {
  const cache = attrib === 'fill' ? FILL_ATTR_CACHE : STROKE_ATTR_CACHE
  const cached = cache.get(color)
  if (cached) return cached

  const str = color.a < 255
    ? attrib + '="' + color.hex + '" ' + attrib + '-opacity="' + OPACITY[color.a] + '"'
    : attrib + '="' + color.hex + '"'

  cache.set(color, str)
  return str
}

function qrToPath (data, size, margin) {
  let path = ''

  for (let row = 0; row < size; row++) {
    const rowOffset = row * size
    const rowY = row + margin + 0.5
    let col = 0

    while (col < size && !data[rowOffset + col]) col++
    if (col === size) continue

    path += 'M' + (col + margin) + ' ' + rowY

    while (col < size) {
      const runStart = col
      while (col < size && data[rowOffset + col]) col++
      path += 'h' + (col - runStart)

      const gapStart = col
      while (col < size && !data[rowOffset + col]) col++
      if (col < size) {
        path += 'm' + (col - gapStart) + ' 0'
      }
    }
  }

  return path
}

function qrToCircles (data, size, margin) {
  const circles = []

  for (let row = 0; row < size; row++) {
    const rowOffset = row * size
    const cy = row + margin + 0.5

    for (let col = 0; col < size; col++) {
      if (!data[rowOffset + col]) continue
      circles.push('<circle cx="' + (col + margin + 0.5) + '" cy="' + cy + '" r="' + CIRCLE_RADIUS + '"/>')
    }
  }

  return circles.join('')
}

function qrToRoundedPath (data, size, margin) {
  let path = ''

  for (let row = 0; row < size; row++) {
    const rowOffset = row * size
    const y = row + margin

    for (let col = 0; col < size; col++) {
      if (!data[rowOffset + col]) continue

      const x = col + margin
      const top = row > 0 && data[rowOffset - size + col]
      const right = col < size - 1 && data[rowOffset + col + 1]
      const bottom = row < size - 1 && data[rowOffset + size + col]
      const left = col > 0 && data[rowOffset + col - 1]

      const tl = !top && !left ? ROUNDED_RECT_RADIUS : 0
      const tr = !top && !right ? ROUNDED_RECT_RADIUS : 0
      const br = !bottom && !right ? ROUNDED_RECT_RADIUS : 0
      const bl = !bottom && !left ? ROUNDED_RECT_RADIUS : 0

      path += 'M' + (x + tl) + ' ' + y
      path += 'H' + (x + 1 - tr)
      if (tr) path += 'A' + tr + ' ' + tr + ' 0 0 1 ' + (x + 1) + ' ' + (y + tr)
      path += 'V' + (y + 1 - br)
      if (br) path += 'A' + br + ' ' + br + ' 0 0 1 ' + (x + 1 - br) + ' ' + (y + 1)
      path += 'H' + (x + bl)
      if (bl) path += 'A' + bl + ' ' + bl + ' 0 0 1 ' + x + ' ' + (y + 1 - bl)
      path += 'V' + (y + tl)
      if (tl) path += 'A' + tl + ' ' + tl + ' 0 0 1 ' + (x + tl) + ' ' + y
      path += 'Z'
    }
  }

  return path
}

export function render(qrData, options, cb) {
  const opts = Utils.getOptions(options)
  const lightColor = opts.color.light
  const darkColor = opts.color.dark
  const size = qrData.modules.size
  const data = qrData.modules.data
  const qrcodesize = size + opts.margin * 2

  const bg = !lightColor.a
    ? ''
    : '<path ' + getColorAttrib(lightColor, 'fill') +
      ' d="M0 0h' + qrcodesize + 'v' + qrcodesize + 'H0z"/>'

  let shape
  if (opts.shape === 'circle') {
    shape = '<g ' + getColorAttrib(darkColor, 'fill') + '>' +
      qrToCircles(data, size, opts.margin) +
      '</g>'
  } else if (opts.shape === 'rounded') {
    shape = '<path ' + getColorAttrib(darkColor, 'fill') +
      ' d="' + qrToRoundedPath(data, size, opts.margin) + '"/>'
  } else {
    shape = '<path ' + getColorAttrib(darkColor, 'stroke') +
      ' d="' + qrToPath(data, size, opts.margin) + '"/>'
  }

  const viewBox = 'viewBox="' + '0 0 ' + qrcodesize + ' ' + qrcodesize + '"'

  const width = !opts.width ? '' : 'width="' + opts.width + '" height="' + opts.width + '" '
  const shapeRendering = opts.shape === 'square' ? ' shape-rendering="crispEdges"' : ''

  const svgTag = '<svg xmlns="http://www.w3.org/2000/svg" ' + width + viewBox + shapeRendering + '>' + bg + shape + '</svg>\n'

  if (typeof cb === 'function') {
    cb(null, svgTag)
  }

  return svgTag
}

export default { render };
