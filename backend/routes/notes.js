const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: String,
  subject: String,
  semester: String,
  description: String,
  tags: [String],
  filename: String,
  originalname: String,
  uploader: String,
  path: String,
  size: Number,
  downloads: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Note', noteSchema);
