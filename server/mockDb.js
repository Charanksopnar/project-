// Mock database for demonstration purposes
const mockDb = {
  voters: [
    {
      _id: '1',
      name: 'Test User',
      username: 'testuser',
      email: 'user@gmail.com',
      password: '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM1A8W9iqaG3vv1BD7WC', // hashed '123'
      dob: new Date('1990-01-01'),
      age: 33,
      address: '123 Test Street, Test City',
      phone: '1234567890',
      idProof: 'default-id.jpg',
      profilePic: 'default-profile.jpg',
      voteStatus: false
    }
  ],
  candidates: [
    {
      _id: '1',
      firstName: 'John Doe',
      age: 45,
      party: 'Democratic Party',
      bio: 'Experienced leader with a focus on education and healthcare.',
      image: 'default-candidate.jpg',
      symbol: 'default-symbol.jpg',
      votes: 10
    },
    {
      _id: '2',
      firstName: 'Jane Smith',
      age: 50,
      party: 'Republican Party',
      bio: 'Business leader with a strong economic policy.',
      image: 'default-candidate.jpg',
      symbol: 'default-symbol.jpg',
      votes: 8
    },
    {
      _id: '3',
      firstName: 'Alex Johnson',
      age: 38,
      party: 'Independent',
      bio: 'Community organizer focused on social justice.',
      image: 'default-candidate.jpg',
      symbol: 'default-symbol.jpg',
      votes: 5
    }
  ],
  admins: [
    {
      _id: '1',
      username: 'admin',
      password: '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM1A8W9iqaG3vv1BD7WC' // hashed 'admin@123'
    }
  ],
  elections: [
    {
      _id: '1',
      title: 'Presidential Election 2024',
      description: 'National election for the next president.',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      status: 'upcoming',
      candidates: ['1', '2', '3']
    }
  ]
};

module.exports = mockDb;
