const fs = require('fs');

async function test() {
    try {
        const buffer = fs.readFileSync('dummy.jpg');
        const blob = new Blob([buffer], { type: 'image/jpeg' });
        const formData = new FormData();
        formData.append('frame', blob, 'dummy.jpg');
        formData.append('voterId', '2');
        formData.append('electionId', '1');

        console.log('Sending request...');
        const res = await fetch('http://localhost:5000/api/security/voting-session-check', {
            method: 'POST',
            body: formData
        });

        const data = await res.json();
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error:', err);
    }
}

test();
