const Student = require('../models/Student');
const Fee = require('../models/Fee');
const { Op, Sequelize } = require('sequelize');

// @desc    Get all students with pagination and filters
// @route   GET /api/students
// @access  Private
exports.getStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const { class: className, section, search, status } = req.query;
    
    const whereClause = {};
    
    if (className) whereClause.class = className;
    if (section) whereClause.section = section;
    if (status) whereClause.isActive = status === 'active';
    
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { admissionNumber: { [Op.like]: `%${search}%` } },
        { parentName: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const { count, rows } = await Student.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: rows
    });
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get single student by ID
// @route   GET /api/students/:id
// @access  Private
exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id, {
      include: [
        {
          model: Fee,
          as: 'fees',
          attributes: ['id', 'amount', 'feeType', 'dueDate', 'paidDate', 'paymentStatus']
        }
      ]
    });
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json({
      success: true,
      data: student
    });
  } catch (err) {
    console.error('Error fetching student:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Create new student
// @route   POST /api/students
// @access  Private
exports.createStudent = async (req, res) => {
  try {
    // Generate admission number
    const currentYear = new Date().getFullYear();
    const lastStudent = await Student.findOne({
      order: [['createdAt', 'DESC']]
    });
    
    let admissionNumber;
    if (lastStudent && lastStudent.admissionNumber) {
      const lastNumber = parseInt(lastStudent.admissionNumber.split('-')[1]) + 1;
      admissionNumber = `ADM-${currentYear}-${String(lastNumber).padStart(4, '0')}`;
    } else {
      admissionNumber = `ADM-${currentYear}-0001`;
    }
    
    const studentData = {
      ...req.body,
      admissionNumber,
      admissionDate: req.body.admissionDate || new Date()
    };
    
    const student = await Student.create(studentData);
    
    res.status(201).json({
      success: true,
      data: student
    });
  } catch (err) {
    console.error('Error creating student:', err);
    if (err.name === 'SequelizeValidationError') {
      const messages = err.errors.map(error => error.message);
      return res.status(400).json({ message: 'Validation error', errors: messages });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private
exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    await student.update(req.body);
    
    res.json({
      success: true,
      data: student
    });
  } catch (err) {
    console.error('Error updating student:', err);
    if (err.name === 'SequelizeValidationError') {
      const messages = err.errors.map(error => error.message);
      return res.status(400).json({ message: 'Validation error', errors: messages });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private/Admin
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    await student.destroy();
    
    res.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting student:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get student statistics
// @route   GET /api/students/statistics
// @access  Private
exports.getStudentStatistics = async (req, res) => {
  try {
    const totalStudents = await Student.count();
    const activeStudents = await Student.count({ where: { isActive: true } });
    const inactiveStudents = totalStudents - activeStudents;
    
    // Group by class
    const byClass = await Student.findAll({
      attributes: ['class', [Sequelize.fn('COUNT', 'id'), 'count']],
      group: ['class'],
      raw: true
    });
    
    // Group by gender
    const byGender = await Student.findAll({
      attributes: ['gender', [Sequelize.fn('COUNT', 'id'), 'count']],
      group: ['gender'],
      raw: true
    });
    
    res.json({
      success: true,
      data: {
        totalStudents,
        activeStudents,
        inactiveStudents,
        byClass,
        byGender
      }
    });
  } catch (err) {
    console.error('Error fetching student statistics:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
