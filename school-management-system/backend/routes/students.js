const express = require('express');
const router = express.Router();
const { 
  getStudents, 
  getStudent, 
  createStudent, 
  updateStudent, 
  deleteStudent,
  getStudentStatistics
} = require('../controllers/studentController');
const { verifyToken, isTeacherOrAbove } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(verifyToken);

// Routes
router.route('/')
  .get(isTeacherOrAbove, getStudents)
  .post(isTeacherOrAbove, createStudent);

router.get('/statistics', isTeacherOrAbove, getStudentStatistics);

router.route('/:id')
  .get(isTeacherOrAbove, getStudent)
  .put(isTeacherOrAbove, updateStudent)
  .delete(isTeacherOrAbove, deleteStudent);

module.exports = router;
