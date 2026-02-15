import QRCode from './core/qrcode.js';
import PngRenderer from './renderer/png.js';
import Utf8Renderer from './renderer/utf8.js';
import SvgRenderer from './renderer/svg.js';

function checkParams (text, opts) {
  if (typeof text === 'undefined') {
    throw new Error('String required as first argument')
  }

  return {
    opts: opts || {}
  }
}

function getTypeFromFilename (path) {
  return path.slice((path.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase()
}

function getRendererFromType (type) {
  switch (type) {
    case 'svg':
      return SvgRenderer

    case 'txt':
    case 'utf8':
      return Utf8Renderer

    case 'png':
    case 'image/png':
    default:
      return PngRenderer
  }
}

function getStringRendererFromType (type) {
  switch (type) {
    case 'svg':
      return SvgRenderer

    case 'utf8':
    default:
      return Utf8Renderer
  }
}

function renderStringSync (renderer, text, opts) {
  const data = QRCode.create(text, opts)
  return renderer.render(data, opts)
}

async function renderAsync (renderFunc, text, opts) {
  const data = QRCode.create(text, opts)

  return await new Promise((resolve, reject) => {
    renderFunc(data, opts, (err, output) => {
      if (err) return reject(err)
      resolve(output)
    })
  })
}

export const create = QRCode.create;

export async function toString(text, opts) {
  const params = checkParams(text, opts)
  const type = params.opts ? params.opts.type : undefined
  const renderer = getStringRendererFromType(type)

  if (renderer === SvgRenderer || renderer === Utf8Renderer) {
    return renderStringSync(renderer, text, params.opts)
  }

  return renderAsync(renderer.render, text, params.opts)
}

export async function toDataURL(text, opts) {
  const params = checkParams(text, opts)
  const renderer = getRendererFromType(params.opts.type)
  return renderAsync(renderer.renderToDataURL, text, params.opts)
}

export async function toBuffer(text, opts) {
  const params = checkParams(text, opts)
  const renderer = getRendererFromType(params.opts.type)
  return renderAsync(renderer.renderToBuffer, text, params.opts)
}

export async function toFile(path, text, opts) {
  if (typeof path !== 'string' || !(typeof text === 'string' || typeof text === 'object')) {
    throw new Error('Invalid argument')
  }

  const params = checkParams(text, opts)
  const type = params.opts.type || getTypeFromFilename(path)
  const renderer = getRendererFromType(type)
  const renderToFile = renderer.renderToFile.bind(null, path)

  return renderAsync(renderToFile, text, params.opts)
}

export async function toFileStream(stream, text, opts) {
  if (typeof text === 'undefined') {
    throw new Error('Too few arguments provided')
  }

  const params = checkParams(text, opts)
  const renderer = getRendererFromType('png') // Only png support for now
  const data = QRCode.create(text, params.opts)
  renderer.renderToFileStream(stream, data, params.opts)
}

export default { toString, toDataURL, toBuffer, toFile, toFileStream, create };
