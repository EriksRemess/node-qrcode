import { test } from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import jsQR from 'jsqr'
import QRCode from '#lib/index'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

test('toString', async (t) => {
  await t.assert.rejects(() => QRCode.toString(), 'Should reject if text is not provided')

  const str = await QRCode.toString('some text')
  t.assert.strictEqual(typeof str, 'string', 'Should return a string')

  const strWithOptions = await QRCode.toString('some text', { errorCorrectionLevel: 'L' })
  t.assert.strictEqual(typeof strWithOptions, 'string', 'Should return a string with options')
  t.assert.strictEqual(typeof QRCode.toString('some text').then, 'function', 'Should return a promise')
})

test('toString input matches output deterministically', async (t) => {
  const first = await QRCode.toString('input-a', { type: 'svg', errorCorrectionLevel: 'M' })
  const firstAgain = await QRCode.toString('input-a', { type: 'svg', errorCorrectionLevel: 'M' })
  const second = await QRCode.toString('input-b', { type: 'svg', errorCorrectionLevel: 'M' })

  t.assert.strictEqual(first, firstAgain, 'Same input should generate the same output')
  t.assert.notStrictEqual(first, second, 'Different input should generate different output')
})

test('toString svg', async (t) => {
  const file = path.join(__dirname, '/svgtag.expected.out')
  const expectedSvg = await fs.promises.readFile(file, 'utf8')

  await QRCode.toString('http://www.google.com', {
    version: 1,
    errorCorrectionLevel: 'H',
    type: 'svg'
  }).then(
    () => t.assert.fail('Expected version error'),
    (err) => t.assert.ok(err, 'there should be an error')
  )

  const svg = await QRCode.toString('http://www.google.com', {
    errorCorrectionLevel: 'H',
    type: 'svg'
  })
  t.assert.strictEqual(svg, expectedSvg, 'should output a valid svg')
})

test('toString svg circle decodes to input', async (t) => {
  const input = 'svg-circle-roundtrip'
  const rawSvg = await QRCode.toString(input, {
    errorCorrectionLevel: 'H',
    type: 'svg',
    shape: 'circle',
    margin: 4
  })

  t.assert.match(rawSvg, /<circle\b/, 'SVG should include circle elements')

  const viewBoxMatch = rawSvg.match(/viewBox="0 0 (\d+) (\d+)"/)
  t.assert.ok(viewBoxMatch, 'SVG should include a viewBox')

  const width = Number.parseInt(viewBoxMatch[1], 10)
  const height = Number.parseInt(viewBoxMatch[2], 10)
  const scale = 12
  const rasterWidth = width * scale
  const rasterHeight = height * scale
  const pixels = new Uint8ClampedArray(rasterWidth * rasterHeight * 4)

  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = 255
    pixels[i + 1] = 255
    pixels[i + 2] = 255
    pixels[i + 3] = 255
  }

  const setPixel = (x, y, color) => {
    if (x < 0 || y < 0 || x >= rasterWidth || y >= rasterHeight) return
    const offset = (y * rasterWidth + x) * 4
    pixels[offset] = color
    pixels[offset + 1] = color
    pixels[offset + 2] = color
    pixels[offset + 3] = 255
  }

  const circleRegex = /<circle[^>]*cx="([^"]+)"[^>]*cy="([^"]+)"[^>]*r="([^"]+)"\/>/g
  let circleCount = 0
  let match

  while ((match = circleRegex.exec(rawSvg)) !== null) {
    circleCount++

    const cx = Number.parseFloat(match[1])
    const cy = Number.parseFloat(match[2])
    const r = Number.parseFloat(match[3])
    const minX = Math.max(0, Math.floor((cx - r) * scale))
    const maxX = Math.min(rasterWidth, Math.ceil((cx + r) * scale))
    const minY = Math.max(0, Math.floor((cy - r) * scale))
    const maxY = Math.min(rasterHeight, Math.ceil((cy + r) * scale))

    for (let y = minY; y < maxY; y++) {
      const svgY = (y + 0.5) / scale
      const dy = svgY - cy

      for (let x = minX; x < maxX; x++) {
        const svgX = (x + 0.5) / scale
        const dx = svgX - cx

        if (dx * dx + dy * dy <= r * r) {
          setPixel(x, y, 0)
        }
      }
    }
  }

  t.assert.ok(circleCount > 0, 'SVG should render at least one circle')

  const decoded = jsQR(pixels, rasterWidth, rasterHeight, {
    inversionAttempts: 'dontInvert'
  })

  t.assert.ok(decoded, 'Circle SVG should be decodable')
  t.assert.strictEqual(decoded.data, input, 'Decoded text should match encoded input')
})

test('toString svg rounded decodes to input', async (t) => {
  const input = 'svg-rounded-roundtrip'
  const rawSvg = await QRCode.toString(input, {
    errorCorrectionLevel: 'H',
    type: 'svg',
    shape: 'rounded',
    margin: 4
  })

  t.assert.match(rawSvg, /<path[^>]*fill="[^"]+"[^>]*d="[^"]*A0\.14 0\.14 0 0 1/, 'SVG should include rounded path commands')

  const viewBoxMatch = rawSvg.match(/viewBox="0 0 (\d+) (\d+)"/)
  t.assert.ok(viewBoxMatch, 'SVG should include a viewBox')

  const width = Number.parseInt(viewBoxMatch[1], 10)
  const height = Number.parseInt(viewBoxMatch[2], 10)
  const qrData = QRCode.create(input, { errorCorrectionLevel: 'H' })
  const qrSize = qrData.modules.size
  const margin = (width - qrSize) / 2
  const radius = 0.14
  const scale = 12
  const rasterWidth = width * scale
  const rasterHeight = height * scale
  const pixels = new Uint8ClampedArray(rasterWidth * rasterHeight * 4)

  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = 255
    pixels[i + 1] = 255
    pixels[i + 2] = 255
    pixels[i + 3] = 255
  }

  const setPixel = (x, y, color) => {
    if (x < 0 || y < 0 || x >= rasterWidth || y >= rasterHeight) return
    const offset = (y * rasterWidth + x) * 4
    pixels[offset] = color
    pixels[offset + 1] = color
    pixels[offset + 2] = color
    pixels[offset + 3] = 255
  }

  const isInsideRoundedModule = (localX, localY, tl, tr, br, bl) => {
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

  let roundedCount = 0

  for (let row = 0; row < qrSize; row++) {
    const rowOffset = row * qrSize

    for (let col = 0; col < qrSize; col++) {
      if (!qrData.modules.data[rowOffset + col]) continue
      roundedCount++

      const x = margin + col
      const y = margin + row
      const top = row > 0 && qrData.modules.data[rowOffset - qrSize + col]
      const right = col < qrSize - 1 && qrData.modules.data[rowOffset + col + 1]
      const bottom = row < qrSize - 1 && qrData.modules.data[rowOffset + qrSize + col]
      const left = col > 0 && qrData.modules.data[rowOffset + col - 1]
      const tl = !top && !left ? radius : 0
      const tr = !top && !right ? radius : 0
      const br = !bottom && !right ? radius : 0
      const bl = !bottom && !left ? radius : 0
      const minX = Math.max(0, Math.floor(x * scale))
      const maxX = Math.min(rasterWidth, Math.ceil((x + 1) * scale))
      const minY = Math.max(0, Math.floor(y * scale))
      const maxY = Math.min(rasterHeight, Math.ceil((y + 1) * scale))

      for (let yy = minY; yy < maxY; yy++) {
        const localY = (yy + 0.5) / scale - y

        for (let xx = minX; xx < maxX; xx++) {
          const localX = (xx + 0.5) / scale - x

          if (isInsideRoundedModule(localX, localY, tl, tr, br, bl)) {
            setPixel(xx, yy, 0)
          }
        }
      }
    }
  }

  t.assert.ok(roundedCount > 0, 'SVG should render at least one rounded module')

  const decoded = jsQR(pixels, rasterWidth, rasterHeight, {
    inversionAttempts: 'dontInvert'
  })

  t.assert.ok(decoded, 'Rounded SVG should be decodable')
  t.assert.strictEqual(decoded.data, input, 'Decoded text should match encoded input')
})

test('toString svg with centered image decodes to input', async (t) => {
  const input = 'svg-roundtrip-with-center-image'
  const rawSvg = await QRCode.toString(input, {
    errorCorrectionLevel: 'H',
    type: 'svg',
    margin: 2
  })

  const viewBoxMatch = rawSvg.match(/viewBox="0 0 (\d+) (\d+)"/)
  t.assert.ok(viewBoxMatch, 'SVG should include a viewBox')

  const width = Number.parseInt(viewBoxMatch[1], 10)
  const height = Number.parseInt(viewBoxMatch[2], 10)
  const imageSize = Math.floor(Math.min(width, height) * 0.16)
  const x = Math.floor((width - imageSize) / 2)
  const y = Math.floor((height - imageSize) / 2)

  const whitePixelPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+X2fQAAAAASUVORK5CYII='
  const imageOverlay = '<image x="' + x + '" y="' + y + '" width="' + imageSize + '" height="' + imageSize + '" href="' + whitePixelPng + '" preserveAspectRatio="none"/>'
  const svgWithImage = rawSvg.replace('</svg>\n', imageOverlay + '</svg>\n')

  const scale = 6
  const rasterWidth = width * scale
  const rasterHeight = height * scale
  const pixels = new Uint8ClampedArray(rasterWidth * rasterHeight * 4)

  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = 255
    pixels[i + 1] = 255
    pixels[i + 2] = 255
    pixels[i + 3] = 255
  }

  const darkPathMatch = svgWithImage.match(/<path[^>]*stroke="[^"]+"[^>]*d="([^"]+)"\/>/)
  t.assert.ok(darkPathMatch, 'SVG should include dark path data')

  const setModule = (moduleX, moduleY, dark) => {
    if (moduleX < 0 || moduleY < 0 || moduleX >= width || moduleY >= height) return

    const color = dark ? 0 : 255
    const baseX = moduleX * scale
    const baseY = moduleY * scale

    for (let yy = 0; yy < scale; yy++) {
      const rowOffset = ((baseY + yy) * rasterWidth + baseX) * 4
      for (let xx = 0; xx < scale; xx++) {
        const p = rowOffset + xx * 4
        pixels[p] = color
        pixels[p + 1] = color
        pixels[p + 2] = color
        pixels[p + 3] = 255
      }
    }
  }

  const commandRegex = /([Mmh])(-?\d+(?:\.\d+)?)(?:\s(-?\d+(?:\.\d+)?))?/g
  let currentX = 0
  let currentY = 0
  let match

  while ((match = commandRegex.exec(darkPathMatch[1])) !== null) {
    const cmd = match[1]
    const a = Number.parseFloat(match[2])
    const b = typeof match[3] === 'undefined' ? undefined : Number.parseFloat(match[3])

    if (cmd === 'M') {
      currentX = a
      currentY = b
      continue
    }

    if (cmd === 'm') {
      currentX += a
      currentY += b
      continue
    }

    if (cmd === 'h') {
      const moduleY = Math.floor(currentY)
      for (let dx = 0; dx < a; dx++) {
        setModule(Math.floor(currentX) + dx, moduleY, true)
      }
      currentX += a
    }
  }

  for (let moduleY = y; moduleY < y + imageSize; moduleY++) {
    for (let moduleX = x; moduleX < x + imageSize; moduleX++) {
      setModule(moduleX, moduleY, false)
    }
  }

  const decoded = jsQR(pixels, rasterWidth, rasterHeight, {
    inversionAttempts: 'dontInvert'
  })

  t.assert.ok(decoded, 'SVG with centered image should be decodable')
  t.assert.strictEqual(decoded.data, input, 'Decoded text should match encoded input')
})

test('toString utf8', async (t) => {
  const expectedUtf8 = [
    '                                 ',
    '                                 ',
    '    █▀▀▀▀▀█ █ ▄█  ▀ █ █▀▀▀▀▀█    ',
    '    █ ███ █ ▀█▄▀▄█ ▀▄ █ ███ █    ',
    '    █ ▀▀▀ █ ▀▄ ▄ ▄▀ █ █ ▀▀▀ █    ',
    '    ▀▀▀▀▀▀▀ ▀ ▀ █▄▀ █ ▀▀▀▀▀▀▀    ',
    '    ▀▄ ▀▀▀▀█▀▀█▄ ▄█▄▀█ ▄█▄██▀    ',
    '    █▄ ▄▀▀▀▄▄█ █▀▀▄█▀ ▀█ █▄▄█    ',
    '    █▄ ▄█▄▀█▄▄  ▀ ▄██▀▀ ▄  ▄▀    ',
    '    █▀▄▄▄▄▀▀█▀▀█▀▀▀█ ▀ ▄█▀█▀█    ',
    '    ▀ ▀▀▀▀▀▀███▄▄▄▀ █▀▀▀█ ▀█     ',
    '    █▀▀▀▀▀█ █▀█▀▄ ▄▄█ ▀ █▀ ▄█    ',
    '    █ ███ █ █ █ ▀▀██▀███▀█ ██    ',
    '    █ ▀▀▀ █  █▀ ▀ █ ▀▀▄██ ███    ',
    '    ▀▀▀▀▀▀▀ ▀▀▀  ▀▀ ▀    ▀  ▀    ',
    '                                 ',
    '                                 '
  ].join('\n')

  await QRCode.toString('http://www.google.com', {
    version: 1,
    errorCorrectionLevel: 'H',
    type: 'utf8'
  }).then(
    () => t.assert.fail('Expected version error'),
    (err) => t.assert.ok(err, 'there should be an error')
  )

  const utf8 = await QRCode.toString('http://www.google.com', {
    errorCorrectionLevel: 'M',
    type: 'utf8'
  })
  t.assert.strictEqual(utf8, expectedUtf8, 'should output a valid symbol')

  const utf8Default = await QRCode.toString('http://www.google.com')
  t.assert.strictEqual(utf8Default, expectedUtf8, 'Should output a valid symbol with default options')
})

test('toString byte-input', async (t) => {
  const expectedOutput = [
    '                             ',
    '                             ',
    '    █▀▀▀▀▀█  █▄█▀ █▀▀▀▀▀█    ',
    '    █ ███ █ ▀█ █▀ █ ███ █    ',
    '    █ ▀▀▀ █   ▀ █ █ ▀▀▀ █    ',
    '    ▀▀▀▀▀▀▀ █▄▀▄█ ▀▀▀▀▀▀▀    ',
    '    ▀██▄██▀▀▀█▀▀ ▀█  ▄▀▄     ',
    '    ▀█▀▄█▄▀▄ ██ ▀ ▄ ▀▄  ▀    ',
    '    ▀ ▀ ▀▀▀▀█▄ ▄▀▄▀▄▀▄▀▄▀    ',
    '    █▀▀▀▀▀█ █  █▄█▀█▄█  ▀    ',
    '    █ ███ █ ▀█▀▀ ▀██  ▀█▀    ',
    '    █ ▀▀▀ █ ██▀ ▀ ▄ ▀▄▀▄▀    ',
    '    ▀▀▀▀▀▀▀ ▀▀▀ ▀ ▀▀▀ ▀▀▀    ',
    '                             ',
    '                             '
  ].join('\n')
  const byteInput = new Uint8ClampedArray([1, 2, 3, 4, 5])

  const code = await QRCode.toString([{ data: byteInput, mode: 'byte' }], { errorCorrectionLevel: 'L' })
  t.assert.strictEqual(code, expectedOutput, 'should output the correct code')
})
