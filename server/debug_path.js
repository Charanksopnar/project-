const path = require('path');
const fs = require('fs');

const filename = 'Charan_Aadhar_Original.jpg';
const routesDir = path.join(__dirname, 'routes');
const originalImagePath = path.join(routesDir, '../uploads/', filename);

console.log('Resolved Path:', originalImagePath);
console.log('Exists:', fs.existsSync(originalImagePath));

const idProofsPath = path.join(routesDir, '../uploads/idProofs/', filename);
console.log('ID Proofs Path:', idProofsPath);
console.log('Exists in ID Proofs:', fs.existsSync(idProofsPath));
