const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000';

async function testSecurityVerification() {
    try {
        console.log('1. Registering a new voter...');
        const uniqueId = Date.now();
        const voterData = {
            name: `Test Voter ${uniqueId}`,
            email: `testvoter${uniqueId}@example.com`,
            phone: '9876543210',
            password: 'password123',
            dob: '1990-01-01',
            gender: 'Male',
            address: '123 Test St, Test City'
        };

        const registerRes = await axios.post(`${BASE_URL}/createVoter`, voterData);
        const voterId = registerRes.data.voterId;
        console.log(`   Voter registered with ID: ${voterId}`);

        console.log('2. Creating dummy images...');
        const dummyIdPath = path.join(__dirname, 'dummy_id_card.jpg');
        const dummyFacePath = path.join(__dirname, 'dummy_face.jpg');

        // Create dummy files if they don't exist (just empty files for testing upload)
        if (!fs.existsSync(dummyIdPath)) fs.writeFileSync(dummyIdPath, 'dummy image content');
        if (!fs.existsSync(dummyFacePath)) fs.writeFileSync(dummyFacePath, 'dummy face content');

        console.log('3. Submitting ID Verification...');
        const formData = new FormData();
        formData.append('idType', 'aadhar');
        formData.append('voterId', voterId);
        formData.append('idImage', fs.createReadStream(dummyIdPath), { contentType: 'image/jpeg', filename: 'id_card.jpg' });
        formData.append('faceImage', fs.createReadStream(dummyFacePath), { contentType: 'image/jpeg', filename: 'face.jpg' });

        const verifyRes = await axios.post(`${BASE_URL}/api/security/verify-id`, formData, {
            headers: {
                ...formData.getHeaders()
            }
        });

        console.log('   Verification Response:', JSON.stringify(verifyRes.data, null, 2));

        if (verifyRes.data.verificationStatus === 'rejected') {
            console.error('FAIL: Verification status is REJECTED. This explains why it does not show in Admin Pending list.');
        } else if (verifyRes.data.verificationStatus === 'pending') {
            console.log('SUCCESS: Verification status is PENDING. It should show in Admin Pending list.');
        } else {
            console.log(`Result: ${verifyRes.data.verificationStatus}`);
        }

        // Cleanup
        if (fs.existsSync(dummyIdPath)) fs.unlinkSync(dummyIdPath);
        if (fs.existsSync(dummyFacePath)) fs.unlinkSync(dummyFacePath);

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testSecurityVerification();
