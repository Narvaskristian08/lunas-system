const mongoose = require('mongoose');

const workOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  incident: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Incident',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'verified', 'rejected'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    required: true
  },
  estimatedCompletionTime: Date,
  actualStartTime: Date,
  actualCompletionTime: Date,
  instructions: String,
  materials: [{
    name: String,
    quantity: Number,
    unit: String,
    cost: Number
  }],
  progressUpdates: [{
    status: String,
    notes: String,
    images: [{
      url: String,
      key: String
    }],
    location: {
      type: {
        type: String,
        enum: ['Point']
      },
      coordinates: [Number]
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now }
  }],
  completionReport: {
    description: String,
    beforeImages: [{
      url: String,
      key: String
    }],
    afterImages: [{
      url: String,
      key: String
    }],
    workPerformed: String,
    materialsUsed: [{
      name: String,
      quantity: Number,
      unit: String
    }],
    laborHours: Number,
    totalCost: Number,
    submittedAt: Date
  },
  verification: {
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: Date,
    status: { type: String, enum: ['approved', 'rejected', 'needs_revision'] },
    aiScore: Number,
    aiAnalysis: {
      similarity: Number,
      improvementDetected: Boolean,
      notes: String
    },
    notes: String,
    rejectionReason: String
  },
  signature: {
    data: String, // Ed25519 signature
    timestamp: Date,
    publicKey: String
  },
  sla: {
    deadline: Date,
    isOverdue: { type: Boolean, default: false },
    remindersSent: { type: Number, default: 0 }
  },
  rejectionReason: String,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledAt: Date,
  cancellationReason: String
}, {
  timestamps: true
});

// Indexes
workOrderSchema.index({ orderNumber: 1 });
workOrderSchema.index({ incident: 1 });
workOrderSchema.index({ assignedTo: 1 });
workOrderSchema.index({ status: 1 });
workOrderSchema.index({ priority: 1 });
workOrderSchema.index({ createdAt: -1 });

// Generate unique order number
workOrderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = await mongoose.model('WorkOrder').countDocuments();
    this.orderNumber = `WO-${year}${month}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Method to check if work order is overdue
workOrderSchema.methods.checkSLAStatus = function() {
  if (this.sla.deadline && new Date() > this.sla.deadline) {
    this.sla.isOverdue = true;
    return true;
  }
  return false;
};

module.exports = mongoose.model('WorkOrder', workOrderSchema);
