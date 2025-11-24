const fs = require('fs');
const path = require('path');
const util = require('util');
const axios = require('axios');
const FormData = require('form-data');

const logFile = fs.createWriteStream('verify_output.txt', { flags: 'w' });
const logStdout = process.stdout;

console.log = function (d) {
    logFile.write(util.format(d) + '\n');
    logStdout.write(util.format(d) + '\n');
};

console.error = function (d) {
    logFile.write(util.format(d) + '\n');
    logStdout.write(util.format(d) + '\n');
};

const BASE_URL = 'http://localhost:5000/api';
const VOTER_ID = '1'; // Using mock voter ID 1
const ELECTION_ID = 'india-2026';

async function runTest() {
    console.log('🚀 Starting Voting Security Verification...');

    // Create a dummy image file for testing
    const dummyImagePath = path.join(__dirname, 'dummy_frame.jpg');
    if (!fs.existsSync(dummyImagePath)) {
        fs.writeFileSync(dummyImagePath, 'dummy image content');
    }

    try {
        // Test 1: Normal check (simulated)
        console.log('\n--- Test 1: Normal Check ---');
        let formData = new FormData();
        formData.append('frame', fs.createReadStream(dummyImagePath));
        formData.append('voterId', VOTER_ID);
        formData.append('electionId', ELECTION_ID);

        let res = await axios.post(`${BASE_URL}/security/voting-session-check`, formData, {
            headers: formData.getHeaders()
        });
        console.log('Response: ' + JSON.stringify(res.data, null, 2));

    } catch (error) {
        console.error('Test failed details:');
        if (error.response) {
            console.error('Status: ' + error.response.status);
            console.error('Data: ' + JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.error('No response received');
        } else {
            console.error('Error message: ' + error.message);
            console.error('Stack: ' + error.stack);
        }
    } finally {
        if (fs.existsSync(dummyImagePath)) {
            fs.unlinkSync(dummyImagePath);
        }
    }
}

runTest();
