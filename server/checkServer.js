const http = require('http');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

// Simple script to check if the server is running
const checkServer = () => {
  console.log(`Checking if server is running on port ${PORT}...`);
  
  const req = http.request({
    host: 'localhost',
    port: PORT,
    path: '/',
    method: 'GET',
    timeout: 5000
  }, (res) => {
    console.log(`Server status: ${res.statusCode}`);
    
    if (res.statusCode === 200) {
      console.log('✅ Server is running correctly!');
    } else {
      console.log('⚠️ Server is running but returned an unexpected status code.');
    }
    
    res.on('data', (chunk) => {
      console.log(`Response: ${chunk}`);
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ Server is not running or not accessible:', error.message);
    console.log('Make sure to start the server with "npm start" or "npm run dev"');
  });
  
  req.on('timeout', () => {
    console.error('❌ Request timed out. Server might be running but is not responding.');
    req.abort();
  });
  
  req.end();
};

checkServer();
