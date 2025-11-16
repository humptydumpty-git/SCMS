const express = require('express');
const router = express.Router();
const { 
  getFees, 
  getFee, 
  createFee, 
  updateFee, 
  deleteFee,
  getFeeStatistics,
  getStudentFeeSummary
} = require('../controllers/feeController');
const { verifyToken, isTeacherOrAbove, authorize } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(verifyToken);

// Routes
router.route('/')
  .get(isTeacherOrAbove, getFees)
  .post(isTeacherOrAbove, createFee);

router.get('/statistics', isTeacherOrAbove, getFeeStatistics);
router.get('/student/:studentId/summary', isTeacherOrAbove, getStudentFeeSummary);

router.route('/:id')
  .get(isTeacherOrAbove, getFee)
  .put(isTeacherOrAbove, updateFee)
  .delete(authorize(['admin', 'accountant']), deleteFee);

module.exports = router;
