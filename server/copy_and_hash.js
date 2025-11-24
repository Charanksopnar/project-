const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const source = path.join(__dirname, 'uploads', '1763913127138-Charan K S Aadhar.jpg');
const dest = path.join(__dirname, 'uploads', 'Charan Aadhar.jpg');

try {
    fs.copyFileSync(source, dest);
    console.log('File copied successfully.');

    const hash = crypto.createHash('sha256');
    const input = fs.createReadStream(dest);

    input.on('readable', () => {
        const data = input.read();
        if (data)
            hash.update(data);
    });

    input.on('end', () => {
        console.log('Hash:', hash.digest('hex'));
    });

} catch (err) {
    console.error('Error:', err.message);
}
