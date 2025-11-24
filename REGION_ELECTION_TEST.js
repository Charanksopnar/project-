const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function runTest() {
    try {
        console.log('🚀 Starting Region Election API Test...');

        // 1. Admin Login
        console.log('\n1. Logging in as admin...');
        const loginRes = await axios.post(`${BASE_URL}/adminlogin`, {
            username: 'admin',
            password: '123' // Updated to match mockDb hash
        });

        if (!loginRes.data.success) {
            throw new Error('Admin login failed');
        }
        const token = loginRes.data.token;
        console.log('✅ Admin logged in. Token received.');

        // 2. Create Test Election
        console.log('\n2. Creating test election...');
        const electionRes = await axios.post(`${BASE_URL}/api/createElection`, {
            title: 'Test Region Election',
            description: 'Testing region and candidate features',
            startDate: new Date(),
            endDate: new Date(Date.now() + 86400000),
            candidateIds: []
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!electionRes.data.success) {
            throw new Error('Create election failed');
        }
        const electionId = electionRes.data.election._id;
        console.log(`✅ Election created. ID: ${electionId}`);

        // 3. Update Region
        console.log('\n3. Updating election region to "City"...');
        const regionRes = await axios.post(`${BASE_URL}/api/updateElectionRegion/${electionId}`, {
            region: 'City'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!regionRes.data.success || regionRes.data.election.region !== 'City') {
            throw new Error('Update region failed');
        }
        console.log('✅ Region updated to "City".');

        // 4. Add Candidate
        console.log('\n4. Adding candidate...');
        const candidateRes = await axios.post(`${BASE_URL}/api/addCandidateToElection/${electionId}`, {
            name: 'Test Candidate',
            party: 'Test Party',
            photoUrl: 'test.jpg'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!candidateRes.data.success) {
            throw new Error('Add candidate failed');
        }
        console.log('✅ Candidate added.');

        // 5. Verify Candidates List
        console.log('\n5. Verifying candidates list...');
        const listRes = await axios.get(`${BASE_URL}/api/getElectionCandidates/${electionId}`);

        if (!listRes.data.success) {
            throw new Error('Get candidates failed');
        }
        const candidates = listRes.data.candidates;
        if (candidates.length !== 1 || candidates[0].name !== 'Test Candidate') {
            console.error('Candidates:', candidates);
            throw new Error('Candidate verification failed');
        }
        console.log('✅ Candidate verified in list.');

        console.log('\n🎉 All tests passed successfully!');

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Error details:', error);
        }
    }
}

runTest();
