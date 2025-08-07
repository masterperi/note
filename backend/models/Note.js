const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: String,
  subjectCode: String,
  semester: String,
  description: String,
  tags: [String],
  uploaderId: String,
  filename: String,
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);
