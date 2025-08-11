// server.js
require('dotenv').config(); // Load environment variables first

const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

// ===== IMPORT ROUTES =====
const authRoutes = require('./routes/auth');
const chatbotRoutes = require('./routes/chatbot');

const app = express();

// ===== MIDDLEWARE =====
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== MONGODB CONNECTION =====
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ Connected to MongoDB Atlas"))
.catch(err => console.error("❌ MongoDB Connection Error:", err));

// ===== SUBJECT SCHEMA =====
const SubjectSchema = new mongoose.Schema({
  userID: String,
  subjectCode: String,
  subjectTitle: String,
  tags: [String],
  semester: String,
  description: String,
  file: {
    data: Buffer,
    contentType: String,
    fileName: String
  },
  downloads: { type: Number, default: 0 }
}, { timestamps: true });

const Subject = mongoose.model('Subject', SubjectSchema);

// ===== MULTER MEMORY STORAGE =====
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ===== ROUTES =====
app.use('/auth', authRoutes);
app.use('/chat', chatbotRoutes);

// ===== UPLOAD FILE =====
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { userID, subjectCode, subjectTitle, tags, semester, description } = req.body;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const newSubject = new Subject({
      userID,
      subjectCode,
      subjectTitle,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      semester,
      description,
      file: {
        data: req.file.buffer,
        contentType: req.file.mimetype,
        fileName: req.file.originalname
      }
    });

    await newSubject.save();
    res.json({ message: '✅ File uploaded successfully', id: newSubject._id });
  } catch (err) {
    res.status(500).json({ message: '❌ Upload failed', error: err.message });
  }
});

// ===== GET FILES WITH FILTERS & SORTING =====
app.get('/files', async (req, res) => {
  try {
    let { sort, subject, semester, tags } = req.query;
    let query = {};

    if (subject) query.subjectCode = { $regex: subject, $options: 'i' };
    if (semester) query.semester = semester;
    if (tags) query.tags = { $in: tags.split(',').map(t => t.trim()) };

    let sortOption = {};
    if (sort === "newest") sortOption = { createdAt: -1 };
    else if (sort === "most_downloads") sortOption = { downloads: -1 };

    const subjects = await Subject.find(query).sort(sortOption);
    const files = subjects.map(s => ({
      id: s._id,
      title: s.subjectTitle,
      subject: s.subjectCode,
      description: s.description,
      uploader: s.userID,
      fileName: s.file.fileName,
      contentType: s.file.contentType,
      uploadDate: s.createdAt,
      downloads: s.downloads
    }));

    res.json(files);
  } catch (err) {
    res.status(500).json({ message: "❌ Error fetching files" });
  }
});

// ===== DOWNLOAD FILE & INCREMENT COUNTER =====
app.get('/download/:id', async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloads: 1 } },
      { new: true }
    );

    if (!subject) return res.status(404).send("❌ File not found");

    res.set({
      'Content-Type': subject.file.contentType,
      'Content-Disposition': `attachment; filename="${subject.file.fileName}"`
    });

    res.send(subject.file.data);
  } catch (err) {
    res.status(500).send("❌ Error downloading file");
  }
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
