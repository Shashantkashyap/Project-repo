console.log('server.js loaded')
// Entry point for the backend server
const express = require('express')
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

//const adminRoutes = require('../routes/admin.route');
const candidateRoutes = require('./routes/candidate.route');
const adminRoutes = require('./routes/admin'); // Uncomment if admin routes are needed

const app = express();
app.use(cors({
    origin: process.env.ORIGIN || 'http://localhost:3000', // Adjust as needed
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/candidate', candidateRoutes);
app.use('/api/v1/admin', adminRoutes); // Uncomment if admin routes are needed



app.get('/test-api', (req, res) => {
  res.json({ message: 'Server is working!' });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
