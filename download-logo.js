const https = require('https');
const fs = require('fs');
const path = require('path');

const logoUrl = 'https://drive.google.com/uc?export=download&id=1kaVJQRai9TURlj9_V4kZoj3XVpwEJYMY';
const outputPath = path.join(__dirname, 'client', 'public', 'assets', 'techknogeeks-logo.png');
const outputDir = path.dirname(outputPath);

// Create assets directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const file = fs.createWriteStream(outputPath);

console.log('Downloading logo...');

https.get(logoUrl, (response) => {
  response.pipe(file);
  
  file.on('finish', () => {
    file.close();
    console.log('Logo downloaded successfully to:', outputPath);
  });}).on('error', (err) => {
  fs.unlink(outputPath, () => {}); // Delete the file if there's an error
  console.error('Error downloading logo:', err.message);
});
