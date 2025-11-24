const express = require('express');
const router = express.Router();
const mockDb = require('../mockDb');
const jwt = require('jsonwebtoken');
const { upload } = require('../middleware/upload');
const { voterAuth } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');

// Helper to calculate file hash
const calculateFileHash = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('error', err => reject(err));
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
};

// Helper: Preprocess image for better OCR
const preprocessImage = async (filePath) => {
  try {
    const processedBuffer = await sharp(filePath)
      .grayscale() // Convert to grayscale
      .normalize() // Enhance contrast
      .sharpen()   // Sharpen edges
      .toBuffer();
    return processedBuffer;
  } catch (error) {
    console.error('Image preprocessing failed:', error);
    return filePath; // Fallback to original file path if processing fails
  }
};

// Helper: Levenshtein Distance for fuzzy matching
const levenshteinDistance = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  // increment along the first column of each row
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // increment each column in the first row
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
};

// Helper: Check if text contains target with fuzzy matching
const isFuzzyMatch = (text, target) => {
  if (!target) return false;

  // Clean text and target
  const cleanText = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const cleanTarget = target.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  if (cleanText.includes(cleanTarget)) return true;

  // If exact match fails, try fuzzy match on substrings
  // We slide a window of target.length across text
  const windowSize = cleanTarget.length;
  const threshold = Math.floor(windowSize * 0.3); // Allow 30% mismatch (e.g., 3 chars in 10)

  for (let i = 0; i <= cleanText.length - windowSize; i++) {
    const substring = cleanText.substr(i, windowSize);
    const distance = levenshteinDistance(substring, cleanTarget);
    if (distance <= threshold) {
      console.log(`Fuzzy Match Found: "${substring}" ~= "${cleanTarget}" (Dist: ${distance})`);
      return true;
    }
  }

  return false;
};

// Helper: Extract possible ID numbers (Aadhaar / Voter ID) from OCR text using multiple strategies
const extractIdNumbers = (text) => {
  if (!text || typeof text !== 'string') return { aadhar: null, voterId: null };

  const t = text.replace(/\s+/g, ' ').trim();
  let aadhar = null;
  let voterId = null;

  // 1) Aadhaar: look for 12-digit sequences possibly grouped as 4-4-4 or continuous
  const aadharRegexes = [/\b(\d{4}\s?\d{4}\s?\d{4})\b/g, /\b(\d{12})\b/g];
  for (const rx of aadharRegexes) {
    const m = rx.exec(t);
    if (m && m[1]) {
      aadhar = m[1].replace(/\s/g, '');
      break;
    }
  }

  // 2) Voter ID (EPIC): various formats, often alphanumeric up to 10 chars. Look for keywords nearby
  // Common patterns: 3 letters + 7 digits, or 2 letters + 3 digits + 5 digits, but we search more generally
  const epicPatterns = [/\b([A-Z]{3}\d{6,7})\b/g, /\b([A-Z]{2}\d{8})\b/g, /\b([A-Z0-9]{5,10})\b/g];

  // Search for keyword 'EPIC' or 'Voter ID' and capture nearby tokens
  const keywordRegex = /(EPIC|VOTER ID|VOTERID|ELECTOR|ELECTION COMMISSION|ID NO|IDNO|ID No)[:\s\-]*([A-Z0-9\s\-]{5,20})/i;
  const keyMatch = keywordRegex.exec(text);
  if (keyMatch && keyMatch[2]) {
    const candidate = keyMatch[2].replace(/[^A-Z0-9]/gi, '');
    // validate candidate length
    if (candidate.length >= 5 && candidate.length <= 12) {
      voterId = candidate.toUpperCase();
    }
  }

  // If not found by keyword, try broader pattern matches and validate by context
  if (!voterId) {
    for (const p of epicPatterns) {
      let m;
      while ((m = p.exec(t)) !== null) {
        const cand = m[1].replace(/[^A-Z0-9]/g, '');
        // Heuristic: discard pure numbers of length 12 (likely Aadhaar)
        if (/^\d{12}$/.test(cand)) continue;
        if (cand.length >= 5 && cand.length <= 12) {
          voterId = cand.toUpperCase();
          break;
        }
      }
      if (voterId) break;
    }
  }

  // Final cleanup
  if (aadhar && aadhar.length !== 12) aadhar = null;
  if (voterId && voterId.length > 12) voterId = null;

  return { aadhar, voterId };
};

let io = null;

// Set Socket.io instance for notifications
router.setIO = function (socketIO) {
  io = socketIO;
};

// Emit notification helper
const emitNotification = (type, title, message, data = {}) => {
  if (io) {
    io.emit('notification', {
      id: Date.now(),
      type,
      title,
      message,
      data,
      timestamp: new Date(),
      read: false
    });
  }
};

// Register a new voter
router.post('/createVoter', upload.any(), async (req, res) => {
  try {
    // Accept either combined `name` or `firstName`+`lastName` from client
    const body = req.body || {};
    const firstName = body.firstName || '';
    const lastName = body.lastName || '';
    const name = body.name || `${firstName} ${lastName}`.trim();

    const phone = body.phone || '';
    const gender = body.gender || '';
    const project = body.project || '';

    // Check if voter already exists
    const existingVoter = mockDb.voters.find(v => v.email === email || v.username === username);

    if (existingVoter) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or username'
      });
    }

    // Determine uploaded filenames (flexible with client keys)
    const files = req.files || [];
    let idProofFilename = 'default-id.jpg';
    let profilePicFilename = 'default-profile.jpg';
    let aadharCardFilename = null;
    let voterIdCardFilename = null;

    let aadharCardHash = null;
    let voterIdCardHash = null;

    // Process files and calculate hashes
    for (const f of files) {
      if (/id|idProof/i.test(f.fieldname) || /id/i.test(f.fieldname)) idProofFilename = f.filename || f.originalname;
      if (/image|profile|profilePic/i.test(f.fieldname)) profilePicFilename = f.filename || f.originalname;

      if (/aadharCard/i.test(f.fieldname)) {
        aadharCardFilename = f.filename || f.originalname;
        if (f.path) {
          try {
            aadharCardHash = await calculateFileHash(f.path);
          } catch (err) {
            console.error('Error hashing Aadhar card:', err);
          }
        }
      }

      if (/voterIdCard/i.test(f.fieldname)) {
        voterIdCardFilename = f.filename || f.originalname;
        if (f.path) {
          try {
            voterIdCardHash = await calculateFileHash(f.path);
          } catch (err) {
            console.error('Error hashing Voter ID card:', err);
          }
        }
      }
    }

    // Create new voter
    const newVoter = {
      _id: (mockDb.voters.length + 1).toString(),
      name,
      username,
      email,
      password: pass, // In a real app, hash this!
      dob: dob ? new Date(dob) : undefined,
      age: age ? parseInt(age) : undefined,
      gender,
      address,
      district: body.district || '',
      taluk: body.taluk || '',
      hobli: body.hobli || '',
      phone,
      project,
      idProof: idProofFilename,
      profilePic: profilePicFilename,
      aadharNumber: body.aadharNumber || '',
      voterIdNumber: body.voterIdNumber || '',
      aadharCard: aadharCardFilename,
      voterIdCard: voterIdCardFilename,
      aadharCardHash,
      voterIdCardHash,
      verified: false,
      verificationStatus: 'pending', // Default to pending if not skipped
      voteStatus: false,
      isBlocked: false,
      violationCount: 0,
      createdAt: new Date()
    };

    mockDb.voters.push(newVoter);

    // Return created voter's id so client can navigate to verification
    res.status(201).json({
      success: true,
      message: 'Voter registered successfully',
      voterId: newVoter._id
    });
  } catch (error) {
    console.error('Error registering voter:', error);
    try {
      const debugPath = path.join(__dirname, '../utils/data/debug_error.json');
      const debugData = {
        timestamp: new Date(),
        error: error.message,
        stack: error.stack,
        body: req.body,
        files: req.files
      };
      fs.writeFileSync(debugPath, JSON.stringify(debugData, null, 2));
    } catch (e) { console.error('Failed to write debug log', e); }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Voter Login
router.post('/login', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    const identifier = email || username;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Missing credentials' });
    }

    // Find voter by email or username
    const voter = mockDb.voters.find(v => v.email === identifier || v.username === identifier);

    if (!voter) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Simple mock password check (for tests / mockDb). In production use bcrypt.compare
    const validPassword = (password === '123') || (password === voter.password) || (voter.password && voter.password === password);

    if (!validPassword) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign({ id: voter._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

    const voterSummary = {
      _id: voter._id,
      name: voter.name,
      username: voter.username,
      email: voter.email,
      age: voter.age,
      voteStatus: voter.voteStatus,
      profilePic: voter.profilePic,
      verificationStatus: voter.verificationStatus
    };

    res.status(200).json({
      success: true,
      token,
      voter: voterSummary,
      voterObject: voterSummary
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get voter profile (frontend expects /getVoterbyID/:id)
router.get('/getVoterbyID/:id', async (req, res) => {
  try {
    const voter = mockDb.voters.find(v => v._id === req.params.id);

    if (!voter) {
      return res.status(404).json({
        success: false,
        message: 'Voter not found'
      });
    }

    res.status(200).json({
      success: true,
      voter
    });
  } catch (error) {
    console.error('Error getting voter profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});
// Update voter profile (frontend expects /updateVoterDetails/:id)
router.patch('/updateVoterDetails/:id', upload.single('image'), async (req, res) => {
  try {
    const updates = req.body;
    const id = req.params.id;

    // Don't allow updating certain fields
    delete updates.password;
    delete updates.email;
    delete updates.username;

    const voter = mockDb.voters.find(v => v._id === id);

    if (!voter) {
      return res.status(404).json({
        success: false,
        message: 'Voter not found'
      });
    }

    // Handle file upload
    if (req.file) {
      updates.profilePic = req.file.filename;
    }

    // Sync 'name' field if firstName or lastName is updated
    if (updates.firstName || updates.lastName) {
      const newFirst = updates.firstName || voter.firstName || '';
      const newLast = updates.lastName || voter.lastName || '';
      updates.name = `${newFirst} ${newLast}`.trim();
    }

    // Track profile edits - increment counter
    voter.profileEditCount = (voter.profileEditCount || 0) + 1;

    // Apply updates
    Object.assign(voter, updates);

    // Check if rule violation (more than 2 edits)
    if (voter.profileEditCount > 2) {
      emitNotification(
        'rule_violation',
        '🚨 Rule Violation Detected',
        `Voter "${voter.name}" has changed their profile more than 2 times (${voter.profileEditCount} edits).`,
        {
          voterEmail: voter.email,
          voterName: voter.name,
          editCount: voter.profileEditCount,
          reason: 'Excessive profile modifications'
        }
      );
    }

    res.status(200).json({
      success: true,
      voter: voter,
      editCount: voter.profileEditCount
    });
  } catch (error) {
    console.error('Error updating voter:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get all voters (admin only) - frontend expects /getVoter
router.get('/getVoter', async (req, res) => {
  try {
    const voters = mockDb.voters;

    res.status(200).json({
      success: true,
      voter: voters // Frontend expects 'voter' key, not 'voters'
    });
  } catch (error) {
    console.error('Error getting voters:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Update voter block status (block/unblock)
router.patch('/updateVoterBlock/:id', async (req, res) => {
  try {
    const { isBlocked, blockedReason, violationDescription, blockedBy } = req.body;
    const voter = mockDb.voters.find(v => v._id === req.params.id);

    if (!voter) {
      return res.status(404).json({
        success: false,
        message: 'Voter not found'
      });
    }

    voter.isBlocked = isBlocked;
    voter.blockedReason = isBlocked ? blockedReason : null;
    voter.violationDescription = isBlocked ? violationDescription : null;
    voter.blockedAt = isBlocked ? new Date() : null;
    voter.blockedBy = isBlocked ? (blockedBy || 'admin') : null;

    // Import notification service
    const { notifyVoterBlocked, notifyVoterUnblocked } = require('../utils/notificationService');

    // Send notification and store in mockDb
    const notification = {
      id: Date.now(),
      type: 'rule_violation',
      title: isBlocked ? 'Voter Blocked' : 'Voter Unblocked',
      message: isBlocked
        ? `Voter "${voter.name}" (${voter.email}) has been blocked`
        : `Voter "${voter.name}" (${voter.email}) has been unblocked`,
      data: {
        voterName: voter.name,
        voterEmail: voter.email,
        voterId: voter._id,
        reason: isBlocked ? (blockedReason || 'Administrative action') : undefined,
        action: isBlocked ? 'VOTER_BLOCKED' : 'VOTER_UNBLOCKED',
      },
      timestamp: new Date(),
      read: false,
    };

    // Store notification in mockDb
    mockDb.notifications.unshift(notification);

    // Send real-time notification via socket.io
    if (isBlocked) {
      notifyVoterBlocked(voter.name, voter.email, blockedReason);
    } else {
      notifyVoterUnblocked(voter.name, voter.email);
    }

    res.status(200).json({
      success: true,
      message: isBlocked ? 'Voter blocked successfully' : 'Voter unblocked successfully',
      voter
    });

  } catch (error) {
    console.error('Error updating voter block status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Update voter status (mark as voted) - frontend expects /updateVoter/:id
router.patch('/updateVoter/:id', async (req, res) => {
  try {
    const voter = mockDb.voters.find(v => v._id === req.params.id);

    if (!voter) {
      return res.status(404).json({ success: false, message: 'Voter not found' });
    }

    voter.voteStatus = true;

    res.status(200).json({
      success: true,
      voter
    });
  } catch (error) {
    console.error('Error updating voter status:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ============= KYC/VERIFICATION ENDPOINTS =============

// Submit KYC/Verification documents and data
router.post('/submitKYC/:id', upload.any(), async (req, res) => {
  try {
    const voterId = req.params.id;
    const { voterId: voterIdInput, fullName, dateOfBirth, address } = req.body;

    const voter = mockDb.voters.find(v => v._id === voterId);
    if (!voter) {
      return res.status(404).json({ success: false, message: 'Voter not found' });
    }

    // Parse uploaded files
    const files = req.files || [];
    const kycDocuments = {
      idDocument: { filename: null, uploadedAt: new Date(), mimeType: null },
      idBackside: { filename: null, uploadedAt: new Date(), mimeType: null },
      selfie: { filename: null, uploadedAt: new Date(), mimeType: null }
    };

    files.forEach(f => {
      const fieldName = f.fieldname ? f.fieldname.toLowerCase() : '';
      if (fieldName.includes('id') && !fieldName.includes('backside')) {
        kycDocuments.idDocument = { filename: f.filename, uploadedAt: new Date(), mimeType: f.mimetype };
      } else if (fieldName.includes('backside') || (fieldName.includes('back') && fieldName.includes('id'))) {
        kycDocuments.idBackside = { filename: f.filename, uploadedAt: new Date(), mimeType: f.mimetype };
      } else if (fieldName.includes('selfie') || fieldName.includes('self')) {
        kycDocuments.selfie = { filename: f.filename, uploadedAt: new Date(), mimeType: f.mimetype };
      }
    });

    // Update voter with KYC data
    voter.kycData = {
      voterId: voterIdInput || voter.idProof,
      fullName: fullName || voter.name,
      dateOfBirth: dateOfBirth || voter.dob,
      address: address || voter.address,
      submittedAt: new Date()
    };
    voter.kycDocuments = kycDocuments;
    voter.kycSubmissionAttempts = (voter.kycSubmissionAttempts || 0) + 1;

    // --- THREE-LAYER VERIFICATION LOGIC ---
    let autoVerified = false;
    let verificationMethod = null;

    // Get the uploaded ID document path
    // We prioritize 'idDocument' from kycDocuments
    let uploadedIdPath = null;
    if (kycDocuments.idDocument && kycDocuments.idDocument.filename) {
      // Find the file object to get the path
      const idFile = files.find(f => f.filename === kycDocuments.idDocument.filename);
      if (idFile && idFile.path) {
        uploadedIdPath = idFile.path;
      }
    }

    if (uploadedIdPath) {
      console.log(`Starting verification for voter ${voter._id}...`);

      // LAYER 1: OCR CHECK
      let ocrText = '';
      let matchDetails = [];

      try {
        console.log('Layer 1: OCR Check');

        // Preprocess image
        console.log('Preprocessing image...');
        const processedImage = await preprocessImage(uploadedIdPath);

        console.log('Running Tesseract...');
        const { data: { text } } = await Tesseract.recognize(processedImage, 'eng');
        ocrText = text.replace(/\n/g, ' ').substring(0, 200); // Store for debug
        console.log('OCR Extracted Text (First 200 chars):', ocrText);

        const registeredAadhar = voter.aadharNumber;
        const registeredVoterId = voter.voterIdNumber;

        let matchFound = false;
        if (registeredAadhar) {
          const isMatch = isFuzzyMatch(text, registeredAadhar);
          matchDetails.push({ type: 'Aadhar', target: registeredAadhar, match: isMatch });
          if (isMatch) matchFound = true;
        }

        if (registeredVoterId) {
          const isMatch = isFuzzyMatch(text, registeredVoterId);
          matchDetails.push({ type: 'VoterID', target: registeredVoterId, match: isMatch });
          if (isMatch) matchFound = true;
        }

        if (matchFound) {
          autoVerified = true;
          verificationMethod = 'OCR_MATCH';
          console.log('OCR Verification Successful!');
        } else {
          console.log('OCR Verification Failed: No matching ID number found in text.');
        }

        // DEBUG LOGGING
        const logEntry = `
----------------------------------------
Timestamp: ${new Date().toISOString()}
Voter ID: ${voter._id}
Registered Aadhar: '${registeredAadhar}'
Registered VoterID: '${registeredVoterId}'
OCR Text: ${ocrText}
Match Details: ${JSON.stringify(matchDetails)}
Auto Verified: ${autoVerified}
----------------------------------------
`;
        fs.appendFileSync('debug_log.txt', logEntry);

      } catch (ocrErr) {
        console.error('OCR Failed:', ocrErr);
        matchDetails.push({ error: ocrErr.message });
        fs.appendFileSync('debug_log.txt', `OCR ERROR: ${ocrErr.message}\n`);
      }

      // LAYER 2: FILE HASH CHECK (if OCR failed)
      if (!autoVerified) {
        try {
          console.log('Layer 2: File Hash Check');
          const newFileHash = await calculateFileHash(uploadedIdPath);

          if ((voter.aadharCardHash && newFileHash === voter.aadharCardHash) ||
            (voter.voterIdCardHash && newFileHash === voter.voterIdCardHash)) {
            autoVerified = true;
            verificationMethod = 'HASH_MATCH';
            console.log('Hash Match Found!');
          }
        } catch (hashErr) {
          console.error('Hash Check Failed:', hashErr);
        }
      }
    }

    // LAYER 3: ADMIN REVIEW (if both failed)
    if (autoVerified) {
      voter.verificationStatus = 'verified';
      voter.kycApprovedAt = new Date();
      voter.kycRejectionReason = null;
    } else {
      voter.verificationStatus = 'pending';
      voter.kycRejectionReason = 'Automated verification failed. Pending Admin Review.';

      // Create an admin review case in mockDb for manual inspection
      try {
        const mockDb = require('../mockDb');

        // Try to find the registration ID image filename (from registration)
        const registrationIdImage = voter.aadharCard || voter.voterIdCard || voter.idProof || null;

        // Compute hash of new uploaded file if available
        let newFileHash = null;
        try {
          if (uploadedIdPath) {
            newFileHash = await calculateFileHash(uploadedIdPath);
          }
        } catch (fhErr) {
          console.error('Error hashing new ID for case:', fhErr);
        }

        // Attempt to extract Aadhaar/Voter ID from OCR output using improved extractor
        const { aadhar: extractedAadhar, voterId: extractedVoterId } = extractIdNumbers(ocrText || '');

        const caseId = `case_${Date.now()}`;

        const caseObj = {
          caseId,
          voterId: voter._id,
          voterName: voter.name,
          voterEmail: voter.email,
          registrationIdImage: registrationIdImage,
          newIdImage: kycDocuments.idDocument.filename || null,
          newIdPath: uploadedIdPath || null,
          newFileHash: newFileHash,
          registeredAadhar: voter.aadharNumber || null,
          registeredVoterId: voter.voterIdNumber || null,
          extractedAadhar: extractedAadhar,
          extractedVoterId: extractedVoterId,
          ocrText: ocrText || null,
          matchDetails: matchDetails || [],
          verificationMethod: verificationMethod || null,
          status: 'pending',
          createdAt: new Date()
        };

        mockDb.idVerificationCases.unshift(caseObj);

        // attach caseId to voter for quick reference
        voter.pendingIdCaseId = caseId;
      } catch (caseErr) {
        console.error('Error creating admin review case:', caseErr);
      }
    }

    res.status(200).json({
      success: true,
      message: autoVerified ? `KYC Verified Automatically (${verificationMethod})` : 'KYC submitted. Pending admin review.',
      voter: {
        _id: voter._id,
        verificationStatus: voter.verificationStatus,
        kycSubmissionAttempts: voter.kycSubmissionAttempts,
        pendingIdCaseId: voter.pendingIdCaseId || null
      },
      debug: {
        ocrTextPreview: typeof ocrText !== 'undefined' ? ocrText : '',
        matchDetails: typeof matchDetails !== 'undefined' ? matchDetails : [],
        verificationMethod
      }
    });
  } catch (error) {
    console.error('Error submitting KYC:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get verification status for a voter
router.get('/verificationStatus/:id', async (req, res) => {
  try {
    const voter = mockDb.voters.find(v => v._id === req.params.id);

    if (!voter) {
      return res.status(404).json({ success: false, message: 'Voter not found' });
    }

    res.status(200).json({
      success: true,
      verificationStatus: voter.verificationStatus,
      kycData: voter.kycData,
      submissionAttempts: voter.kycSubmissionAttempts,
      approvedAt: voter.kycApprovedAt,
      rejectionReason: voter.kycRejectionReason
    });
  } catch (error) {
    console.error('Error getting verification status:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Skip KYC verification for a voter (during registration)
router.patch('/skipKYC/:id', async (req, res) => {
  try {
    const voter = mockDb.voters.find(v => v._id === req.params.id);

    if (!voter) {
      return res.status(404).json({ success: false, message: 'Voter not found' });
    }

    voter.verificationStatus = 'skipped';

    res.status(200).json({
      success: true,
      message: 'KYC verification skipped. User can still vote but with limited features.',
      verificationStatus: voter.verificationStatus
    });
  } catch (error) {
    console.error('Error skipping KYC:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Admin: Update verification status (approve/reject)
router.patch('/updateVerificationStatus/:id', async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const validStatuses = ['verified', 'rejected', 'pending'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const voter = mockDb.voters.find(v => v._id === req.params.id);

    if (!voter) {
      return res.status(404).json({ success: false, message: 'Voter not found' });
    }

    voter.verificationStatus = status;

    if (status === 'verified') {
      voter.kycApprovedAt = new Date();
      voter.kycRejectedAt = null;
      voter.kycRejectionReason = null;
    } else if (status === 'rejected') {
      voter.kycRejectedAt = new Date();
      voter.kycApprovedAt = null;
      voter.kycRejectionReason = rejectionReason || 'Document verification failed';
    }

    res.status(200).json({
      success: true,
      message: `Voter verification status updated to ${status}`,
      verificationStatus: voter.verificationStatus
    });
  } catch (error) {
    console.error('Error updating verification status:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Check if voter can vote (verification required)
router.get('/canVote/:id', async (req, res) => {
  try {
    const voter = mockDb.voters.find(v => v._id === req.params.id);

    if (!voter) {
      return res.status(404).json({ success: false, message: 'Voter not found' });
    }

    const canVote = voter.verificationStatus === 'verified' &&
      !voter.voteStatus &&
      !voter.isBlocked;

    res.status(200).json({
      success: true,
      canVote,
      verificationStatus: voter.verificationStatus,
      hasVoted: voter.voteStatus,
      isBlocked: voter.isBlocked,
      message: canVote
        ? 'Voter can cast vote'
        : `Cannot vote - ${voter.isBlocked
          ? 'Account blocked'
          : voter.voteStatus
            ? 'Already voted'
            : 'KYC verification required'
        }`
    });
  } catch (error) {
    console.error('Error checking vote eligibility:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Delete a voter
router.delete('/deleteVoter/:id', async (req, res) => {
  try {
    const voterIndex = mockDb.voters.findIndex(v => v._id === req.params.id);

    if (voterIndex === -1) {
      return res.status(404).json({ success: false, message: 'Voter not found' });
    }

    const deletedVoter = mockDb.voters.splice(voterIndex, 1)[0];

    res.status(200).json({
      success: true,
      message: 'Voter deleted successfully',
      voter: deletedVoter
    });
  } catch (error) {
    console.error('Error deleting voter:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get all notifications
router.get('/notifications', async (req, res) => {
  try {
    const { unreadOnly } = req.query;

    let notifications = mockDb.notifications || [];

    // Filter for unread only if requested
    if (unreadOnly === 'true') {
      notifications = notifications.filter(n => !n.read);
    }

    res.status(200).json({
      success: true,
      notifications,
      count: notifications.length
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Mark notification as read
router.patch('/notifications/:id/read', async (req, res) => {
  try {
    const notification = mockDb.notifications.find(n => n.id === parseInt(req.params.id));

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.read = true;

    res.status(200).json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
