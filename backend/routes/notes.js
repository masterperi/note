const express = require('express');
const fs = require('fs');
const path = require('path');
const Note = require('../models/Note');

const router = express.Router();

// GET all notes
router.get('/', async (req, res) => {
  try {
    const notes = await Note.find().sort({ createdAt: -1 });
    res.status(200).json(notes);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notes', error: err.message });
  }
});

// GET a file
router.get('/file/:filename', (req, res) => {
  const filePath = path.join(__dirname, '..', 'uploads', req.params.filename);
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) return res.status(404).json({ message: 'File not found' });
    res.sendFile(filePath);
  });
});

module.exports = router;
