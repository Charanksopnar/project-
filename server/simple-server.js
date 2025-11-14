const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
// const jwt = require('jsonwebtoken');
// bcrypt not required for mock server
// const bcrypt = require('bcryptjs');
// localStorage (not used in mock server)
// const localStorage = require('./utils/localStorage');

// Import enhanced upload middleware with government ID support
const { upload } = require('./middleware/upload');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// Simple mock data
const mockCandidates = [
  {
    _id: '1',
    firstName: 'John Doe',
    fullName: 'John Doe',
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
    fullName: 'Jane Smith',
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
    fullName: 'Alex Johnson',
    age: 38,
    party: 'Independent',
    bio: 'Community organizer focused on social justice.',
    image: 'default-candidate.jpg',
    symbol: 'default-symbol.jpg',
    votes: 5
  }
];

// Mock data for invalid votes
const mockInvalidVotes = [];

// Mock voters data
const mockVoters = [
  {
    _id: '1',
    firstName: 'Test User',
    lastName: 'One',
    username: 'testuser',
    email: 'user@gmail.com',
    age: 33,
    state: 'California',
    voteStatus: false
  },
  {
    _id: '2',
    firstName: 'Jane',
    lastName: 'Doe',
    username: 'janedoe',
    email: 'jane@example.com',
    age: 28,
    state: 'New York',
    voteStatus: true
  },
  {
    _id: '3',
    firstName: 'Bob',
    lastName: 'Smith',
    username: 'bobsmith',
    email: 'bob@example.com',
    age: 45,
    state: 'Texas',
    voteStatus: false
  },
  {
    _id: '4',
    firstName: 'Alice',
    lastName: 'Johnson',
    username: 'alicej',
    email: 'alice@example.com',
    age: 35,
    state: 'Florida',
    voteStatus: true
  },
  {
    _id: '5',
    firstName: 'Charlie',
    lastName: 'Brown',
    username: 'charlieb',
    email: 'charlie@example.com',
    age: 50,
    state: 'California',
    voteStatus: false
  },
  {
    _id: '6',
    firstName: 'Diana',
    lastName: 'Prince',
    username: 'dianap',
    email: 'diana@example.com',
    age: 29,
    state: 'Washington',
    voteStatus: true
  },
  {
    _id: '7',
    firstName: 'Edward',
    lastName: 'Miller',
    username: 'edwardm',
    email: 'edward@example.com',
    age: 42,
    state: 'Oregon',
    voteStatus: false
  },
  {
    _id: '8',
    firstName: 'Fiona',
    lastName: 'Garcia',
    username: 'fionag',
    email: 'fiona@example.com',
    age: 38,
    state: 'New York',
    voteStatus: true
  },
  {
    _id: '9',
    firstName: 'George',
    lastName: 'Wilson',
    username: 'georgew',
    email: 'george@example.com',
    age: 55,
    state: 'Texas',
    voteStatus: false
  },
  {
    _id: '10',
    firstName: 'Hannah',
    lastName: 'Lee',
    username: 'hannahl',
    email: 'hannah@example.com',
    age: 31,
    state: 'California',
    voteStatus: true
  }
];

// Mock elections data
const mockElections = [
  {
    _id: '1',
    name: 'Presidential Election 2024',
    description: 'General election for the President of the United States',
    startDate: '2024-11-03',
    endDate: '2024-11-03',
    status: 'upcoming'
  },
  {
    _id: '2',
    name: 'Senate Election 2024',
    description: 'Election for Senate seats',
    startDate: '2024-11-03',
    endDate: '2024-11-03',
    status: 'upcoming'
  },
  {
    _id: '3',
    name: 'Gubernatorial Election 2024',
    description: 'Election for state governors',
    startDate: '2024-11-03',
    endDate: '2024-11-03',
    status: 'upcoming'
  },
  {
    _id: '4',
    name: 'Local Council Election 2024',
    description: 'Election for local council members',
    startDate: '2024-10-15',
    endDate: '2024-10-15',
    status: 'upcoming'
  }
];

// Routes
app.get('/', (req, res) => {
  res.send('Simple API is running');
});

// Login route (mock-based)
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  console.log('Login attempt:', { username });

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password required' });
  }

  // Try to find voter by username or email in mock data
  const voter = mockVoters.find(v => v.username === username || v.email === username);

  if (!voter) {
    console.log('Voter not found');
    return res.status(400).json({ success: false, message: 'Invalid credentials' });
  }

  // For the mock server we accept the demo password '123' for all mock voters
  if (password !== '123') {
    console.log('Invalid password');
    return res.status(400).json({ success: false, message: 'Invalid credentials' });
  }

  console.log('Login successful for:', voter.email);
  return res.json({
    success: true,
    voterObject: {
      _id: voter._id,
      name: `${voter.firstName || voter.name} ${voter.lastName || ''}`.trim(),
      username: voter.username,
      email: voter.email,
      age: voter.age,
      voteStatus: voter.voteStatus
    }
  });
});

// Admin login route (mock-based)
app.post('/adminlogin', (req, res) => {
  const { username, password } = req.body;
  console.log('Admin login attempt:', { username });

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password required' });
  }

  // Demo admin credentials: admin / admin@123
  if (username === 'admin' && password === 'admin@123') {
    console.log('Admin login successful');
    return res.json({
      success: true,
      admin: {
        _id: '1',
        username: 'admin'
      }
    });
  }

  console.log('Invalid admin credentials');
  return res.status(400).json({ success: false, message: 'Invalid credentials' });
});

// Get all candidates
app.get('/getCandidate', (req, res) => {
  res.json({
    success: true,
    candidate: mockCandidates
  });
});

// Temporarily disable face recognition module due to dependency issues
// const faceRecognition = require('./biometrics/faceRecognition');

// Initialize face recognition models
// (async () => {
//   try {
//     await faceRecognition.loadModels();
//     console.log('Face recognition models loaded successfully');
//   } catch (error) {
//     console.error('Error loading face recognition models:', error);
//   }
// })();

// Enhanced mock face recognition and ID scanning module
const faceRecognition = {
  // Mock face detection function
  detectFaces: async (imageBuffer) => {
    console.log('Mock face detection running...');

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock successful face detection (1 face found)
    return {
      success: true,
      faceCount: 1,
      detections: [{
        detection: { score: 0.95 },
        landmarks: {},
        descriptor: new Float32Array(128)
      }]
    };
  },

  // Enhanced ID document scanning with data extraction
  scanIDDocument: async (imageBuffer) => {
    console.log('Mock ID document scanning and data extraction running...');

    // Simulate OCR and data extraction processing time
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));

    // Mock extracted data based on common Indian ID formats
    const mockIDTypes = ['AADHAAR', 'DRIVING_LICENCE', 'PASSPORT', 'VOTER_ID'];
    const selectedIDType = mockIDTypes[Math.floor(Math.random() * mockIDTypes.length)];

    const mockNames = ['JOHN DOE', 'JANE SMITH', 'ALEX JOHNSON', 'PRIYA SHARMA', 'RAHUL KUMAR'];
    const selectedName = mockNames[Math.floor(Math.random() * mockNames.length)];

    const mockIDData = {
      success: true,
      extractedData: {
        name: selectedName,
        dateOfBirth: '15/08/1990',
        gender: Math.random() > 0.5 ? 'MALE' : 'FEMALE',
        address: '123 Main Street, City, State - 123456',
        idNumber: this.generateMockIDNumber(selectedIDType),
        idType: selectedIDType,
        issueDate: '01/01/2020',
        expiryDate: selectedIDType === 'PASSPORT' ? '01/01/2030' : null
      },
      extractedText: this.generateMockExtractedText(selectedIDType, selectedName),
      idFace: {
        detected: true,
        confidence: 0.85 + Math.random() * 0.1,
        faceBox: {
          x: 200 + Math.floor(Math.random() * 50),
          y: 50 + Math.floor(Math.random() * 30),
          width: 120 + Math.floor(Math.random() * 30),
          height: 150 + Math.floor(Math.random() * 30)
        },
        landmarks: {
          leftEye: { x: 220, y: 80 },
          rightEye: { x: 280, y: 80 },
          nose: { x: 250, y: 120 },
          mouth: { x: 250, y: 160 }
        }
      },
      validation: {
        isValid: true,
        errors: [],
        warnings: []
      },
      confidence: 85 + Math.floor(Math.random() * 10), // 85-95% confidence
      processingTime: 2500 + Math.floor(Math.random() * 1000)
    };

    // Occasionally simulate extraction failures (5% chance)
    if (Math.random() < 0.05) {
      return {
        success: false,
        error: 'Could not extract readable text from ID document. Please ensure the image is clear and well-lit.',
        extractedData: null,
        extractedText: '',
        idFace: null,
        validation: {
          isValid: false,
          errors: ['OCR extraction failed', 'Image quality too low'],
          warnings: ['Try better lighting', 'Ensure ID is flat and unfolded']
        },
        confidence: 0,
        processingTime: 1000
      };
    }

    return mockIDData;
  },

  // Generate mock ID numbers based on type
  generateMockIDNumber: (idType) => {
    switch (idType) {
      case 'AADHAAR':
        return Array.from({length: 12}, () => Math.floor(Math.random() * 10)).join('');
      case 'DRIVING_LICENCE':
        const states = ['MH', 'DL', 'KA', 'TN', 'UP'];
        const state = states[Math.floor(Math.random() * states.length)];
        const year = Math.floor(Math.random() * 30) + 1990;
        const number = Array.from({length: 11}, () => Math.floor(Math.random() * 10)).join('');
        return `${state}${year.toString().slice(-2)}${number}`;
      case 'PASSPORT':
        const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        const passportNum = Array.from({length: 7}, () => Math.floor(Math.random() * 10)).join('');
        return `${letter}${passportNum}`;
      case 'VOTER_ID':
        const voterLetters = Array.from({length: 3}, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
        const voterNum = Array.from({length: 7}, () => Math.floor(Math.random() * 10)).join('');
        return `${voterLetters}${voterNum}`;
      default:
        return 'UNKNOWN123456789';
    }
  },

  // Generate mock extracted text
  generateMockExtractedText: (idType, name) => {
    switch (idType) {
      case 'AADHAAR':
        return `GOVERNMENT OF INDIA
आधार
AADHAAR
Name: ${name}
नाम: ${name}
DOB: 15/08/1990
जन्म तिथि: 15/08/1990
Gender: MALE
लिंग: पुरुष
Address: 123 Main Street, City, State - 123456
पता: 123 मुख्य सड़क, शहर, राज्य - 123456
Aadhaar Number: 1234 5678 9012
आधार संख्या: 1234 5678 9012`;

      case 'DRIVING_LICENCE':
        return `DRIVING LICENCE
चालक अनुज्ञप्ति
Name: ${name}
नाम: ${name}
S/W/D of: FATHER NAME
DOB: 15-08-1990
जन्म तिथि: 15-08-1990
Address: 123 Main Street, City, State - 123456
पता: 123 मुख्य सड़क, शहर, राज्य - 123456
DL Number: MH1420110012345
Validity: 15-08-2040`;

      case 'PASSPORT':
        return `PASSPORT
पासपोर्ट
REPUBLIC OF INDIA
भारत गणराज्य
Name: ${name}
नाम: ${name}
Date of Birth: 15/08/1990
जन्म तिथि: 15/08/1990
Place of Birth: MUMBAI
जन्म स्थान: मुंबई
Passport No: A1234567
पासपोर्ट संख्या: A1234567`;

      case 'VOTER_ID':
        return `ELECTION COMMISSION OF INDIA
भारत निर्वाचन आयोग
ELECTORS PHOTO IDENTITY CARD
मतदाता फोटो पहचान पत्र
Name: ${name}
नाम: ${name}
Father's Name: FATHER NAME
पिता का नाम: पिता का नाम
Age: 33
आयु: 33
Gender: MALE
लिंग: पुरुष
EPIC No: ABC1234567
महाकाव्य संख्या: ABC1234567`;

      default:
        return `IDENTITY DOCUMENT
Name: ${name}
DOB: 15/08/1990
ID Number: UNKNOWN123456789`;
    }
  },

  // Mock face comparison function
  compareFaces: async (currentFaceBuffer, storedFaceBuffer) => {
    console.log('Mock face comparison (2 faces) running...');

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 800));

    // Generate a random similarity between 60% and 80%
    const similarity = Math.random() * 0.2 + 0.6; // 0.6 to 0.8

    return {
      success: true,
      similarity: similarity,
      similarityPercentage: Math.round(similarity * 100)
    };
  },

  compareMultipleFaces: async (selfieBuffer, idBuffer, videoBuffer, options) => {
    console.log('Mock comprehensive face comparison running...');

    // Simulate processing time for comprehensive analysis
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

    // Generate realistic similarity scores with some variation
    const baseScore = 0.65 + Math.random() * 0.15; // Base score between 65-80%

    const selfieToIdSimilarity = Math.max(0.5, Math.min(0.9, baseScore + (Math.random() - 0.5) * 0.1));
    const selfieToVideoSimilarity = Math.max(0.5, Math.min(0.9, baseScore + (Math.random() - 0.5) * 0.1));
    const idToVideoSimilarity = Math.max(0.5, Math.min(0.9, baseScore + (Math.random() - 0.5) * 0.1));

    const averageSimilarity = (selfieToIdSimilarity + selfieToVideoSimilarity + idToVideoSimilarity) / 3;

    // Weighted similarity (live video gets highest weight for security)
    const weightedSimilarity = (
      selfieToIdSimilarity * 0.25 +      // Profile to ID: 25%
      selfieToVideoSimilarity * 0.50 +   // Profile to Live: 50% (most important)
      idToVideoSimilarity * 0.25         // ID to Live: 25%
    );

    // Determine if it's a match based on threshold
    const threshold = options?.minThreshold || 0.6;
    const isMatch = averageSimilarity >= threshold;

    return {
      success: true,
      isMatch: isMatch,
      averageSimilarity: averageSimilarity,
      averageSimilarityPercentage: Math.round(averageSimilarity * 100),
      weightedSimilarityPercentage: Math.round(weightedSimilarity * 100),
      threshold: threshold,
      processingTime: 1500 + Math.floor(Math.random() * 1000),
      comparisons: {
        selfieToId: {
          success: true,
          isMatch: selfieToIdSimilarity >= threshold,
          similarity: selfieToIdSimilarity,
          similarityPercentage: Math.round(selfieToIdSimilarity * 100),
          confidence: 0.85 + Math.random() * 0.1
        },
        selfieToVideo: {
          success: true,
          isMatch: selfieToVideoSimilarity >= threshold,
          similarity: selfieToVideoSimilarity,
          similarityPercentage: Math.round(selfieToVideoSimilarity * 100),
          confidence: 0.85 + Math.random() * 0.1
        },
        idToVideo: {
          success: true,
          isMatch: idToVideoSimilarity >= threshold,
          similarity: idToVideoSimilarity,
          similarityPercentage: Math.round(idToVideoSimilarity * 100),
          confidence: 0.85 + Math.random() * 0.1
        }
      },
      qualityMetrics: {
        faceQuality: {
          selfie: 0.8 + Math.random() * 0.15,
          id: 0.75 + Math.random() * 0.15,
          video: 0.85 + Math.random() * 0.1
        },
        lighting: {
          selfie: 'good',
          id: Math.random() > 0.2 ? 'good' : 'fair',
          video: 'good'
        },
        resolution: {
          selfie: 'high',
          id: Math.random() > 0.3 ? 'medium' : 'high',
          video: 'high'
        }
      }
    };
  },

  // Enhanced comprehensive verification with profile data matching
  comprehensiveVerification: async (profileData, selfieBuffer, idBuffer, videoBuffer) => {
    console.log('Mock comprehensive verification with profile matching running...');

    // Simulate comprehensive processing time
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));

    // First scan the ID document
    const idScanResult = await faceRecognition.scanIDDocument(idBuffer);

    if (!idScanResult.success) {
      return {
        success: false,
        error: 'Failed to scan ID document',
        stage: 'id_scanning',
        details: idScanResult
      };
    }

    // Compare extracted ID data with profile data
    const profileMatch = faceRecognition.compareProfileData(profileData, idScanResult.extractedData);

    // Perform face comparison
    const faceComparisonResult = await faceRecognition.compareMultipleFaces(
      selfieBuffer,
      idBuffer,
      videoBuffer,
      { minThreshold: 0.6, maxThreshold: 0.85 }
    );

    // Calculate overall verification score
    const dataMatchScore = profileMatch.overallMatch ? 85 : 45;
    const faceMatchScore = faceComparisonResult.weightedSimilarityPercentage;
    const overallScore = Math.round((dataMatchScore * 0.3) + (faceMatchScore * 0.7));

    const isVerified = profileMatch.overallMatch &&
                      faceComparisonResult.isMatch &&
                      overallScore >= 70;

    return {
      success: true,
      isVerified: isVerified,
      overallScore: overallScore,
      verificationId: `verify-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
      idScanResult: idScanResult,
      profileMatch: profileMatch,
      faceComparison: faceComparisonResult,
      timestamp: new Date().toISOString(),
      processingTime: 3000 + Math.floor(Math.random() * 2000)
    };
  },

  // Compare profile data with extracted ID data
  compareProfileData: (profileData, extractedData) => {
    console.log('Comparing profile data with extracted ID data...');

    const matches = {
      name: false,
      dateOfBirth: false,
      gender: false,
      address: false
    };

    const scores = {
      name: 0,
      dateOfBirth: 0,
      gender: 0,
      address: 0
    };

    // Name comparison (fuzzy matching)
    if (profileData.name && extractedData.name) {
      const nameScore = faceRecognition.calculateStringSimilarity(
        profileData.name.toLowerCase().trim(),
        extractedData.name.toLowerCase().trim()
      );
      matches.name = nameScore > 0.8;
      scores.name = Math.round(nameScore * 100);
    }

    // Date of birth comparison
    if (profileData.dateOfBirth && extractedData.dateOfBirth) {
      matches.dateOfBirth = faceRecognition.compareDates(profileData.dateOfBirth, extractedData.dateOfBirth);
      scores.dateOfBirth = matches.dateOfBirth ? 100 : 0;
    }

    // Gender comparison
    if (profileData.gender && extractedData.gender) {
      matches.gender = profileData.gender.toLowerCase() === extractedData.gender.toLowerCase();
      scores.gender = matches.gender ? 100 : 0;
    }

    // Address comparison (partial matching)
    if (profileData.address && extractedData.address) {
      const addressScore = faceRecognition.calculateStringSimilarity(
        profileData.address.toLowerCase().trim(),
        extractedData.address.toLowerCase().trim()
      );
      matches.address = addressScore > 0.6; // Lower threshold for address
      scores.address = Math.round(addressScore * 100);
    }

    const matchCount = Object.values(matches).filter(Boolean).length;
    const totalFields = Object.keys(matches).length;
    const overallMatch = matchCount >= Math.ceil(totalFields * 0.75); // 75% of fields must match

    return {
      matches,
      scores,
      matchCount,
      totalFields,
      overallMatch,
      matchPercentage: Math.round((matchCount / totalFields) * 100)
    };
  },

  // Calculate string similarity using Levenshtein distance
  calculateStringSimilarity: (str1, str2) => {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 1 : (maxLen - matrix[len2][len1]) / maxLen;
  },

  // Compare dates with flexible formatting
  compareDates: (date1, date2) => {
    const normalizeDate = (dateStr) => {
      // Handle various date formats: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
    const cleaned = dateStr.replace(/[-/]/g, '/');
      const parts = cleaned.split('/');

      if (parts.length === 3) {
        // Assume DD/MM/YYYY format for Indian IDs
        if (parts[2].length === 4) {
          return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
      return cleaned;
    };

    try {
      const normalizedDate1 = normalizeDate(date1.toString());
      const normalizedDate2 = normalizeDate(date2.toString());
      return normalizedDate1 === normalizedDate2;
    } catch (error) {
      console.error('Date comparison error:', error);
      return false;
    }
  }
};

// Step-by-step voter verification endpoint with government ID validation
/*
  The /verify-voter-step route has been disabled in the mock server to avoid
  runtime errors related to biometric modules (faceComparison, idVerification,
  etc.) which are not available in the local/mock setup. If you need this
  functionality, restore the biometric modules and uncomment the implementation.

  For now we provide a simple stub response below.
*/

/* Removed large biometric handling code to keep mock server lightweight. */

// Step-by-step verification endpoint (used by frontend VerifyVoter component)
app.post('/verify-voter-step', upload.fields([
  { name: 'selfie', maxCount: 1 },
  { name: 'idImage', maxCount: 1 },
  { name: 'videoFrame', maxCount: 1 }
]), async (req, res) => {
  try {
    const step = req.body.step || 'selfie';

    // Helper to safely read uploaded file buffer
    const readFileBuffer = (fileArray) => {
      try {
        if (!fileArray || fileArray.length === 0) return null;
        return fs.readFileSync(fileArray[0].path);
      } catch (err) {
        return null;
      }
    };

    // Selfie step removed in simplified flow. Start with ID verification.

    if (step === 'id') {
      // Determine user identity (username or email) and whether this is the demo/test user
      const usernameOrEmail = (req.body && (req.body.username || req.body.email || req.body.user)) || null;
      const isDemoFlag = req.body && (req.body.testUser === 'true' || req.body.demo === 'true');

      // Find mock voter if available
      const matchedVoter = mockVoters.find(v => v.username === usernameOrEmail || v.email === usernameOrEmail);
      const isDemoUser = isDemoFlag || usernameOrEmail === 'testuser' || usernameOrEmail === 'user@gmail.com' || (matchedVoter && matchedVoter.username === 'testuser');

      const idBuffer = readFileBuffer(req.files?.idImage);
      const selfieBuffer = readFileBuffer(req.files?.selfie);

      // If no id uploaded, reject
      if (!idBuffer) {
        return res.status(400).json({ success: false, message: 'Government ID document is required', verificationStep: 'id' });
      }

      // Demo user: accept any ID (even invalid) for demonstration. Match extracted name to the registered demo user if present.
      if (isDemoUser) {
        // Try to scan, but if scan fails, fabricate a result that matches the mock voter
        let idScanResult = await faceRecognition.scanIDDocument(idBuffer).catch(() => null);

        if (!idScanResult || !idScanResult.success) {
          const demoName = matchedVoter ? `${matchedVoter.firstName || matchedVoter.name} ${matchedVoter.lastName || ''}`.trim() || 'Demo User' : 'Demo User';
          idScanResult = {
            success: true,
            extractedData: {
              name: demoName,
              idNumber: `DEMO-${Date.now().toString().slice(-6)}`,
              idType: 'DEMO_ID',
              dateOfBirth: '01/01/1990',
            },
            extractedText: `DEMO ID for ${demoName}`,
            idFace: {
              detected: true,
              confidence: 0.9
            },
            validation: { isValid: true, errors: [], warnings: [] },
            confidence: 90
          };
        }

        // If selfie provided, compare selfie <-> id face for a similarity percentage
        let similarityPercentage = null;
        if (selfieBuffer) {
          const compare = await faceRecognition.compareFaces(selfieBuffer, idBuffer).catch(() => null);
          if (compare && compare.success) similarityPercentage = compare.similarityPercentage || Math.round((compare.similarity || 0) * 100);
        }

        return res.json({
          success: true,
          message: 'Government ID accepted for demo user (mock acceptance)',
          verificationStep: 'id',
          governmentIdType: idScanResult.extractedData?.idType || 'DEMO_ID',
          governmentIdVerified: true,
          extractedData: idScanResult.extractedData,
          extractedText: idScanResult.extractedText,
          similarityPercentage: similarityPercentage,
          acceptedIdTypes: ['ANY (DEMO)']
        });
      }

      // Non-demo users: treat ID verification as virtual/bypassed in mock environment and do not record or count it.
      return res.json({
        success: true,
        message: 'Government ID verification bypassed (virtual) in mock environment',
        verificationStep: 'id_virtual',
        governmentIdVerified: 'virtual_bypass',
        extractedData: matchedVoter ? { matchedTo: `${matchedVoter.firstName || matchedVoter.name} ${matchedVoter.lastName || ''}`.trim() } : null,
        acceptedIdTypes: ['AADHAAR', 'VOTER_ID', 'DRIVING_LICENCE', 'PASSPORT']
      });
    }

    if (step === 'video') {
      const idBuffer = readFileBuffer(req.files?.idImage);
      const videoBuffer = readFileBuffer(req.files?.videoFrame);

      if (!videoBuffer) {
        return res.status(400).json({ success: false, message: 'Video frame is required for video verification', verificationStep: 'video' });
      }

      // Require id to perform comprehensive comparison (selfie removed from flow)
      if (!idBuffer) {
        return res.status(400).json({ success: false, message: 'ID image is required for video verification', verificationStep: 'video' });
      }

      // Try to compare using multiple-face comparison if selfie provided, otherwise compare ID <-> video directly
      const selfieBuffer = readFileBuffer(req.files?.selfie);
      let comparison = null;

      if (selfieBuffer) {
        comparison = await faceRecognition.compareMultipleFaces(selfieBuffer, idBuffer, videoBuffer, { minThreshold: 0.6 });
      } else {
        // Fallback: compare ID photo to video frame using compareFaces
        const idToVideo = await faceRecognition.compareFaces(idBuffer, videoBuffer, { minThreshold: 0.6 }).catch(() => null);
        if (!idToVideo || !idToVideo.success) {
          return res.status(403).json({ success: false, message: idToVideo?.error || 'Face comparison failed', verificationStep: 'face_matching', details: idToVideo });
        }

        comparison = {
          success: idToVideo.success,
          isMatch: idToVideo.isMatch,
          averageSimilarityPercentage: idToVideo.similarityPercentage || Math.round((idToVideo.similarity || 0) * 100),
          weightedSimilarityPercentage: idToVideo.similarityPercentage || Math.round((idToVideo.similarity || 0) * 100),
          comparisons: { idToVideo }
        };
      }

      if (!comparison.success) {
        return res.status(403).json({ success: false, message: comparison.error || 'Face comparison failed', verificationStep: 'face_matching', details: comparison });
      }

      if (!comparison.isMatch) {
        // record invalid attempt
        const invalidVoteRecord = {
          _id: Date.now().toString(),
          violationType: 'face_mismatch',
          violationDetails: 'Face matching failed during video verification',
          timestamp: new Date().toISOString(),
          similarityPercentage: comparison.averageSimilarityPercentage
        };
        mockInvalidVotes.push(invalidVoteRecord);

        return res.status(403).json({
          success: false,
          message: `Face matching failed. Similarity (${comparison.averageSimilarityPercentage}%) is outside required range.`,
          verificationStep: 'face_matching',
          similarityPercentage: comparison.averageSimilarityPercentage,
          weightedSimilarityPercentage: comparison.weightedSimilarityPercentage,
          details: comparison
        });
      }

      const verificationId = `verify-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

      return res.json({
        success: true,
        message: `Voter verified successfully with ${comparison.averageSimilarityPercentage}% similarity`,
        verificationStep: 'complete',
        similarityPercentage: comparison.averageSimilarityPercentage,
        weightedSimilarityPercentage: comparison.weightedSimilarityPercentage,
        verificationId,
        faceComparison: comparison
      });
    }

    // Pose verification: validate that a single clear face is visible in the provided poseImage
    if (step === 'pose') {
      const poseBuffer = readFileBuffer(req.files?.poseImage);
      const poseDirection = req.body?.poseDirection || 'unknown';

      if (!poseBuffer) {
        return res.status(400).json({ success: false, message: 'Pose image is required', verificationStep: 'pose' });
      }

      const detectResult = await faceRecognition.detectFaces(poseBuffer).catch(() => null);
      if (!detectResult || !detectResult.success) {
        return res.status(400).json({ success: false, message: 'No face detected or face detection failed', verificationStep: 'pose', details: detectResult });
      }

      if (detectResult.faceCount !== 1) {
        return res.status(400).json({ success: false, message: 'Please ensure only one face is visible and try again', verificationStep: 'pose', faceCount: detectResult.faceCount });
      }

      // Check detection score threshold
      const score = detectResult.detections?.[0]?.detection?.score || 0;
      const requiredScore = 0.75; // require clearer face for pose steps
      if (score < requiredScore) {
        return res.status(400).json({ success: false, message: `Face not clear enough. Please adjust lighting/position and try again (required ${Math.round(requiredScore*100)}%)`, verificationStep: 'pose', detectionScore: Math.round(score * 100), requiredScore: Math.round(requiredScore*100) });
      }

      return res.json({ success: true, message: 'Pose image accepted', verificationStep: 'pose', poseDirection, detectionScore: Math.round(score * 100) });
    }

    // Unknown step
    return res.status(400).json({ success: false, message: 'Unknown verification step', verificationStep: step });
  } catch (error) {
    console.error('verify-voter-step error:', error);
    return res.status(500).json({ success: false, message: 'Server error during verification step', error: error.message });
  }
});

// Advanced voter verification endpoint with face matching (original - kept for backward compatibility)
app.post('/verify-voter', upload.fields([
  { name: 'selfie', maxCount: 1 },
  { name: 'idImage', maxCount: 1 },
  { name: 'videoFrame', maxCount: 1 } // Required for enhanced security
]), async (req, res) => {
  try {
    console.log('Received verification request');

    // Check if required files are provided
    if (!req.files || !req.files.selfie || !req.files.idImage) {
      return res.status(400).json({
        success: false,
        message: 'Both selfie and ID image are required for verification',
        verificationStep: 'file_validation'
      });
    }

    // Make video frame mandatory for enhanced security
    if (!req.files.videoFrame || req.files.videoFrame.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Live video capture is required for verification',
        verificationStep: 'file_validation'
      });
    }

    console.log('All required files provided. Processing...');

    // Get file paths
    const selfiePath = req.files.selfie[0].path;
    const idImagePath = req.files.idImage[0].path;
    const videoFramePath = req.files.videoFrame[0].path;

    // Read file buffers
    const selfieBuffer = fs.readFileSync(selfiePath);
    const idImageBuffer = fs.readFileSync(idImagePath);
    const videoFrameBuffer = fs.readFileSync(videoFramePath);

    // Set face matching thresholds (60% to 80% similarity)
    const options = {
      minThreshold: 0.6, // 60% similarity
      maxThreshold: 0.8  // 80% similarity
    };

    console.log('Starting face comparison process...');

    // Compare all three: selfie, ID, and video frame
    const faceComparisonResult = await faceRecognition.compareMultipleFaces(
      selfieBuffer,
      idImageBuffer,
      videoFrameBuffer,
      options
    );

    console.log('Face comparison complete:', JSON.stringify({
      success: faceComparisonResult.success,
      isMatch: faceComparisonResult.isMatch,
      averageSimilarityPercentage: faceComparisonResult.averageSimilarityPercentage,
      failureReason: faceComparisonResult.failureReason
    }));

    // Check if face detection was successful
    if (!faceComparisonResult.success) {
      return res.status(403).json({
        success: false,
        message: faceComparisonResult.error || 'Face detection failed. Please ensure your face is clearly visible in all images.',
        verificationStep: faceComparisonResult.verificationStep || 'face_detection',
        image: faceComparisonResult.image || 'unknown',
        details: faceComparisonResult
      });
    }

    // Check if faces match within the threshold
    if (!faceComparisonResult.isMatch) {
      // Record the invalid vote attempt for security purposes
      const invalidVoteRecord = {
        _id: Date.now().toString(),
        violationType: 'face_mismatch',
        violationDetails: faceComparisonResult.failureReason || 'Face matching failed',
        timestamp: new Date().toISOString(),
        similarityPercentage: faceComparisonResult.averageSimilarityPercentage
      };

      mockInvalidVotes.push(invalidVoteRecord);

      return res.status(403).json({
        success: false,
        message: faceComparisonResult.failureReason ||
          `Face matching failed. Similarity (${faceComparisonResult.averageSimilarityPercentage}%) is outside the required range (60%-80%).`,
        verificationStep: 'face_matching',
        similarityPercentage: faceComparisonResult.averageSimilarityPercentage,
        weightedSimilarityPercentage: faceComparisonResult.weightedSimilarityPercentage,
        thresholds: {
          min: Math.round(options.minThreshold * 100),
          max: Math.round(options.maxThreshold * 100)
        },
        details: {
          comparisons: faceComparisonResult.comparisons,
          invalidVoteId: invalidVoteRecord._id
        }
      });
    }

    // Generate a secure verification ID
    const verificationId = `verify-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    // Return success with similarity details
    res.json({
      success: true,
      message: `Voter verified successfully with ${faceComparisonResult.averageSimilarityPercentage}% similarity`,
      similarityPercentage: faceComparisonResult.averageSimilarityPercentage,
      weightedSimilarityPercentage: faceComparisonResult.weightedSimilarityPercentage,
      verificationId: verificationId,
      details: {
        thresholds: {
          min: Math.round(options.minThreshold * 100),
          max: Math.round(options.maxThreshold * 100)
        },
        comparisons: {
          selfieToId: faceComparisonResult.comparisons.selfieToId ? {
            similarityPercentage: faceComparisonResult.comparisons.selfieToId.similarityPercentage
          } : null,
          selfieToVideo: faceComparisonResult.comparisons.selfieToVideo ? {
            similarityPercentage: faceComparisonResult.comparisons.selfieToVideo.similarityPercentage
          } : null,
          idToVideo: faceComparisonResult.comparisons.idToVideo ? {
            similarityPercentage: faceComparisonResult.comparisons.idToVideo.similarityPercentage
          } : null
        }
      }
    });
  } catch (error) {
    console.error('Error verifying voter:', error);
    res.status(500).json({
      success: false,
      message: 'Error during verification',
      error: error.message
    });
  }
});

// Update candidate votes with verification
app.patch('/getCandidate/:id', (req, res) => {
  const candidate = mockCandidates.find(c => c._id === req.params.id);

  if (!candidate) {
    return res.status(404).json({ success: false, message: 'Candidate not found' });
  }

  // Check if verification was done (in a real app, we would validate the verification token)
  const { verificationId } = req.body;

  if (!verificationId) {
    return res.status(403).json({
      success: false,
      message: 'Voter verification required before voting'
    });
  }

  candidate.votes += 1;

  res.json({
    success: true,
    votes: candidate.votes
  });
});

// Update voter status
app.patch('/updateVoter/:id', (req, res) => {
  res.json({
    success: true,
    voter: {
      _id: '1',
      voteStatus: true
    }
  });
});

// Get dashboard data
app.get('/getDashboardData', (req, res) => {
  res.json({
    success: true,
    DashboardData: {
      voterCount: 10,
      candidateCount: 3,
      votersVoted: 5
    }
  });
});

// Get all voters
app.get('/getVoter', (req, res) => {
  res.json({
    success: true,
    voter: mockVoters
  });
});

// Get voter by ID
app.get('/getVoterbyID/:id', (req, res) => {
  const voter = mockVoters.find(v => v._id === req.params.id);

  if (!voter) {
    return res.status(404).json({ success: false, message: 'Voter not found' });
  }

  res.json({
    success: true,
    voter
  });
});

// Create a new candidate
app.post('/createCandidate', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'symbol', maxCount: 1 }
]), (req, res) => {
  try {
    const { firstName, lastName, age, party, bio } = req.body;

    // Generate a new ID (in a real app, this would be handled by the database)
    const newId = (mockCandidates.length + 1).toString();

    // Handle file uploads
    let imagePath = 'default-candidate.jpg';
    let symbolPath = 'default-symbol.jpg';

    if (req.files) {
      if (req.files.image && req.files.image.length > 0) {
        imagePath = req.files.image[0].filename;
      }

      if (req.files.symbol && req.files.symbol.length > 0) {
        symbolPath = req.files.symbol[0].filename;
      }
    }

    const newCandidate = {
      _id: newId,
      firstName,
      fullName: `${firstName} ${lastName || ''}`,
      age: parseInt(age),
      party,
      bio,
      image: imagePath,
      symbol: symbolPath,
      votes: 0
    };

    mockCandidates.push(newCandidate);

    res.status(201).json({
      success: true,
      candidate: newCandidate
    });
  } catch (error) {
    console.error('Error creating candidate:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating candidate',
      error: error.message
    });
  }
});

// Get all elections
app.get('/getElections', (req, res) => {
  res.json({
    success: true,
    elections: mockElections
  });
});

// Create a new election
app.post('/createElection', (req, res) => {
  const { name, description, startDate, endDate } = req.body;

  // Generate a new ID (in a real app, this would be handled by the database)
  const newId = (mockElections.length + 1).toString();

  const newElection = {
    _id: newId,
    name,
    description,
    startDate,
    endDate,
    status: 'upcoming'
  };

  mockElections.push(newElection);

  res.status(201).json({
    success: true,
    election: newElection
  });
});

// Record an invalid vote due to security violation
app.post('/recordInvalidVote', (req, res) => {
  try {
    const { voterId, candidateId, violationType, violationDetails } = req.body;

    // Validate required fields
    if (!voterId || !candidateId || !violationType || !violationDetails) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields for invalid vote record'
      });
    }

    // Create a new invalid vote record
    const newInvalidVote = {
      _id: Date.now().toString(),
      voterId,
      candidateId,
      violationType,
      violationDetails,
      timestamp: new Date().toISOString(),
      evidenceData: req.body.evidenceData || null
    };

    // Add to mock data
    mockInvalidVotes.push(newInvalidVote);

    // Return success
    res.status(201).json({
      success: true,
      message: 'Invalid vote recorded successfully',
      invalidVote: newInvalidVote
    });
  } catch (error) {
    console.error('Error recording invalid vote:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording invalid vote',
      error: error.message
    });
  }
});

// Get all invalid votes (for admin dashboard)
app.get('/getInvalidVotes', (req, res) => {
  res.json({
    success: true,
    invalidVotes: mockInvalidVotes
  });
});

// Add a route for health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is healthy' });
});



// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Server time: ${new Date().toISOString()}`);
});
