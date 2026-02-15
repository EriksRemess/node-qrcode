import fs from 'node:fs';
import {PNG} from 'pngjs';
import Utils from '#lib/renderer/utils';

function createPngContext (qrData, options) {
  const opts = Utils.getOptions(options)
  const rendererOpts = opts.rendererOpts || {}
  const size = Utils.getImageWidth(qrData.modules.size, opts)
  const fastPng = rendererOpts.fastPng === true
  const pngOpts = {}

  for (const key in rendererOpts) {
    if (key !== 'fastPng') {
      pngOpts[key] = rendererOpts[key]
    }
  }

  pngOpts.width = size
  pngOpts.height = size

  const pngImage = new PNG(pngOpts)
  Utils.qrToImageData(pngImage.data, qrData, opts)

  return { pngImage, fastPng }
}

export function render(qrData, options) {
  return createPngContext(qrData, options).pngImage
}

export function renderToDataURL(qrData, options, cb) {
  if (typeof cb === 'undefined') {
    cb = options
    options = undefined
  }

  renderToBuffer(qrData, options, function (err, output) {
    if (err) cb(err)
    const url = 'data:image/png;base64,' + output.toString('base64')
    cb(null, url)
  })
}

export function renderToBuffer(qrData, options, cb) {
  if (typeof cb === 'undefined') {
    cb = options
    options = undefined
  }

  const context = createPngContext(qrData, options)
  const png = context.pngImage

  if (context.fastPng) {
    try {
      cb(null, PNG.sync.write(png))
    } catch (err) {
      cb(err)
    }
    return
  }

  const chunks = []
  let totalLength = 0

  png.on('error', cb)

  png.on('data', function (data) {
    chunks.push(data)
    totalLength += data.length
  })

  png.on('end', function () {
    cb(null, Buffer.concat(chunks, totalLength))
  })

  png.pack()
}

export function renderToFile(path, qrData, options, cb) {
  if (typeof cb === 'undefined') {
    cb = options
    options = undefined
  }

  let called = false
  const done = (...args) => {
    if (called) return
    called = true
    cb.apply(null, args)
  }
  const stream = fs.createWriteStream(path)

  stream.on('error', done)
  stream.on('close', done)

  renderToFileStream(stream, qrData, options)
}

export function renderToFileStream(stream, qrData, options) {
  const png = render(qrData, options)
  png.pack().pipe(stream)
}

export default { render, renderToDataURL, renderToBuffer, renderToFile, renderToFileStream };
