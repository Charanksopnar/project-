const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testCandidateSearch() {
    try {
        console.log('Testing Candidate Search API...');

        // 1. Search for a candidate (assuming some exist, or we can add one first)
        // First, let's try to find *any* candidate to use as a search term, or just use a common letter like 'a'
        const searchResponse = await axios.get(`${API_URL}/searchCandidates?query=a`);

        if (searchResponse.status === 200 && searchResponse.data.success) {
            console.log('✅ Search API reachable');
            console.log(`Found ${searchResponse.data.candidates.length} candidates matching "a"`);
            if (searchResponse.data.candidates.length > 0) {
                console.log('Sample candidate:', searchResponse.data.candidates[0].firstName);
            }
        } else {
            console.error('❌ Search API failed:', searchResponse.data);
        }

        // 2. Test missing query parameter
        try {
            await axios.get(`${API_URL}/searchCandidates`);
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('✅ Correctly handled missing query parameter');
            } else {
                console.error('❌ Failed to handle missing query parameter:', error.message);
            }
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testCandidateSearch();
