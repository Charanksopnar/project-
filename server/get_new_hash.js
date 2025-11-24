const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'uploads', 'Charan_Aadhar_Original.jpg');
const hash = crypto.createHash('sha256');
const input = fs.createReadStream(filePath);

input.on('readable', () => {
    const data = input.read();
    if (data)
        hash.update(data);
});

input.on('end', () => {
    console.log(hash.digest('hex'));
});
