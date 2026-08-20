const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

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
  // Repair staffing is intentionally lightweight for the 75% milestone. It
  // supports assignment eligibility without pretending to be an HR scheduler.
  repairOrganization: {
    type: String,
    trim: true,
    maxlength: 160,
    required: function() {
      return this.role === 'repair_personnel';
    }
  },
  repairTeam: {
    type: String,
    trim: true,
    maxlength: 120
  },
  availability: {
    type: String,
    enum: ['available', 'assigned', 'unavailable', 'off_duty'],
    default: function() {
      return this.role === 'repair_personnel' ? 'available' : undefined;
    }
  },
  profileImage: String,
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Incrementing this value invalidates every access and refresh token that
  // was issued before the change. It is used for logout and password changes.
  tokenVersion: {
    type: Number,
    default: 0,
    select: false
  },
  // Refresh tokens are stored as SHA-256 hashes only. The raw token is never
  // persisted, so a database disclosure cannot be used as an active session.
  refreshTokens: {
    type: [{
      tokenHash: { type: String, required: true },
      expiresAt: { type: Date, required: true },
      createdAt: { type: Date, default: Date.now },
      userAgent: { type: String, maxlength: 512 }
    }],
    select: false,
    default: []
  },
  deviceTokens: [{
    token: String,
    platform: { type: String, enum: ['android', 'ios', 'web'] },
    addedAt: { type: Date, default: Date.now }
  }],
  lastLogin: Date,
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  verificationToken: { type: String, select: false },
  verificationTokenExpires: { type: Date, select: false }
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ role: 1 });
userSchema.index({ barangay: 1 });
userSchema.index({ role: 1, repairOrganization: 1, availability: 1 });

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

// Generate a one-time reset token. Only its hash is stored on the user.
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = new Date(
    Date.now() + (parseInt(process.env.PASSWORD_RESET_EXPIRE_MINUTES, 10) || 30) * 60 * 1000
  );

  return resetToken;
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
    utilityCompany: this.utilityCompany,
    repairOrganization: this.repairOrganization,
    repairTeam: this.repairTeam,
    availability: this.availability,
    profileImage: this.profileImage,
    isVerified: this.isVerified,
    isActive: this.isActive,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('User', userSchema);
