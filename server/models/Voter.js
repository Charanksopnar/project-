const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const voterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  dob: {
    type: Date,
    required: true
  },
  age: {
    type: Number,
    required: true,
    min: 18
  },
  address: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  idProof: {
    type: String,
    required: true
  },
  voteStatus: {
    type: Boolean,
    default: false
  },
  profilePic: {
    type: String,
    default: 'default-profile.jpg'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
voterSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
voterSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Voter = mongoose.model('Voter', voterSchema);

module.exports = Voter;
