require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const { PDFParse } = require('pdf-parse');
const { GoogleGenAI } = require('@google/genai');
const path = require('path');

const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Auth Imports
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('./middleware/auth'); 
const User = require('./models/User');     

const Application = require('./models/Application');

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// 1. DATABASE & MIDDLEWARE
// ==========================================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB successfully!'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use(cors());
app.use(express.json());

// ==========================================
// 2. MULTER & CLOUDINARY CONFIGURATIONS
// (This MUST be defined before the routes use them!)
// ==========================================

// Config A: Memory Storage (For temporary AI parsing)
const memoryStorage = multer.memoryStorage();
const uploadToMemory = multer({ storage: memoryStorage });

// Config B: Cloudinary Storage (For permanent resume storage)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const cloudStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'smart-job-tracker-resumes', 
    resource_type: 'auto', 
    public_id: (req, file) => Date.now() + '-' + file.originalname.split('.')[0]
  },
});
const uploadToCloud = multer({ storage: cloudStorage });

// ==========================================
// 3. API ROUTES - AUTHENTICATION
// ==========================================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ name, email, password: hashedPassword });
    const savedUser = await newUser.save();

    const token = jwt.sign({ id: savedUser._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({ token, user: { id: savedUser._id, name: savedUser.name, email: savedUser.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. API ROUTES - JOB TRACKER
// ==========================================

app.get('/api/applications', auth, async (req, res) => {
  try {
    const apps = await Application.find({ userId: req.user }).sort({ createdAt: -1 });
    res.status(200).json(apps);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

app.post('/api/applications', auth, uploadToCloud.single('resumeFile'), async (req, res) => {
  try {
    const applicationData = {
      userId: req.user, 
      companyName: req.body.companyName,
      jobTitle: req.body.jobTitle,
      status: req.body.status
    };

    if (req.file) {
      applicationData.resumeUsed = req.file.path; 
    }

    const newApp = new Application(applicationData);
    const savedApp = await newApp.save();
    res.status(201).json(savedApp);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/applications/:id', auth, async (req, res) => {
  try {
    const updatedApp = await Application.findOneAndUpdate(
      { _id: req.params.id, userId: req.user }, 
      req.body, 
      { new: true }
    );
    if (!updatedApp) return res.status(404).json({ error: 'Application not found or unauthorized' });
    res.status(200).json(updatedApp);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/applications/:id', auth, async (req, res) => {
  try {
    const deletedApp = await Application.findOneAndDelete({ _id: req.params.id, userId: req.user });
    if (!deletedApp) return res.status(404).json({ error: 'Application not found or unauthorized' });
    res.status(200).json({ message: 'Application deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 5. API ROUTES - AI RESUME OPTIMIZER
// ==========================================

app.post('/api/optimize-resume', uploadToMemory.single('resume'), async (req, res) => {
  
  // *** PASTE YOUR WORKING AI LOGIC HERE ***
  // (The part with PDFParse, GoogleGenAI, and the Prompt)

});

// ==========================================
// 6. START SERVER
// ==========================================
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});