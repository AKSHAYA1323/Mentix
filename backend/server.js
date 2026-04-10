require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// const MONGO_URI=mongodb+srv://keshav:Keshav3112@cluster0.o0ubgum.mongodb.net/'
const authRoutes = require('./routes/auth');
const protectedRoutes = require('./routes/protected');
const resumeRoutes = require('./routes/resume');
const testsRoutes = require('./routes/tests');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', protectedRoutes);
app.use('/api', resumeRoutes);
app.use('/api/tests', testsRoutes);

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 10000,
})
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
  })
  .catch(err => console.error('MongoDB connection error:', err.message));
