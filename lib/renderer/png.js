import fs from 'node:fs';
import { isWritable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import Utils from '#lib/renderer/utils';

let PNG
try {
  PNG = (await import('@eriksremess/pngjs/native')).PNG
} catch {
  // Keep PNG and the other renderers available without a matching native addon.
  PNG = (await import('@eriksremess/pngjs')).PNG
}
export { PNG }

function createPngContext(qrData, options) {
  const opts = Utils.getOptions(options)
  const rendererOpts = opts.rendererOpts || {}
  const size = Utils.getImageWidth(qrData.modules.size, opts)
  const pngDefaults = {
    deflateLevel: 6,
    deflateStrategy: 3, // Z_RLE
    fastFilter: true,
    filterType: 2,
    strip: true,
    fastCompression: true
  }
  const pngOpts = { ...pngDefaults, ...rendererOpts }

  pngOpts.width = size
  pngOpts.height = size

  const pngImage = new PNG(pngOpts)
  Utils.qrToImageData(pngImage.data, qrData, opts)

  return { pngImage }
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
    if (err) return cb(err)
    const url = 'data:image/png;base64,' + output.toString('base64')
    cb(null, url)
  })
}

export function renderToBuffer(qrData, options, cb) {
  if (typeof cb === 'undefined') {
    cb = options
    options = undefined
  }

  const png = createPngContext(qrData, options).pngImage

  const chunks = []
  let totalLength = 0
  let called = false
  const done = (err, output) => {
    if (called) return
    called = true
    cb(err, output)
  }

  png.on('error', done)

  png.on('data', function (data) {
    chunks.push(data)
    totalLength += data.length
  })

  png.on('end', function () {
    done(null, Buffer.concat(chunks, totalLength))
  })

  png.pack()
}

export function renderToFile(path, qrData, options, cb) {
  if (typeof cb === 'undefined') {
    cb = options
    options = undefined
  }

  // Validate and encode before opening an existing file for writing.
  renderToBuffer(qrData, options, (err, buffer) => {
    if (err) return cb(err)
    try {
      fs.writeFile(path, buffer, cb)
    } catch (error) {
      cb(error)
    }
  })
}

export async function renderToFileStream(stream, qrData, options) {
  if (!isWritable(stream)) {
    throw new TypeError('A writable stream is required')
  }
  const png = render(qrData, options)
  const completion = pipeline(png, stream)
  png.pack()
  return completion
}

export default { render, renderToDataURL, renderToBuffer, renderToFile, renderToFileStream };
