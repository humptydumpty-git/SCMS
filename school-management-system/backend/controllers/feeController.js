const Fee = require('../models/Fee');
const Student = require('../models/Student');
const { Op, Sequelize } = require('sequelize');

// @desc    Get all fees with filters
// @route   GET /api/fees
// @access  Private
exports.getFees = async (req, res) => {
  try {
    const { studentId, feeType, paymentStatus, month, academicYear, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = {};
    
    if (studentId) whereClause.studentId = studentId;
    if (feeType) whereClause.feeType = feeType;
    if (paymentStatus) whereClause.paymentStatus = paymentStatus;
    if (month) whereClause.month = month;
    if (academicYear) whereClause.academicYear = academicYear;
    
    const { count, rows } = await Fee.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'admissionNumber', 'firstName', 'lastName', 'class', 'section']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['dueDate', 'DESC']]
    });
    
    res.json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: rows
    });
  } catch (err) {
    console.error('Error fetching fees:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get single fee record
// @route   GET /api/fees/:id
// @access  Private
exports.getFee = async (req, res) => {
  try {
    const fee = await Fee.findByPk(req.params.id, {
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'admissionNumber', 'firstName', 'lastName', 'class', 'section']
        }
      ]
    });
    
    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }
    
    res.json({
      success: true,
      data: fee
    });
  } catch (err) {
    console.error('Error fetching fee:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Create new fee record
// @route   POST /api/fees
// @access  Private
exports.createFee = async (req, res) => {
  try {
    const { studentId, amount, feeType, dueDate, academicYear, month } = req.body;
    
    // Check if student exists
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Check if fee already exists for the same student, feeType, month and academicYear
    if (feeType !== 'Admission' && month && academicYear) {
      const existingFee = await Fee.findOne({
        where: {
          studentId,
          feeType,
          month,
          academicYear
        }
      });
      
      if (existingFee) {
        return res.status(400).json({ 
          message: `Fee record already exists for ${feeType} in ${month} ${academicYear}` 
        });
      }
    }
    
    const feeData = {
      ...req.body,
      paymentStatus: 'Unpaid',
      createdBy: req.user.id
    };
    
    const fee = await Fee.create(feeData);
    
    res.status(201).json({
      success: true,
      data: fee
    });
  } catch (err) {
    console.error('Error creating fee:', err);
    if (err.name === 'SequelizeValidationError') {
      const messages = err.errors.map(error => error.message);
      return res.status(400).json({ message: 'Validation error', errors: messages });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Update fee record
// @route   PUT /api/fees/:id
// @access  Private
exports.updateFee = async (req, res) => {
  try {
    const fee = await Fee.findByPk(req.params.id);
    
    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }
    
    // Only allow updating certain fields
    const { paymentStatus, paidDate, paymentMethod, transactionId, discount, fine, description } = req.body;
    
    const updateData = {};
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (paidDate) updateData.paidDate = paidDate;
    if (paymentMethod) updateData.paymentMethod = paymentMethod;
    if (transactionId) updateData.transactionId = transactionId;
    if (discount !== undefined) updateData.discount = discount;
    if (fine !== undefined) updateData.fine = fine;
    if (description !== undefined) updateData.description = description;
    
    await fee.update(updateData);
    
    res.json({
      success: true,
      data: fee
    });
  } catch (err) {
    console.error('Error updating fee:', err);
    if (err.name === 'SequelizeValidationError') {
      const messages = err.errors.map(error => error.message);
      return res.status(400).json({ message: 'Validation error', errors: messages });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Delete fee record
// @route   DELETE /api/fees/:id
// @access  Private/Admin
exports.deleteFee = async (req, res) => {
  try {
    const fee = await Fee.findByPk(req.params.id);
    
    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }
    
    await fee.destroy();
    
    res.json({
      success: true,
      message: 'Fee record deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting fee:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get fee statistics
// @route   GET /api/fees/statistics
// @access  Private
exports.getFeeStatistics = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    
    // Total fees collected
    const totalFees = await Fee.sum('amount');
    
    // Monthly fees for current year
    const monthlyFees = await Fee.findAll({
      attributes: [
        'month',
        [Sequelize.fn('SUM', Sequelize.col('amount')), 'totalAmount']
      ],
      where: {
        academicYear: currentYear.toString(),
        paymentStatus: 'Paid'
      },
      group: ['month'],
      raw: true
    });
    
    // Fees by type
    const feesByType = await Fee.findAll({
      attributes: [
        'feeType',
        [Sequelize.fn('SUM', Sequelize.col('amount')), 'totalAmount']
      ],
      where: {
        academicYear: currentYear.toString(),
        paymentStatus: 'Paid'
      },
      group: ['feeType'],
      raw: true
    });
    
    // Current month's collection
    const currentMonthFees = await Fee.sum('amount', {
      where: {
        month: currentMonth,
        academicYear: currentYear.toString(),
        paymentStatus: 'Paid'
      }
    });
    
    // Pending fees
    const pendingFees = await Fee.sum('amount', {
      where: {
        paymentStatus: { [Op.ne]: 'Paid' }
      }
    });
    
    res.json({
      success: true,
      data: {
        totalFees: totalFees || 0,
        currentMonthFees: currentMonthFees || 0,
        pendingFees: pendingFees || 0,
        monthlyFees,
        feesByType
      }
    });
  } catch (err) {
    console.error('Error fetching fee statistics:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get student's fee summary
// @route   GET /api/fees/student/:studentId/summary
// @access  Private
exports.getStudentFeeSummary = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Check if student exists
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Get all fees for the student
    const fees = await Fee.findAll({
      where: { studentId },
      order: [['dueDate', 'DESC']]
    });
    
    // Calculate summary
    const totalFees = fees.reduce((sum, fee) => sum + parseFloat(fee.amount), 0);
    const totalPaid = fees
      .filter(fee => fee.paymentStatus === 'Paid')
      .reduce((sum, fee) => sum + parseFloat(fee.amount), 0);
    
    const pendingFees = fees.filter(fee => fee.paymentStatus !== 'Paid');
    const totalPending = pendingFees.reduce((sum, fee) => sum + parseFloat(fee.amount), 0);
    
    res.json({
      success: true,
      data: {
        student: {
          id: student.id,
          name: `${student.firstName} ${student.lastName}`,
          class: student.class,
          section: student.section,
          admissionNumber: student.admissionNumber
        },
        summary: {
          totalFees,
          totalPaid,
          totalPending,
          pendingFeesCount: pendingFees.length
        },
        pendingFees
      }
    });
  } catch (err) {
    console.error('Error fetching student fee summary:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
