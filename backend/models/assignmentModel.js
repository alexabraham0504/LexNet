const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const assignmentSchema = new Schema({
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true
  },
  lawyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lawyer',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clientNotes: {
    type: String,
    default: ''
  },
  caseDetails: {
    title: String,
    description: String,
    ipcSection: String,
    caseType: String,
    status: String,
    documents: [{
      fileName: String,
      fileType: String,
      uploadDate: Date
    }]
  },
  documentCount: {
    type: Number,
    default: 0
  },
  fileNames: [String],
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed'],
    default: 'pending'
  },
  assignmentDate: {
    type: Date,
    required: true,
    default: Date.now,
    get: function(date) {
      return date ? new Date(date) : null;
    }
  },
  responseDate: Date,
  responseNotes: String,
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
  toJSON: { 
    virtuals: true,
    getters: true,
    transform: function(doc, ret) {
      if (ret.assignmentDate) {
        ret.formattedAssignmentDate = new Date(ret.assignmentDate).toLocaleString();
        ret.displayDate = new Date(ret.assignmentDate).toLocaleDateString();
        ret.displayTime = new Date(ret.assignmentDate).toLocaleTimeString();
      }
      ret.formattedCreatedAt = doc.createdAt ? 
        new Date(doc.createdAt).toLocaleString() : undefined;
      return ret;
    }
  },
  toObject: { virtuals: true, getters: true }
});

// Update lastUpdated timestamp before saving
assignmentSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Add method to get assignment details
assignmentSchema.methods.getFullDetails = async function() {
  await this.populate([
    {
      path: 'caseId',
      select: 'title description caseType status documents'
    },
    {
      path: 'clientId',
      select: 'name email phone'
    },
    {
      path: 'lawyerId',
      select: 'name email specialization'
    }
  ]);

  return {
    ...this.toObject(),
    clientName: this.clientId?.name,
    clientEmail: this.clientId?.email,
    lawyerName: this.lawyerId?.name,
    caseTitle: this.caseId?.title,
    caseType: this.caseId?.caseType,
    documents: this.caseId?.documents || []
  };
};

// Add static method to find assignments by lawyer
assignmentSchema.statics.findByLawyer = async function(lawyerId) {
  return this.find({ lawyerId })
    .populate('caseId', 'title caseType status documents')
    .populate('clientId', 'name email')
    .sort({ assignmentDate: -1 });
};

module.exports = mongoose.model('Assignment', assignmentSchema); 