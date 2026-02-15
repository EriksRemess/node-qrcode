# node-qrcode

Node.js QR code/2D barcode generator.

- Node.js module API
- Save QR codes as PNG, SVG, UTF-8 string, or Data URL
- Supports Numeric, Alphanumeric, Kanji, and Byte modes
- Supports mixed/manual segments and multibyte text

## Installation

```sh
npm install qrcode
```

## Usage

```js
import QRCode from 'qrcode'

const url = await QRCode.toDataURL('I am a pony!')
console.log(url)
```

### Promise / async usage

```js
import QRCode from 'qrcode'

async function generate (text) {
  return QRCode.toDataURL(text)
}
```

## API

- `create(text, [options])`
- `toDataURL(text, [options])`
- `toString(text, [options])`
- `toFile(path, text, [options])`
- `toFileStream(stream, text, [options])`

## Node.js API details

### `create(text, [options])`
Creates and returns a QRCode object.

### `toDataURL(text, [options])`
Returns a Promise resolving to a Data URI containing the QR image (PNG).

### `toString(text, [options])`
Returns a Promise resolving to a string representation of the QR code.

Supported `options.type` values:
- `utf8`
- `svg`

### `toFile(path, text, [options])`
Returns a Promise that resolves after writing a QR code to a file.

### `toFileStream(stream, text, [options])`
Writes a QR code PNG to a writable stream.

## Options

Common options include:

- `errorCorrectionLevel`: `L`, `M`, `Q`, `H` (default `M`)
- `version`: integer `1` to `40`
- `maskPattern`: integer `0` to `7`
- `margin`: quiet-zone size
- `width` / `scale`
- `color.dark` / `color.light` (RGBA hex)
- `type`: renderer output type

## Binary data

For byte data, pass a `Uint8ClampedArray`, compatible array, or Node.js `Buffer`:

```js
import QRCode from 'qrcode'

await QRCode.toFile(
  'foo.png',
  [{ data: Buffer.from([253, 254, 255]), mode: 'byte' }]
)
```

## Kanji / Shift JIS support

To enable optimized Kanji mode, provide a `toSJISFunc` converter:

```js
import QRCode from 'qrcode'
import toSJIS from 'qrcode/helper/to-sjis.js'

const url = await QRCode.toDataURL('漢字', { toSJISFunc: toSJIS })
console.log(url)
```

## License

MIT
