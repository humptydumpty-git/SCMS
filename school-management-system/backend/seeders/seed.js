const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Student = require('../models/Student');
const Fee = require('../models/Fee');
const db = require('../config/db');

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');
    
    // Clear existing data
    await db.sync({ force: true });
    console.log('Database synced!');
    
    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    const admin = await User.create({
      username: 'admin',
      email: 'admin@school.edu',
      password: hashedPassword,
      role: 'admin',
      fullName: 'System Administrator',
      phone: '1234567890',
      isActive: true
    });
    
    console.log('Admin user created:', admin.toJSON());
    
    // Create head teacher
    const headTeacher = await User.create({
      username: 'headmaster',
      email: 'headmaster@school.edu',
      password: hashedPassword,
      role: 'head_teacher',
      fullName: 'John Headmaster',
      phone: '0987654321',
      isActive: true
    });
    
    // Create teachers
    const teacher1 = await User.create({
      username: 'teacher1',
      email: 'teacher1@school.edu',
      password: hashedPassword,
      role: 'teacher',
      fullName: 'Sarah Johnson',
      phone: '1122334455',
      isActive: true
    });
    
    const teacher2 = await User.create({
      username: 'teacher2',
      email: 'teacher2@school.edu',
      password: hashedPassword,
      role: 'teacher',
      fullName: 'Michael Brown',
      phone: '2233445566',
      isActive: true
    });
    
    // Create accountant
    const accountant = await User.create({
      username: 'accountant',
      email: 'accountant@school.edu',
      password: hashedPassword,
      role: 'accountant',
      fullName: 'Lisa Williams',
      phone: '3344556677',
      isActive: true
    });
    
    console.log('Users created successfully!');
    
    // Create sample students
    const students = [];
    const classes = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
    const sections = ['A', 'B', 'C'];
    const firstNames = ['Emma', 'Noah', 'Olivia', 'Liam', 'Ava', 'William', 'Sophia', 'Mason', 'Isabella', 'James'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    
    for (let i = 1; i <= 30; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const className = classes[Math.floor(Math.random() * classes.length)];
      const section = sections[Math.floor(Math.random() * sections.length)];
      
      const student = await Student.create({
        admissionNumber: `ADM-${new Date().getFullYear()}-${String(i).padStart(4, '0')}`,
        firstName,
        lastName,
        dateOfBirth: new Date(2010 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        gender: Math.random() > 0.5 ? 'Male' : 'Female',
        address: `${Math.floor(Math.random() * 100) + 1} Main St, City`,
        city: 'Sample City',
        state: 'Sample State',
        country: 'India',
        postalCode: '123456',
        phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        admissionDate: new Date(2020 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        class: className,
        section,
        rollNumber: Math.floor(Math.random() * 50) + 1,
        parentName: `Mr. & Mrs. ${lastName}`,
        parentPhone: `8${Math.floor(100000000 + Math.random() * 900000000)}`,
        parentEmail: `parent.${lastName.toLowerCase()}@example.com`,
        parentOccupation: ['Business', 'Service', 'Doctor', 'Engineer', 'Teacher', 'Farmer'][Math.floor(Math.random() * 6)],
        isActive: Math.random() > 0.1 // 90% chance of being active
      });
      
      students.push(student);
    }
    
    console.log('Students created successfully!');
    
    // Create sample fees
    const feeTypes = ['Tuition', 'Admission', 'Exam', 'Transport', 'Library'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const currentYear = new Date().getFullYear();
    
    for (const student of students) {
      // Create admission fee (one-time)
      await Fee.create({
        studentId: student.id,
        amount: 5000 + Math.floor(Math.random() * 5000),
        feeType: 'Admission',
        dueDate: student.admissionDate,
        paidDate: student.admissionDate,
        paymentStatus: 'Paid',
        paymentMethod: ['Cash', 'Bank Transfer', 'Cheque', 'Online Payment'][Math.floor(Math.random() * 4)],
        transactionId: `TXN${Math.floor(100000 + Math.random() * 900000)}`,
        discount: Math.random() > 0.8 ? Math.floor(Math.random() * 1000) : 0,
        fine: 0,
        description: 'One-time admission fee',
        academicYear: currentYear,
        createdBy: [admin.id, accountant.id][Math.floor(Math.random() * 2)]
      });
      
      // Create monthly fees for current year
      for (let i = 0; i < 12; i++) {
        const dueDate = new Date(currentYear, i, 10); // 10th of each month
        const isPaid = Math.random() > 0.3; // 70% chance of being paid
        
        await Fee.create({
          studentId: student.id,
          amount: 1000 + Math.floor(Math.random() * 2000),
          feeType: 'Tuition',
          dueDate,
          paidDate: isPaid ? new Date(currentYear, i, Math.floor(Math.random() * 15) + 1) : null,
          paymentStatus: isPaid ? 'Paid' : (dueDate < new Date() ? 'Overdue' : 'Unpaid'),
          paymentMethod: isPaid ? ['Cash', 'Bank Transfer', 'Cheque', 'Online Payment'][Math.floor(Math.random() * 4)] : null,
          transactionId: isPaid ? `TXN${Math.floor(100000 + Math.random() * 900000)}` : null,
          discount: Math.random() > 0.9 ? Math.floor(Math.random() * 500) : 0,
          fine: !isPaid && dueDate < new Date() ? Math.floor(Math.random() * 200) : 0,
          description: `Tuition fee for ${months[i]} ${currentYear}`,
          month: months[i],
          academicYear: currentYear.toString(),
          createdBy: [admin.id, accountant.id][Math.floor(Math.random() * 2)]
        });
      }
      
      // Create some exam fees
      await Fee.create({
        studentId: student.id,
        amount: 500 + Math.floor(Math.random() * 1000),
        feeType: 'Exam',
        dueDate: new Date(currentYear, 2, 1), // March 1st
        paidDate: new Date(currentYear, 2, Math.floor(Math.random() * 15) + 1),
        paymentStatus: 'Paid',
        paymentMethod: ['Cash', 'Bank Transfer', 'Cheque', 'Online Payment'][Math.floor(Math.random() * 4)],
        transactionId: `TXN${Math.floor(100000 + Math.random() * 900000)}`,
        discount: Math.random() > 0.9 ? Math.floor(Math.random() * 200) : 0,
        fine: 0,
        description: 'First term examination fee',
        academicYear: currentYear,
        createdBy: [admin.id, accountant.id][Math.floor(Math.random() * 2)]
      });
    }
    
    console.log('Sample fees created successfully!');
    console.log('Database seeding completed!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
