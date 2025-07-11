const express = require('express');
const path = require('path');
const app = express();

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist/frontend')));

// Send all requests to index.html
app.get('/*', function(req, res) {
  const indexPath = path.join(__dirname, 'dist/frontend/index.html');
  console.log('Serving index.html from:', indexPath);
  
  if (!require('fs').existsSync(indexPath)) {
    console.error('Error: index.html not found at', indexPath);
    return res.status(404).send('Application files not found. Please ensure the build was successful.');
  }
  
  res.sendFile(indexPath);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Internal Server Error');
});

// Start the app by listening on the default Render port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Frontend server listening on port ${port}`);
  console.log('Server running in directory:', __dirname);
  console.log('Looking for files in:', path.join(__dirname, 'dist/frontend'));
}); 