const mockDb = require('./mockDb');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

async function verifyFix() {
    const charan = mockDb.voters.find(v => v._id === '2');
    let output = '';
    output += 'DB Hash:   ' + charan.aadharCardHash + '\n';

    const filePath = path.join(__dirname, 'uploads/idProofs/Charan_Aadhar_Original.jpg');
    if (!fs.existsSync(filePath)) {
        output += 'FAIL: File not found at ' + filePath + '\n';
        fs.writeFileSync('output_hash.txt', output);
        return;
    }

    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => {
        const fileHash = hash.digest('hex');
        output += 'File Hash: ' + fileHash + '\n';

        if (fileHash === charan.aadharCardHash) {
            output += 'SUCCESS: MATCH\n';
        } else {
            output += 'FAIL: MISMATCH\n';
        }
        fs.writeFileSync('output_hash.txt', output);
        console.log('Done');
    });
}

verifyFix();
