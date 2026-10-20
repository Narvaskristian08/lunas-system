const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { USER_ROLES, ACCOUNT_STATUSES, accountStatus } = require('../utils/accountPolicy');
const { canonicalizeBarangay } = require('../data/dagupanBarangays');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  middleName: { type: String, trim: true, maxlength: 80 },
  suffix: { type: String, trim: true, maxlength: 20 },
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
  // The authorized email remains the login identifier. Recovery delivery is
  // intentionally separate because a provisioned login identifier may not be
  // a mailbox the user can access.
  recoveryEmail: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid recovery email']
  },
  recoveryEmailVerifiedAt: Date,
  recoveryEmailPending: {
    type: String,
    lowercase: true,
    trim: true,
    select: false
  },
  recoveryEmailVerificationCodeHash: {
    type: String,
    select: false
  },
  recoveryEmailVerificationExpiresAt: {
    type: Date,
    select: false
  },
  recoveryEmailVerificationAttempts: {
    type: Number,
    min: 0,
    default: 0,
    select: false
  },
  recoveryEmailVerificationSentAt: {
    type: Date,
    select: false
  },
  phone: {
    type: String,
    required: function() { return this.role === 'repair_personnel'; },
    trim: true
  },
  password: {
    type: String,
    required: function() { return !this.requiresActivation; },
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  role: {
    type: String,
    enum: USER_ROLES,
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
    validate: {
      validator: function(value) {
        return this.role !== 'barangay_tanod' || Boolean(value && canonicalizeBarangay(value) === value);
      },
      message: 'Tanods require a canonical assigned barangay'
    },
    required: function() {
      return ['barangay_official', 'barangay_tanod'].includes(this.role);
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
    enum: ['road', 'drainage', 'electrical', 'water', 'gas', 'streetlight']
  }],
  // Repair staffing stores the assignment fields needed for eligibility;
  // employment verification and HR scheduling remain outside LUNAS.
  repairOrganization: {
    type: String,
    trim: true,
    maxlength: 160,
    required: false
  },
  repairTeam: {
    type: String,
    trim: true,
    maxlength: 120,
    required: false
  },
  repairAccountType: {
    type: String,
    enum: ['individual', 'team'],
    default: function() { return this.role === 'repair_personnel' ? 'individual' : undefined; }
  },
  availability: {
    type: String,
    enum: ['available', 'assigned', 'unavailable', 'off_duty'],
    default: function() {
      return this.role === 'repair_personnel' ? 'available' : undefined;
    }
  },
  profileImage: String,
  organization: { type: String, trim: true, maxlength: 160 },
  position: { type: String, trim: true, maxlength: 120 },
  personnelId: { type: String, trim: true, maxlength: 80 },
  approval: {
    authority: { type: String, maxlength: 160 },
    reference: { type: String, maxlength: 500 },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    recordedAt: Date
  },
  accountStatus: { type: String, enum: ACCOUNT_STATUSES },
  requiresActivation: Boolean,
  activatedAt: Date,
  activationTokenHash: { type: String, select: false },
  activationExpiresAt: { type: Date, select: false },
  activationSentAt: { type: Date, select: false },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  reportingRestriction: {
    status: { type: String, enum: ['clear', 'blocked'], default: 'clear' },
    confirmedFindings: { type: Number, min: 0, default: 0 },
    threshold: { type: Number, min: 1, default: 3 },
    assignedBarangay: { type: String, trim: true, maxlength: 100 },
    blockedAt: Date,
    blockedAtFindings: { type: Number, min: 0 },
    appealStatus: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
    appealId: { type: mongoose.Schema.Types.ObjectId, ref: 'ReportingAppeal' }
  },
  archivedAt: Date,
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  archiveReason: {
    type: String,
    maxlength: 500
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
  passwordResetCodeHash: { type: String, select: false },
  passwordResetCodeExpires: { type: Date, select: false },
  passwordResetCodeAttempts: { type: Number, default: 0, select: false },
  passwordResetCodeSentAt: { type: Date, select: false },
  verificationToken: { type: String, select: false },
  verificationTokenExpires: { type: Date, select: false },
  registrationChallengeHash: { type: String, select: false },
  registrationMfaCodeHash: { type: String, select: false },
  registrationMfaExpires: { type: Date, select: false },
  registrationMfaAttempts: { type: Number, default: 0, select: false },
  registrationMfaSentAt: { type: Date, select: false }
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ role: 1 });
userSchema.index({ barangay: 1 });
userSchema.index({ role: 1, repairOrganization: 1, availability: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
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
    middleName: this.middleName,
    suffix: this.suffix,
    lastName: this.lastName,
    email: this.email,
    recoveryEmailStatus: {
      configured: Boolean(this.recoveryEmail),
      verified: Boolean(this.recoveryEmail && this.recoveryEmailVerifiedAt)
    },
    phone: ['citizen', 'repair_personnel'].includes(this.role) ? this.phone : undefined,
    role: this.role,
    address: this.address,
    barangay: this.barangay,
    utilityCompany: this.utilityCompany,
    repairOrganization: this.repairOrganization,
    repairTeam: this.repairTeam,
    repairAccountType: this.repairAccountType || 'individual',
    availability: this.availability,
    profileImage: this.profileImage,
    isVerified: this.isVerified,
    isActive: this.isActive,
    isArchived: this.isArchived,
    accountStatus: accountStatus(this),
    reportingRestriction: {
      status: this.reportingRestriction?.status === 'blocked' ? 'blocked' : 'clear',
      confirmedFindings: Number(this.reportingRestriction?.confirmedFindings) || 0,
      threshold: 3,
      assignedBarangay: this.reportingRestriction?.assignedBarangay,
      appealStatus: ['none', 'pending', 'approved', 'rejected'].includes(this.reportingRestriction?.appealStatus)
        ? this.reportingRestriction.appealStatus
        : 'none',
      appealId: this.reportingRestriction?.appealId
    },
    organization: this.organization,
    position: this.position,
    personnelId: this.personnelId,
    archivedAt: this.archivedAt,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('User', userSchema);
