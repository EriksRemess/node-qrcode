import Utils from './utils.js';

const OPACITY = new Array(256)
for (let i = 0; i < 256; i++) {
  OPACITY[i] = (i / 255).toFixed(2).slice(1)
}

const FILL_ATTR_CACHE = new WeakMap()
const STROKE_ATTR_CACHE = new WeakMap()

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

  const path =
    '<path ' + getColorAttrib(darkColor, 'stroke') +
    ' d="' + qrToPath(data, size, opts.margin) + '"/>'

  const viewBox = 'viewBox="' + '0 0 ' + qrcodesize + ' ' + qrcodesize + '"'

  const width = !opts.width ? '' : 'width="' + opts.width + '" height="' + opts.width + '" '

  const svgTag = '<svg xmlns="http://www.w3.org/2000/svg" ' + width + viewBox + ' shape-rendering="crispEdges">' + bg + path + '</svg>\n'

  if (typeof cb === 'function') {
    cb(null, svgTag)
  }

  return svgTag
}

export default { render };
