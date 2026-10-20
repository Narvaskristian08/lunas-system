const mongoose = require('mongoose');
module.exports = mongoose.model('PushEnrollment', new mongoose.Schema({
  _id: String, account: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true }));
