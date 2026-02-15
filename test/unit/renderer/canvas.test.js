import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Canvas, createCanvas } from 'canvas'
import QRCode from '#lib/core/qrcode'
import CanvasRenderer from '#lib/renderer/canvas'
test('CanvasRenderer interface', () => {
  assert.strictEqual(typeof CanvasRenderer.render, 'function',
    'Should have render function')

  assert.strictEqual(typeof CanvasRenderer.renderToDataURL, 'function',
    'Should have renderToDataURL function')
})

test('CanvasRenderer render', (t) => {
  // Mock document object
  global.document = {
    createElement: (el) => {
      if (el === 'canvas') {
        return createCanvas(200, 200)
      }
    }
  }

  const sampleQrData = QRCode.create('sample text', { version: 2 })
  let canvasEl

  assert.doesNotThrow(() => { canvasEl = CanvasRenderer.render(sampleQrData) },
    'Should not throw if canvas is not provided')

  assert.ok(canvasEl instanceof Canvas,
    'Should return a new canvas object')

  assert.doesNotThrow(() => {
    canvasEl = CanvasRenderer.render(sampleQrData, {
      margin: 10,
      scale: 1
    })
  }, 'Should not throw with options param')

  // modules: 25, margins: 10 * 2, scale: 1
  assert.strictEqual(canvasEl.width, 25 + 10 * 2,
    'Should have correct size')

  assert.strictEqual(canvasEl.width, canvasEl.height,
    'Should be a square image')

  global.document = undefined

  assert.throws(() => { canvasEl = CanvasRenderer.render(sampleQrData) },
    'Should throw if canvas cannot be created')
})

test('CanvasRenderer render to provided canvas', (t) => {
  const sampleQrData = QRCode.create('sample text', { version: 2 })
  const canvasEl = createCanvas(200, 200)

  assert.doesNotThrow(() => { CanvasRenderer.render(sampleQrData, canvasEl) },
    'Should not throw with only qrData and canvas param')

  assert.doesNotThrow(() => {
    CanvasRenderer.render(sampleQrData, canvasEl, {
      margin: 10,
      scale: 1
    })
  }, 'Should not throw with options param')

  // modules: 25, margins: 10 * 2, scale: 1
  assert.strictEqual(canvasEl.width, 25 + 10 * 2,
    'Should have correct size')

  assert.strictEqual(canvasEl.width, canvasEl.height,
    'Should be a square image')
})

test('CanvasRenderer renderToDataURL', () => {
  // Mock document object
  global.document = {
    createElement: (el) => {
      if (el === 'canvas') {
        return createCanvas(200, 200)
      }
    }
  }

  const sampleQrData = QRCode.create('sample text', { version: 2 })
  let url

  assert.doesNotThrow(() => { url = CanvasRenderer.renderToDataURL(sampleQrData) },
    'Should not throw if canvas is not provided')

  assert.doesNotThrow(() => {
    url = CanvasRenderer.renderToDataURL(sampleQrData, {
      margin: 10,
      scale: 1,
      type: 'image/png'
    })
  }, 'Should not throw with options param')

  assert.strictEqual(typeof url, 'string',
    'Should return a string')

  assert.strictEqual(url.split(',')[0], 'data:image/png;base64',
    'Should have correct header')

  const b64png = url.split(',')[1]
  assert.strictEqual(b64png.length % 4, 0,
    'Should have a correct length')

  global.document = undefined
})

test('CanvasRenderer renderToDataURL to provided canvas', () => {
  const sampleQrData = QRCode.create('sample text', { version: 2 })
  const canvasEl = createCanvas(200, 200)
  let url

  assert.doesNotThrow(() => {
    url = CanvasRenderer.renderToDataURL(sampleQrData, canvasEl)
  }, 'Should not throw with only qrData and canvas param')

  assert.doesNotThrow(() => {
    url = CanvasRenderer.renderToDataURL(sampleQrData, canvasEl, {
      margin: 10,
      scale: 1,
      type: 'image/png'
    })
  }, 'Should not throw with options param')

  assert.strictEqual(typeof url, 'string',
    'Should return a string')

  assert.strictEqual(url.split(',')[0], 'data:image/png;base64',
    'Should have correct header')

  const b64png = url.split(',')[1]
  assert.strictEqual(b64png.length % 4, 0,
    'Should have a correct length')
})
