// server.js
require('dotenv').config(); // Load environment variables first

const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

// ===== IMPORT ROUTES =====
const authRoutes = require('./routes/auth');
const chatbotRoutes = require('./routes/chatbot'); // <-- Chatbot route

// ===== CREATE APP =====
const app = express();

// ===== MIDDLEWARE =====
app.use(cors({ origin: '*' }));
app.use(express.json()); // For JSON bodies
app.use(express.urlencoded({ extended: true })); // For form data

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


// ===== GET ALL FILES WITH FILTERS & SORTING =====
app.get('/files', async (req, res) => {
  try {
    let { sort, subject, semester, tags } = req.query;

    let query = {};

    // Filtering
    if (subject) {
      query["subjectCode"] = { $regex: subject, $options: "i" };
    }
    if (semester) {
      query["semester"] = semester;
    }
    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim());
      query["tags"] = { $in: tagArray };
    }

    let sortOption = {};
    if (sort === "newest") {
      sortOption = { createdAt: -1 }; // newest first
    } else if (sort === "most_downloads") {
      sortOption = { downloads: -1 };
    }

    // Find documents
    const subjects = await Subject.find(query).sort(sortOption);

    const files = subjects.map(subject => ({
      id: subject._id,
      fileName: subject.file.fileName,
      contentType: subject.file.contentType,
      subjectCode: subject.subjectCode,
      semester: subject.semester,
      tags: subject.tags,
      description: subject.description,
      uploadDate: subject.createdAt,
      downloads: subject.downloads || 0
    }));

    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "❌ Error fetching files" });
  }
});


// ===== SUBJECT MODEL =====

const Subject = mongoose.model('Subject', SubjectSchema);

// ===== MULTER MEMORY STORAGE =====
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// ===== ROUTES =====
app.use('/auth', authRoutes);      // Auth routes
app.use('/chat', chatbotRoutes);   // Chatbot routes

// ===== FILE UPLOAD =====
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
    res.json({ message: '✅ PDF uploaded and stored in MongoDB successfully', id: newSubject._id });
  } catch (err) {
    res.status(500).json({ message: '❌ Upload failed', error: err.message });
  }
});


// ===== GET SINGLE FILE =====
// ===== PREVIEW FILE (No Counter) =====
app.get('/files', async (req, res) => {
  try {
    let filter = {};

    if (req.query.subject) {
      filter.$or = [
        { subjectCode: { $regex: req.query.subject, $options: 'i' } },
        { title: { $regex: req.query.subject, $options: 'i' } }
      ];
    }

    if (req.query.semester) {
      filter.semester = req.query.semester;
    }

    if (req.query.tags) {
      const tagsArray = req.query.tags.split(',').map(t => t.trim());
      filter.tags = { $in: tagsArray };
    }

    let query = FileModel.find(filter);

    if (req.query.sort === 'newest') {
      query = query.sort({ uploadDate: -1 });
    } else if (req.query.sort === 'most_downloads') {
      query = query.sort({ downloads: -1 });
    }

    const files = await query.exec();
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



// ===== DOWNLOAD FILE (With Counter) =====
app.get('/download/:id', async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloads: 1 } }, // increment downloads
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


// ===== GET ALL FILES =====
app.get('/files', async (req, res) => {
  try {
    const subjects = await Subject.find();
    const files = subjects.map(subject => ({
      id: subject._id,
      title: subject.subjectTitle,
      subject: subject.subjectCode,
      description: subject.description,
      uploader: subject.userID,
      fileName: subject.file.fileName,
      contentType: subject.file.contentType,
      uploadDate: subject.createdAt || subject._id.getTimestamp(),
      downloads: subject.downloads || 0,
      rating: subject.rating || 5
    }));
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: "❌ Error fetching files" });
  }
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
