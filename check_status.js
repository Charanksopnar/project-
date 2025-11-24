const http = require('http');

function makeRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.end();
    });
}

async function run() {
    try {
        console.log('Checking voter 2 status...');
        let data = await makeRequest('/getVoterbyID/2');
        console.log('Voter 2 (getVoterbyID):', data.voter?.verificationStatus);

        data = await makeRequest('/verificationStatus/2');
        console.log('Voter 2 (verificationStatus):', data.verificationStatus);
    } catch (e) {
        console.error('Error:', e);
    }
}

run();
