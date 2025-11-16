require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const feeRoutes = require('./routes/fees');

// Import models
const db = require('./config/db');
const User = require('./models/User');
const Student = require('./models/Student');
const Fee = require('./models/Fee');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Test DB Connection
const testConnection = async () => {
  try {
    await db.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

// Define model relationships
const setupAssociations = () => {
  // Student-Fee relationship (One-to-Many)
  Student.hasMany(Fee, {
    foreignKey: 'studentId',
    as: 'fees'
  });
  
  Fee.belongsTo(Student, {
    foreignKey: 'studentId',
    as: 'student'
  });
  
  // User-Fee relationship (One-to-Many for createdBy)
  User.hasMany(Fee, {
    foreignKey: 'createdBy',
    as: 'feeRecords'
  });
  
  Fee.belongsTo(User, {
    foreignKey: 'createdBy',
    as: 'creator'
  });
};

// Initialize database and start server
const initializeApp = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Setup model relationships
    setupAssociations();
    
    // Sync all models with database
    await db.sync({ force: false }); // Set force: true to drop and recreate tables
    console.log('Database synced');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  }
};

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/fees', feeRoutes);

// Serve portal page at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve frontend app (if frontend is built and served from backend)
app.get('/app*', (req, res) => {
  // This will be handled by the frontend if it's running separately
  // Or you can serve the built frontend from here
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use((req, res) => {
  // If it's an API request, return JSON
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      message: 'API endpoint not found'
    });
  }
  // Otherwise, return the portal page (for SPA routing)
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the application
initializeApp();

module.exports = app;
