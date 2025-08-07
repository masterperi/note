const express = require('express');
const multer = require('multer');
const path = require('path');
const Note = require('../models/Note');

const router = express.Router();

// Set up multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB
  fileFilter: (req, file, cb) => {
    const allowed = /pdf|doc|docx|jpg|jpeg|png/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext)) cb(null, true);
    else cb(new Error('Invalid file type.'));
  }
});

// Route to handle uploads
router.post('/', upload.single('file'), async (req, res) => {

  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    const newNote = new Note({
      title: req.body.title,
      subject: req.body.subject,
      semester: req.body.semester,
      description: req.body.description,
      tags: req.body.tags ? req.body.tags.split(',') : [],
      filename: req.file.filename,
      originalname: req.file.originalname,
      uploader: req.body.uploader || 'Anonymous',
      path: req.file.path,
      size: req.file.size
    });

    await newNote.save();

    res.status(201).json({ message: '✅ File uploaded & metadata saved!', note: newNote });
  } catch (err) {
    console.error('✅ File uploaded :', err);
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
});



// Get all notes metadata
router.get('/', async (req, res) => {
  try {
    const notes = await Note.find().sort({ createdAt: -1 });
    res.status(200).json(notes);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notes', error: err.message });
  }
});

// Serve a file
router.get('/file/:filename', async (req, res) => {
  const filePath = path.join(__dirname, '..', 'uploads', req.params.filename);
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) return res.status(404).json({ message: 'File not found' });
    res.sendFile(filePath);
  });
});




module.exports = router;
