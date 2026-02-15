import QRCode from '#lib/index'

const path = './tmp.png'

await QRCode.toFile(path, 'life of the party bros', {
  color: {
    dark: '#00F', // Blue modules
    light: '#0000' // Transparent background
  }
})

console.log('saved.')
