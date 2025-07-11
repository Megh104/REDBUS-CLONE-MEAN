const https = require('https');
const fs = require('fs');
const path = require('path');

const textures = [
  {
    url: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/leather.jpg',
    filename: 'seat_texture.png'
  },
  {
    url: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/hardwood2_diffuse.jpg',
    filename: 'floor.jpg'
  },
  {
    url: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/metal.jpg',
    filename: 'ceiling.jpg'
  },
  {
    url: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/wood.jpg',
    filename: 'wood.jpg'
  }
];

const texturesDir = path.join(__dirname, 'src', 'assets', 'textures');

// Ensure textures directory exists
if (!fs.existsSync(texturesDir)) {
  fs.mkdirSync(texturesDir, { recursive: true });
}

textures.forEach(texture => {
  const file = fs.createWriteStream(path.join(texturesDir, texture.filename));
  https.get(texture.url, response => {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded ${texture.filename}`);
    });
  }).on('error', err => {
    fs.unlink(path.join(texturesDir, texture.filename));
    console.error(`Error downloading ${texture.filename}:`, err.message);
  });
}); 