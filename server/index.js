const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Reads from server/.env locally, or Render env vars in production

const studentRoutes = require('./routes/student');
const adminRoutes = require('./routes/admin');
const mongoose = require('mongoose');

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URL)
    .then(() => console.log('✅ Connected successfully to MongoDB Atlas via Mongoose'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));


const app = express();
const PORT = process.env.PORT || 5000;

// Restrict CORS to allowed origins from env (comma-separated)
// e.g. ALLOWED_ORIGINS="https://your-app.vercel.app,http://localhost:5173"
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(',').map(o => o.trim());
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));
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
