const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000';
const LOG_FILE = 'verify_log.txt';

function log(msg) {
    console.log(msg);
    fs.appendFileSync(LOG_FILE, msg + '\n');
}

async function verifyKYC() {
    fs.writeFileSync(LOG_FILE, '🚀 Starting KYC Verification Test...\n');
    try {
        // 1. Register a new voter
        log('\n1. Testing Registration (/createVoter)...');
        const uniqueId = Date.now();
        const userData = {
            firstName: `TestUser${uniqueId}`,
            lastName: 'Verif',
            email: `test${uniqueId}@example.com`,
            password: 'password123',
            dob: '1990-01-01',
            phone: '1234567890',
            address: '123 Test St',
            state: 'TestState',
            city: 'TestCity'
        };

        // Need to send as multipart/form-data because createVoter expects files (even if empty)
        // or at least the route uses upload.any()
        const form = new FormData();
        Object.keys(userData).forEach(key => form.append(key, userData[key]));

        let voterId;
        let token;

        try {
            const regRes = await axios.post(`${BASE_URL}/createVoter`, form, {
                headers: { ...form.getHeaders() }
            });
            log('✅ Registration Successful: ' + JSON.stringify(regRes.data));
            voterId = regRes.data.voterId || (regRes.data.voter && regRes.data.voter._id);
        } catch (err) {
            const status = err.response ? err.response.status : 'No Response';
            const statusText = err.response ? err.response.statusText : '';
            const data = err.response ? JSON.stringify(err.response.data) : err.message;
            log(`❌ Registration Failed: ${status} ${statusText} - ${data}`);
            return;
        }

        if (!voterId) {
            log('❌ No voterId returned from registration');
            return;
        }

        // 2. Login (to get token if needed, though createVoter might not return token)
        log('\n2. Testing Login (/login)...');
        try {
            const loginRes = await axios.post(`${BASE_URL}/login`, {
                username: userData.email,
                password: userData.password
            });
            log('✅ Login Successful: ' + JSON.stringify(loginRes.data));
            token = loginRes.data.token;
        } catch (err) {
            log('❌ Login Failed: ' + (err.response ? JSON.stringify(err.response.data) : err.message));
            return;
        }

        // 3. Submit KYC
        log('\n3. Testing KYC Submission (/submitKYC)...');
        const kycForm = new FormData();
        kycForm.append('idNumber', `ID-${uniqueId}`);
        // Create a dummy file for upload
        fs.writeFileSync('dummy_id.jpg', 'dummy content');
        kycForm.append('idProof', fs.createReadStream('dummy_id.jpg'), {
            filename: 'dummy_id.jpg',
            contentType: 'image/jpeg'
        });

        try {
            const kycRes = await axios.post(`${BASE_URL}/submitKYC/${voterId}`, kycForm, {
                headers: {
                    ...kycForm.getHeaders(),
                    'Authorization': `Bearer ${token}` // Assuming auth might be needed or ignored
                }
            });
            log('✅ KYC Submission Successful: ' + JSON.stringify(kycRes.data));
        } catch (err) {
            log('❌ KYC Submission Failed: ' + (err.response ? JSON.stringify(err.response.data) : err.message));
        }

        // Cleanup
        try { fs.unlinkSync('dummy_id.jpg'); } catch (e) { }

        log('\n✨ Verification Complete');

    } catch (error) {
        log('❌ Unexpected Error: ' + error.message);
    }
}

verifyKYC();
