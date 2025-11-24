const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testVerification() {
    try {
        const form = new FormData();
        const filePath = path.join(__dirname, 'uploads/idProofs/Charan_Aadhar_Original.jpg');

        if (!fs.existsSync(filePath)) {
            console.error('File not found:', filePath);
            return;
        }

        form.append('idImage', fs.createReadStream(filePath));
        form.append('idType', 'aadhar');
        form.append('voterId', '2');

        console.log('Sending verification request...');
        const response = await axios.post('http://localhost:5000/api/security/verify-id-step2', form, {
            headers: {
                ...form.getHeaders()
            }
        });

        console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

// Wait for server to start
setTimeout(testVerification, 5000);
