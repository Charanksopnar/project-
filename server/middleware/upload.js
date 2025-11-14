const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath;
    
    // Determine the appropriate upload directory based on file type
    if (file.fieldname === 'selfie') {
      uploadPath = path.join(__dirname, '../uploads/profiles');
    } else if (file.fieldname === 'idImage') {
      uploadPath = path.join(__dirname, '../uploads/idProofs');
    } else {
      uploadPath = path.join(__dirname, '../uploads/temp');
    }

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload an image file.'), false);
  }
};

// Initialize upload middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Government ID types
const GOVERNMENT_ID_TYPES = ['aadhar', 'pan', 'voter', 'driving'];

// Function to identify government ID type
const identifyGovernmentIdType = (fileName) => {
  const lowerFileName = fileName.toLowerCase();
  for (const type of GOVERNMENT_ID_TYPES) {
    if (lowerFileName.includes(type)) {
      return type;
    }
  }
  return 'other';
};

// Government ID upload middleware
const uploadGovernmentId = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Process government ID
const processGovernmentId = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const idType = identifyGovernmentIdType(req.file.originalname);
  req.idType = idType;
  next();
};

module.exports = {
  upload,
  uploadGovernmentId,
  processGovernmentId,
  GOVERNMENT_ID_TYPES,
  identifyGovernmentIdType
};