const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Fee = sequelize.define('Fee', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Students', // This references the 'Students' table
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  feeType: {
    type: DataTypes.ENUM('Tuition', 'Admission', 'Exam', 'Transport', 'Library', 'Other'),
    allowNull: false,
    defaultValue: 'Tuition'
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  paidDate: {
    type: DataTypes.DATEONLY
  },
  paymentStatus: {
    type: DataTypes.ENUM('Paid', 'Unpaid', 'Partial', 'Overdue'),
    defaultValue: 'Unpaid'
  },
  paymentMethod: {
    type: DataTypes.ENUM('Cash', 'Cheque', 'Bank Transfer', 'Online Payment', 'Other'),
    allowNull: true
  },
  transactionId: {
    type: DataTypes.STRING
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  fine: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  description: {
    type: DataTypes.TEXT
  },
  academicYear: {
    type: DataTypes.STRING,
    allowNull: false
  },
  month: {
    type: DataTypes.ENUM(
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    )
  },
  createdBy: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
});

module.exports = Fee;
