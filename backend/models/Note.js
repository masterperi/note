// backend/models/Note.js

const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: String,
  subjectCode: String,
  semester: String,
  idNo: String,
  description: String,
  tags: [String],
  filename: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Note', noteSchema);
