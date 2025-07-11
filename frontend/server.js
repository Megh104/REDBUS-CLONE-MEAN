const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist/frontend/browser')));

// Send all requests to index.html
app.get('/*', function(req, res) {
  res.sendFile(path.join(__dirname, 'dist/frontend/browser/index.html'));
});

// Start the app by listening on the default Render port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Frontend server listening on port ${port}`);
}); 