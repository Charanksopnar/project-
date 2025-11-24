const crypto = require('crypto');
const fs = require('fs');

const filePath = 'c:\\Users\\Ravi M\\OneDrive\\Desktop\\project-\\server\\uploads\\idProofs\\Charan_Aadhar_Original.jpg';
const hash = crypto.createHash('sha256');
const stream = fs.createReadStream(filePath);

stream.on('data', (data) => {
    hash.update(data);
});

stream.on('end', () => {
    console.log(hash.digest('hex'));
});
