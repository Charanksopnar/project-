const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const uploadsDir = path.join(__dirname, 'uploads');

// Find the most recent file matching "Charan" (excluding the dest file itself)
const files = fs.readdirSync(uploadsDir);
const charanFiles = files.filter(f => f.includes('Charan') && f !== 'Charan_Aadhar_Original.jpg')
    .map(f => ({
        name: f,
        time: fs.statSync(path.join(uploadsDir, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);

if (charanFiles.length === 0) {
    console.error('No Charan files found!');
    process.exit(1);
}

const sourceFile = charanFiles[0].name;
const sourcePath = path.join(uploadsDir, sourceFile);

console.log('Found most recent file:', sourceFile);

try {
    console.log('Using file:', sourcePath);

    const hash = crypto.createHash('sha256');
    const input = fs.createReadStream(sourcePath);

    input.on('readable', () => {
        const data = input.read();
        if (data)
            hash.update(data);
    });

    input.on('end', () => {
        const output = `HASH:${hash.digest('hex')}\nFILENAME:${sourceFile}`;
        console.log(output);
        fs.writeFileSync('hash_only.txt', output);
    });

} catch (err) {
    console.error('Error:', err.message);
}
