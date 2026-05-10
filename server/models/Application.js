const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
 
  companyName: { type: String, required: [true, 'Company name is required'] },
  jobTitle: { type: String, required: [true, 'Job title is required'] },
  status: {
    type: String,
    enum: ['Saved', 'Applied', 'Interviewing', 'Rejected', 'Offer'],
    default: 'Applied'
  },
  // NEW FIELD: Stores the path to the saved PDF file
  resumeUsed: { type: String }, 
  dateApplied: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);