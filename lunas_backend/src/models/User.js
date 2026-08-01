const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['citizen', 'repair_personnel', 'barangay_official', 'city_engineer', 'utility_provider', 'admin'],
    default: 'citizen',
    required: true
  },
  address: {
    street: String,
    barangay: String,
    city: { type: String, default: 'Dagupan City' },
    province: { type: String, default: 'Pangasinan' },
    zipCode: String
  },
  barangay: {
    type: String,
    required: function() {
      return ['barangay_official', 'repair_personnel'].includes(this.role);
    }
  },
  utilityCompany: {
    type: String,
    required: function() {
      return this.role === 'utility_provider';
    }
  },
  expertise: [{
    type: String,
    enum: ['road', 'drainage', 'electrical', 'water', 'gas', 'streetlight', 'other']
  }],
  profileImage: String,
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  deviceTokens: [{
    token: String,
    platform: { type: String, enum: ['android', 'ios', 'web'] },
    addedAt: { type: Date, default: Date.now }
  }],
  lastLogin: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  verificationToken: String,
  verificationTokenExpires: Date
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ barangay: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile
userSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    phone: this.phone,
    role: this.role,
    address: this.address,
    barangay: this.barangay,
    profileImage: this.profileImage,
    isVerified: this.isVerified,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('User', userSchema);
