const mongoose = require('mongoose');

const CallSchema = new mongoose.Schema({
  transcript: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  tasks: [{
    task: String,
    due: String,
    completed: {
      type: Boolean,
      default: false
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Call', CallSchema);
