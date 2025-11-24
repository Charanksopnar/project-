const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testVerification() {
    try {
        const form = new FormData();
        const filePath = path.join(__dirname, 'uploads/idProofs/Charan_Aadhar_Original.jpg');

        if (!fs.existsSync(filePath)) {
            fs.writeFileSync('debug_error.txt', 'File not found: ' + filePath);
            return;
        }

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

        fs.writeFileSync('debug_success.txt', JSON.stringify(response.data, null, 2));
        console.log('Success');
    } catch (error) {
        const errorData = error.response ? error.response.data : error.message;
        fs.writeFileSync('debug_error.txt', JSON.stringify(errorData, null, 2));
        console.log('Error logged to debug_error.txt');
    }
}

testVerification();
