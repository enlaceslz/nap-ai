const sharp = require('sharp');

const size1 = 192;
const size2 = 512;
const bg = '#1d4ed8'; // blue-700
const fg = '#ffffff';

// Generate 192x192
sharp({
  create: { width: size1, height: size1, channels: 4, background: bg }
})
.composite([{
  input: Buffer.from(`<svg width="${size1}" height="${size1}"><text x="50%" y="50%" font-family="sans-serif" font-weight="bold" font-size="${size1/2}" fill="${fg}" text-anchor="middle" dominant-baseline="central">P</text></svg>`),
  top: 0, left: 0
}])
.png()
.toFile('public/pwa-192x192.png');

// Generate 512x512
sharp({
  create: { width: size2, height: size2, channels: 4, background: bg }
})
.composite([{
  input: Buffer.from(`<svg width="${size2}" height="${size2}"><text x="50%" y="50%" font-family="sans-serif" font-weight="bold" font-size="${size2/2}" fill="${fg}" text-anchor="middle" dominant-baseline="central">P</text></svg>`),
  top: 0, left: 0
}])
.png()
.toFile('public/pwa-512x512.png');

// Generate maskable
sharp({
  create: { width: size2, height: size2, channels: 4, background: bg }
})
.composite([{
  input: Buffer.from(`<svg width="${size2}" height="${size2}"><circle cx="256" cy="256" r="200" fill="#000000" opacity="0.1"/><text x="50%" y="50%" font-family="sans-serif" font-weight="bold" font-size="${size2/2.5}" fill="${fg}" text-anchor="middle" dominant-baseline="central">P</text></svg>`),
  top: 0, left: 0
}])
.png()
.toFile('public/pwa-maskable-512x512.png');

// Generate apple touch icon
sharp({
  create: { width: 180, height: 180, channels: 4, background: bg }
})
.composite([{
  input: Buffer.from(`<svg width="180" height="180"><text x="50%" y="50%" font-family="sans-serif" font-weight="bold" font-size="90" fill="${fg}" text-anchor="middle" dominant-baseline="central">P</text></svg>`),
  top: 0, left: 0
}])
.png()
.toFile('public/apple-touch-icon.png');

// Generate SVG icon
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${bg}" rx="100" ry="100"/><text x="50%" y="50%" font-family="sans-serif" font-weight="bold" font-size="256" fill="${fg}" text-anchor="middle" dominant-baseline="central">P</text></svg>`;
require('fs').writeFileSync('public/icon.svg', svgIcon);

console.log('Icons generated successfully');
