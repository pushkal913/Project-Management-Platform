const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    default: ''
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['requirement', 'specification', 'meeting-notes', 'design', 'documentation', 'credentials', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['draft', 'review', 'approved'],
    default: 'draft'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  attachments: [{
    filename: String,
    originalName: String,
    size: Number,
    mimetype: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Simple indexes for performance
documentSchema.index({ project: 1 });
documentSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Document', documentSchema);