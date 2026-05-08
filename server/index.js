const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const studentRoutes = require('./routes/student');
const adminRoutes = require('./routes/admin');
const mongoose = require('mongoose');

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URL)
    .then(() => console.log('✅ Connected successfully to MongoDB Atlas via Mongoose'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));


const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
    res.send('AlphaLo Express Server is running...');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
