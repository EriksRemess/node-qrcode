import { test } from 'node:test'
import assert from 'node:assert/strict'
import Utils from '#lib/renderer/utils'
test('Utils getOptions', (t) => {
  const defaultOptions = {
    width: undefined,
    scale: 4,
    margin: 4,
    color: {
      dark: { r: 0, g: 0, b: 0, a: 255, hex: '#000000' },
      light: { r: 255, g: 255, b: 255, a: 255, hex: '#ffffff' }
    },
    type: undefined,
    rendererOpts: {}
  }

  assert.ok(Utils.getOptions,
    'getOptions should be defined')

  assert.deepStrictEqual(Utils.getOptions(), defaultOptions,
    'Should return default options if called without param')

  assert.strictEqual(Utils.getOptions({ scale: 8 }).scale, 8,
    'Should return correct scale value')

  assert.strictEqual(Utils.getOptions({ width: 300 }).scale, 4,
    'Should reset scale value to default if width is set')

  assert.strictEqual(Utils.getOptions({ margin: null }).margin, 4,
    'Should return default margin if specified value is null')

  assert.strictEqual(Utils.getOptions({ margin: -1 }).margin, 4,
    'Should return default margin if specified value is < 0')

  assert.strictEqual(Utils.getOptions({ margin: 20 }).margin, 20,
    'Should return correct margin value')

  assert.deepStrictEqual(Utils.getOptions({ color: { dark: '#fff', light: '#000000' } }).color,
    {
      dark: { r: 255, g: 255, b: 255, a: 255, hex: '#ffffff' },
      light: { r: 0, g: 0, b: 0, a: 255, hex: '#000000' }
    },
    'Should return correct colors value from strings')

  assert.deepStrictEqual(Utils.getOptions({ color: { dark: 111, light: 999 } }).color,
    {
      dark: { r: 17, g: 17, b: 17, a: 255, hex: '#111111' },
      light: { r: 153, g: 153, b: 153, a: 255, hex: '#999999' }
    },
    'Should return correct colors value from numbers')

  assert.throws(() => { Utils.getOptions({ color: { dark: true } }) },
    'Should throw if color is not a string')

  assert.throws(() => { Utils.getOptions({ color: { dark: '#aa' } }) },
    'Should throw if color is not in a valid hex format')
})

test('Utils getScale', (t) => {
  const symbolSize = 21

  assert.strictEqual(Utils.getScale(symbolSize, { scale: 5 }), 5,
    'Should return correct scale value')

  assert.strictEqual(Utils.getScale(symbolSize, { width: 50, margin: 2 }), 2,
    'Should calculate correct scale from width and margin')

  assert.strictEqual(Utils.getScale(symbolSize, { width: 21, margin: 2, scale: 4 }), 4,
    'Should return default scale if width is too small to contain the symbol')
})

test('Utils getImageWidth', (t) => {
  const symbolSize = 21

  assert.strictEqual(Utils.getImageWidth(symbolSize, { scale: 5, margin: 0 }), 105,
    'Should return correct width value')

  assert.strictEqual(Utils.getImageWidth(symbolSize, { width: 250, margin: 2 }), 250,
    'Should return specified width value')

  assert.strictEqual(Utils.getImageWidth(symbolSize, { width: 10, margin: 4, scale: 4 }), 116,
    'Should ignore width option if too small to contain the symbol')
})

test('Utils qrToImageData', (t) => {
  assert.ok(Utils.qrToImageData,
    'qrToImageData should be defined')

  const sampleQrData = {
    modules: {
      data: [
        1, 0, 1, 0,
        0, 1, 0, 1,
        1, 0, 1, 0,
        0, 1, 0, 1
      ],
      size: 4
    }
  }

  const margin = 4
  const scale = 2
  const width = 100

  const color = {
    dark: { r: 255, g: 255, b: 255, a: 255 },
    light: { r: 0, g: 0, b: 0, a: 255 }
  }

  const opts = {
    margin: margin,
    scale: scale,
    color: color
  }

  let imageData = []
  const expectedImageSize = (sampleQrData.modules.size + margin * 2) * scale
  let expectedImageDataLength = Math.pow(expectedImageSize, 2) * 4

  Utils.qrToImageData(imageData, sampleQrData, opts)

  assert.strictEqual(imageData.length, expectedImageDataLength,
    'Should return correct imageData length')

  imageData = []
  opts.width = width
  expectedImageDataLength = Math.pow(width, 2) * 4

  Utils.qrToImageData(imageData, sampleQrData, opts)

  assert.strictEqual(imageData.length, expectedImageDataLength,
    'Should return correct imageData length')
})
