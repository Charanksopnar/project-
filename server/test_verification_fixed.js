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

        // Use readFileSync to avoid stream issues
        const fileBuffer = fs.readFileSync(filePath);
        form.append('idImage', fileBuffer, 'Charan_Aadhar_Original.jpg');
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
        if (error.response) {
            console.log('Status:', error.response.status);
        }
    }
}

testVerification();
