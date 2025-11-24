const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testDashboardAPI() {
    try {
        console.log('Testing /api/getDashboardData...');
        const response = await axios.get(`${BASE_URL}/api/getDashboardData`);
        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error fetching dashboard data:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }

    try {
        console.log('\nTesting /api/getUpcomingElections...');
        const response = await axios.get(`${BASE_URL}/api/getUpcomingElections`);
        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error fetching upcoming elections:', error.message);
    }
}

testDashboardAPI();
