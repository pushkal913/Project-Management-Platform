const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const inputPath = path.join(__dirname, 'client', 'public', 'assets', 'techknogeeks-logo.png');
const outputPath = path.join(__dirname, 'client', 'public', 'favicon.ico');

async function createFavicon() {
  try {
    // Load the logo image
    const image = await loadImage(inputPath);
    
    // Create a canvas for the favicon (32x32 is a common favicon size)
    const canvas = createCanvas(32, 32);
    const ctx = canvas.getContext('2d');
    
    // Draw the image on the canvas (centered and scaled to fit)
    const size = Math.min(image.width, image.height);
    const x = (image.width - size) / 2;
    const y = (image.height - size) / 2;
    
    // Draw white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 32, 32);
    
    // Draw the logo (scaled to fit within 32x32)
    ctx.drawImage(image, x, y, size, size, 0, 0, 32, 32);
    
    // Convert canvas to ICO format (simplified - in a real app, you'd use a proper ICO encoder)
    const buffer = canvas.toBuffer('image/png');
    
    // Save the favicon
    fs.writeFileSync(outputPath, buffer);
    
    console.log('Favicon created successfully at:', outputPath);
  } catch (error) {
    console.error('Error creating favicon:', error);
  }
}

createFavicon();
