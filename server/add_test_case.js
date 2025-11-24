/**
 * Test Script: Add Verification Case for Charan
 * Run this with: node add_test_case.js
 * This will add a test verification case to the running server's memory
 */

const http = require('http');

const testCase = {
    voterId: '2'
};

const data = JSON.stringify(testCase);

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/verification-cases/create-test',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
        responseData += chunk;
    });

    res.on('end', () => {
        console.log('\n✅ Response Status:', res.statusCode);
        console.log('📦 Response Data:', responseData);

        if (res.statusCode === 200) {
            console.log('\n✅ SUCCESS! Test case created for Charan K S');
            console.log('🔍 Now check the KYC Review page at: http://localhost:3000/admin/kyc-review');
        } else {
            console.log('\n❌ Failed to create test case');
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Error:', error.message);
});

req.write(data);
req.end();
