const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

async function generateIcons() {
  const svgBuffer = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <rect width="512" height="512" rx="80" fill="#6366f1"/>
      <text x="256" y="320" text-anchor="middle" font-family="Arial, sans-serif" font-size="224" font-weight="bold" fill="white">D</text>
      <circle cx="380" cy="132" r="52" fill="#22c55e"/>
    </svg>
  `);

  for (const size of sizes) {
    const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Generated: ${outputPath}`);
  }

  // Generate apple-touch-icon (180x180)
  const appleTouchPath = path.join(__dirname, '../public/apple-touch-icon.png');
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(appleTouchPath);
  console.log(`Generated: ${appleTouchPath}`);

  // Generate maskable icon (with padding for safe zone)
  const maskableSvg = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <rect width="512" height="512" fill="#6366f1"/>
      <text x="256" y="300" text-anchor="middle" font-family="Arial, sans-serif" font-size="180" font-weight="bold" fill="white">D</text>
      <circle cx="350" cy="150" r="40" fill="#22c55e"/>
    </svg>
  `);

  for (const size of [192, 512]) {
    const maskablePath = path.join(iconsDir, `icon-maskable-${size}x${size}.png`);
    await sharp(maskableSvg)
      .resize(size, size)
      .png()
      .toFile(maskablePath);
    console.log(`Generated: ${maskablePath}`);
  }

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
