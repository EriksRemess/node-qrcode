import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { Parser } from 'htmlparser2'
import QRCode from '#lib/core/qrcode'
import SvgRenderer from '#lib/renderer/svg'
function getExpectedViewbox (size, margin) {
  const expectedQrCodeSize = size + margin * 2
  return '0 0 ' + expectedQrCodeSize + ' ' + expectedQrCodeSize
}

function testSvgFragment (t, svgFragment, expectedTags) {
  return new Promise((resolve, reject) => {
    const parser = new Parser({
      onopentag: (name, attribs) => {
        const tag = expectedTags.shift()

        assert.strictEqual(tag.name, name,
          'Should have a ' + tag.name + ' tag')

        tag.attribs.forEach((attr) => {
          assert.strictEqual(attribs[attr.name], attr.value.toString(),
            'Should have attrib ' + attr.name + ' with value ' + attr.value)
        })
      },

      onend: () => {
        resolve()
      },

      onerror: (e) => {
        reject(e)
      }
    }, { decodeEntities: true })

    parser.write(svgFragment)
    parser.end()
  })
}

function buildTest (t, data, opts, expectedTags) {
  const svg = SvgRenderer.render(data, opts)
  return testSvgFragment(t, svg, expectedTags.slice())
}

test('svgrender interface', () => {
  assert.strictEqual(typeof SvgRenderer.render, 'function',
    'Should have render function')

  assert.strictEqual(typeof SvgRenderer.renderToFile, 'function',
    'Should have renderToFile function')
})

test('Svg render', (t) => {
  const tests = []

  const data = QRCode.create('sample text', { version: 2 })
  const size = data.modules.size

  tests.push(buildTest(t, data, {
    scale: 4,
    margin: 4,
    color: {
      light: '#ffffff80'
    }
  }, [
    {
      name: 'svg',
      attribs: [
        { name: 'viewbox', value: getExpectedViewbox(size, 4) }
      ]
    },
    {
      name: 'path',
      attribs: [
        { name: 'fill', value: '#ffffff' },
        { name: 'fill-opacity', value: '.50' }
      ]
    },
    {
      name: 'path',
      attribs: [
        { name: 'stroke', value: '#000000' }
      ]
    }
  ]))

  tests.push(buildTest(t, data, {
    scale: 0,
    margin: 8,
    color: {
      light: '#0000',
      dark: '#00000080'
    }
  }, [
    {
      name: 'svg',
      attribs: [
        { name: 'viewbox', value: getExpectedViewbox(size, 8) }
      ]
    },
    {
      name: 'path',
      attribs: [
        { name: 'stroke', value: '#000000' },
        { name: 'stroke-opacity', value: '.50' }
      ]
    }
  ]))

  tests.push(buildTest(t, data, {}, [
    {
      name: 'svg',
      attribs: [
        { name: 'viewbox', value: getExpectedViewbox(size, 4) }
      ]
    },
    { name: 'path', attribs: [{ name: 'fill', value: '#ffffff' }] },
    { name: 'path', attribs: [{ name: 'stroke', value: '#000000' }] }
  ]))

  tests.push(buildTest(t, data, { width: 250 }, [
    {
      name: 'svg',
      attribs: [
        { name: 'width', value: '250' },
        { name: 'height', value: '250' },
        { name: 'viewbox', value: getExpectedViewbox(size, 4) }
      ]
    },
    { name: 'path', attribs: [{ name: 'fill', value: '#ffffff' }] },
    { name: 'path', attribs: [{ name: 'stroke', value: '#000000' }] }
  ]))

  return Promise.all(tests)
})

test('Svg renderToFile', async () => {
  const sampleQrData = QRCode.create('sample text', { version: 2 })
  const fileName = 'qrimage.svg'
  const writeCalls = []
  let fsStub = mock.method(fs, 'writeFile', (file, data, cb) => {
    writeCalls.push(file)
    cb()
  })

  await new Promise((resolve, reject) => {
    SvgRenderer.renderToFile(fileName, sampleQrData, (err) => {
      try {
        assert.ok(!err,
          'Should not generate errors with only qrData param')
        assert.strictEqual(writeCalls[0], fileName,
          'Should save file with correct file name')
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  })

  await new Promise((resolve, reject) => {
    SvgRenderer.renderToFile(fileName, sampleQrData, {
      margin: 10,
      scale: 1
    }, (err) => {
      try {
        assert.ok(!err,
          'Should not generate errors with options param')
        assert.strictEqual(writeCalls[1], fileName,
          'Should save file with correct file name')
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  })

  fsStub.mock.restore()
  fsStub = mock.method(fs, 'writeFile', (file, data, cb) => {
    cb(new Error())
  })

  await new Promise((resolve, reject) => {
    SvgRenderer.renderToFile(fileName, sampleQrData, (err) => {
      try {
        assert.ok(err,
          'Should fail if error occurs during save')
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  })

  fsStub.mock.restore()
})
