// Mock database for demonstration purposes
const mockDb = {
  // Verification cases for admin review
  verificationCases: [],

  // ID Verification cases (3-layer verification system)
  idVerificationCases: [
    {
      caseId: 'case_test_charan_001',
      voterId: '2',
      voterName: 'Charan K S',
      voterEmail: 'charancharu869@gmail.com',
      registrationIdImage: 'Charan Aadhar.jpg',
      newIdImage: 'Charan Aadhar.jpg',
      newIdPath: null,
      newFileHash: 'f0f9b0f5cf935d0a383f6cf81b6fe0f6f8a9b47e37077e68cb61e734d4515aeb',
      registeredAadhar: '860841426893',
      registeredVoterId: null,
      extractedAadhar: '860841426892', // Intentionally mismatched for testing
      extractedVoterId: null,
      ocrText: 'Sample OCR text from Aadhar card',
      matchDetails: [
        { type: 'Aadhar', target: '860841426893', match: false }
      ],
      verificationMethod: null,
      status: 'pending',
      createdAt: new Date()
    }
  ],

  // Notifications storage
  notifications: [],

  // Simulated government database of valid IDs
  // Simulated government database of valid IDs
  preFedIDs: [
    {
      idNumber: '860841426893',
      name: 'Charan K S',
      idType: 'aadhar',
      dob: '2004-07-09',
      gender: 'Male'
    },
    {
      idNumber: '367598346012',
      name: 'Rajesh Kumar Sharma',
      idType: 'aadhar',
      dob: '1995-03-15',
      gender: 'Male'
    },
    {
      idNumber: 'XYZ9876543',
      name: 'Test User',
      idType: 'voter',
      dob: '1990-01-01',
      gender: 'Male'
    },
    {
      idNumber: '392354024120',
      name: 'Ravi M',
      idType: 'aadhar',
      dob: '2004-06-24',
      gender: 'Male'
    },
    {
      idNumber: '876707522855',
      name: 'Harshitha K M',
      idType: 'aadhar',
      dob: '2005-05-13',
      gender: 'Female'
    },
    {
      idNumber: '924785155350',
      name: 'Soundarya G',
      idType: 'aadhar',
      dob: '2004-05-25',
      gender: 'Female'
    }
  ],
  voters: [
    {
      _id: '1',
      name: 'Test User',
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser',
      email: 'user@gmail.com',
      password: '$2a$10$dU5iD4VjPbkmJSRGluqNhOr0QUL7GUI2kvHxydhumyCUIaukJFvaK', // hashed '123'
      dob: new Date('1990-01-01'),
      age: 33,
      gender: 'Male',
      address: '123 Test Street, Test City',
      district: 'Bangalore Urban',
      taluk: 'Bangalore North',
      hobli: 'Kasaba',
      phone: '1234567890',
      idProof: 'default-id.jpg',
      profilePic: 'default-profile.jpg',
      image: 'default-profile.jpg',
      voterid: 'V001',
      voteStatus: false,
      verificationStatus: 'not verified',
      isBlocked: false,
      violationCount: 0,
      project: 'Test Project',
      facialProfile: {
        enrolled: true,
        enrolledAt: new Date()
      },
      aadharNumber: '123456789012',
      voterIdNumber: 'VOTER123456'
    },
    {
      _id: '2',
      name: 'Charan K S',
      firstName: 'Charan',
      lastName: 'K S',
      username: 'Charan',
      email: 'charancharu869@gmail.com',
      password: '$2a$10$dU5iD4VjPbkmJSRGluqNhOr0QUL7GUI2kvHxydhumyCUIaukJFvaK', // hashed '123'
      dob: new Date('2004-07-09'),
      age: 21,
      gender: 'Male',
      address: 'Neharu Nagar 3rd cross Chitradurga ',
      district: 'Chitradurga',
      taluk: 'Chitradurga',
      hobli: 'Kasaba',
      phone: '8550024647',
      idProof: 'Charan Aadhar.jpg',
      profilePic: 'Charan.jpg',
      image: 'Charan.jpg',
      voterid: 'V002',
      voteStatus: false,
      verificationStatus: 'Not Verified',
      isBlocked: false,
      violationCount: 0,
      project: 'Online Voting System',
      aadharCardHash: 'f0f9b0f5cf935d0a383f6cf81b6fe0f6f8a9b47e37077e68cb61e734d4515aeb',
      aadharNumber: '860841426893',
      kycDocuments: {
        idDocument: {
          filename: 'Charan Aadhar.jpg',
          uploadedAt: new Date(),
          mimeType: 'image/jpeg'
        }
      }
    },
    {
      _id: '3',
      name: 'Ravi M',
      firstName: 'Ravi',
      lastName: 'M',
      username: 'Ravi',
      email: 'ravi@gmail.com',
      password: '$2a$10$dU5iD4VjPbkmJSRGluqNhOr0QUL7GUI2kvHxydhumyCUIaukJFvaK', // hashed '123'
      dob: new Date('2004-06-24'),
      age: 21,
      gender: 'Male',
      address: 'Neharu Nagar 3rd cross Chitradurga ',
      district: 'Chitradurga',
      taluk: 'Chitradurga',
      hobli: 'Kasaba',
      phone: '8550024647',
      idProof: 'Ravi Aadhar.jpg',
      profilePic: 'Ravi M.jpg',
      image: 'Ravi M.jpg',
      voterid: 'V003',
      voteStatus: false,
      verificationStatus: 'verified',
      isBlocked: false,
      violationCount: 0,
      project: 'Online Voting System',
      aadharCardHash: '254a01d2b79a4e4b1f1cd58e8b9696b703619e1b72ff8a17450d620c3f82d192',
      aadharNumber: '392354024120',
      kycDocuments: {
        idDocument: {
          filename: 'Ravi Aadhar.jpg',
          uploadedAt: new Date(),
          mimeType: 'image/jpeg'
        }
      }
    },
    {
      _id: '4',
      name: 'Soundarya G',
      firstName: 'Soundarya',
      lastName: 'G',
      username: 'Soundarya',
      email: 'soundarya@gmail.com',
      password: '$2a$10$dU5iD4VjPbkmJSRGluqNhOr0QUL7GUI2kvHxydhumyCUIaukJFvaK', // hashed '123'
      dob: new Date('2004-05-25'),
      age: 21,
      gender: 'Female',
      address: 'Neharu Nagar 3rd cross Chitradurga ',
      district: 'Chitradurga',
      taluk: 'Chitradurga',
      hobli: 'Kasaba',
      phone: '8550024647',
      idProof: 'Soundarya Aadhar.jpg',
      profilePic: 'Soundarya.jpg',
      image: 'Soundarya.jpg',
      voterid: 'V004',
      voteStatus: false,
      verificationStatus: 'verified',
      isBlocked: false,
      violationCount: 0,
      project: 'Online Voting System',
      aadharCardHash: '254a01d2b79a4e4b1f1cd58e8b9696b703619e1b72ff8a17450d620c3f82d192',
      aadharNumber: '924785155350',
      kycDocuments: {
        idDocument: {
          filename: 'Soundarya Aadhar.jpg',
          uploadedAt: new Date(),
          mimeType: 'image/jpeg'
        }
      }
    },
    {
      _id: '5',
      name: 'Harshitha K M',
      firstName: 'Harshitha',
      lastName: 'K M',
      username: 'Harshitha',
      email: 'harshithakm13@gmail.com',
      password: '$2a$10$dU5iD4VjPbkmJSRGluqNhOr0QUL7GUI2kvHxydhumyCUIaukJFvaK', // hashed '123'
      dob: new Date('2005-05-13'),
      age: 20,
      gender: 'Female',
      address: 'Neharu Nagar 3rd cross Chitradurga ',
      district: 'chikmagalur',
      taluk: 'kadur',
      hobli: 'kadur',
      phone: '8073330928',
      idProof: 'Harshitha Aadhar.jpg',
      profilePic: 'Harshitha K M.jpg',
      image: 'Harshitha K M.jpg',
      voterid: 'V005',
      voteStatus: false,
      verificationStatus: 'verified',
      isBlocked: false,
      violationCount: 0,
      project: 'Online Voting System',
      aadharCardHash: '254a01d2b79a4e4b1f1cd58e8b9696b703619e1b72ff8a17450d620c3f82d192',
      aadharNumber: '876707522855',
      kycDocuments: {
        idDocument: {
          filename: 'Harshitha Aadhar.jpg',
          uploadedAt: new Date(),
          mimeType: 'image/jpeg'
        }
      }
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
    },
    {
      _id: '4',
      firstName: 'Narendra Modi',
      age: 58,
      party: 'BJP',
      bio: 'Community organizer focused on social justice.',
      image: 'Narendra Modi.webp',
      symbol: '1763547121578-BJP LOGO.webp',
      votes: 8
    },

  ],
  admins: [
    {
      _id: '1',
      username: 'admin',
      password: 'admin123' // plain text for testing
    }
  ],
  elections: [
    {
      _id: '1',
      title: 'Presidential Election 2025',
      description: 'National election for the next president.',
      startDate: new Date('2025-11-27T14:52:48.594Z'),
      endDate: new Date('2025-12-04T14:52:48.594Z'),
      status: 'current',
      candidates: ['1', '2', '3', '4']
    },
    {
      _id: '2',
      title: 'State Assembly Election 2025',
      description: 'Election for state assembly representatives.',
      startDate: new Date('2025-12-15T08:00:00.000Z'),
      endDate: new Date('2025-12-22T18:00:00.000Z'),
      status: 'upcoming',
      candidates: ['1', '2', '3']
    },
    {
      _id: '3',
      title: 'Local Municipal Election 2024',
      description: 'Municipal corporation election for local governance.',
      startDate: new Date('2024-10-01T08:00:00.000Z'),
      endDate: new Date('2024-10-15T18:00:00.000Z'),
      status: 'completed',
      candidates: ['1', '2', '3', '4']
    },
    {
      _id: '4',
      title: 'General Election 2025 - Second Phase',
      description: 'Second phase of the general election across multiple constituencies.',
      startDate: new Date('2025-12-25T09:00:00.000Z'),
      endDate: new Date('2026-01-05T18:00:00.000Z'),
      status: 'upcoming',
      candidates: ['2', '3', '4']
    },
    {
      _id: '5',
      title: 'Regional Council Elections 2024',
      description: 'Election for regional council members.',
      startDate: new Date('2024-09-01T08:00:00.000Z'),
      endDate: new Date('2024-09-30T18:00:00.000Z'),
      status: 'completed',
      candidates: ['1', '2', '3']
    }
  ]
};

module.exports = mockDb;
