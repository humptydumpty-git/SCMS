const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { verifyToken, authorize } = require('../middleware/auth');

// Public routes
router.post('/register', verifyToken, authorize('admin'), register);
router.post('/login', login);

// Protected routes
router.get('/me', verifyToken, getMe);

module.exports = router;
