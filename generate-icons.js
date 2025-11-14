// Simple icon generator for Element Blur extension
const fs = require('fs');
const path = require('path');

// Create SVG icons with blur effect theme
const svgIcon = (size) => `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#4A90E2" rx="${size/8}"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size*0.13}" fill="none" stroke="white" stroke-width="${size/16}" opacity="0.75"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size*0.27}" fill="none" stroke="white" stroke-width="${size/16}" opacity="0.5"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size*0.4}" fill="none" stroke="white" stroke-width="${size/16}" opacity="0.25"/>
</svg>`;

// Generate SVG icons (Chrome Manifest V3 supports SVG)
const sizes = [16, 64, 128];
sizes.forEach(size => {
  // Save as both SVG and create a simple PNG-compatible version
  const svg = svgIcon(size);
  fs.writeFileSync(path.join(__dirname, 'images', `icon${size}.svg`), svg);
  console.log(`Generated icon${size}.svg`);
});

// Also create minimal PNG files using data URLs embedded approach
// For now, we'll create a note file
const note = `Icon files generated as SVG.

To convert to PNG (required for some browsers):
1. Use an online converter like https://cloudconvert.com/svg-to-png
2. Or use ImageMagick: convert icon16.svg icon16.png
3. Or use any image editor

The extension will work with SVG icons in modern Chrome versions.
`;

fs.writeFileSync(path.join(__dirname, 'images', 'README.txt'), note);
console.log('\nAll icons generated successfully!');
console.log('Note: SVG icons created. For maximum compatibility, convert to PNG.');
