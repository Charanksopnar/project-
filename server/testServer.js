const express = require('express');

// Initialize Express app
const app = express();
const PORT = 5000;

// Middleware
app.use(express.json());

// Default route
app.get('/', (req, res) => {
  res.send('Test server is running');
});

// Start server
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
