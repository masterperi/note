const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const auth =require('./routes/auth');
const dotenv = require('dotenv');



dotenv.config();


const chat = require('./routes/chatbot');
const app = express();
const PORT = 3000;
const MONGO_URI = process.env.mongourl;
// MongoDB connection
mongoose.connect(`${MONGO_URI}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection failed:', err));

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/auth', auth); // Authentication routes
app.use('/chat',chat);
// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// Static files for uploaded PDFs, etc.
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/upload', require('./routes/upload')); // File upload route 

app.use('/api', require('./routes/'));
app.use('/api/notes/file:filename', require('./routes/file:filename'));



// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
