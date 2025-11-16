// Main Application
const SchoolMS = (() => {
    // State
    let currentUser = null;
    let students = [];
    let fees = [];
    
    // Initialize the application
    const init = () => {
        loadData();
        setupEventListeners();
        checkAuth();
    };
    
    // Load data from localStorage
    const loadData = () => {
        currentUser = JSON.parse(localStorage.getItem('currentUser'));
        students = JSON.parse(localStorage.getItem('students')) || [];
        fees = JSON.parse(localStorage.getItem('fees')) || [];
    };
    
    // Save data to localStorage
    const saveData = () => {
        localStorage.setItem('students', JSON.stringify(students));
        localStorage.setItem('fees', JSON.stringify(fees));
    };
    
    // Check authentication
    const checkAuth = () => {
        if (!currentUser) {
            showLogin();
        } else {
            showDashboard();
        }
    };
    
    // Setup event listeners
    const setupEventListeners = () => {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }
        
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
        
        // Navigation links
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-page]')) {
                e.preventDefault();
                const page = e.target.getAttribute('data-page');
                showPage(page);
            }
        });
    };
    
    // Handle login
    const handleLogin = (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        // Simple authentication (in a real app, validate against a server)
        if (email === 'admin@school.edu' && password === 'admin123') {
            currentUser = {
                id: 1,
                email: 'admin@school.edu',
                name: 'Admin',
                role: 'admin'
            };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showDashboard();
        } else {
            alert('Invalid credentials');
        }
    };
    
    // Handle logout
    const handleLogout = () => {
        currentUser = null;
        localStorage.removeItem('currentUser');
        showLogin();
    };
    
    // Show login page
    const showLogin = () => {
        document.body.innerHTML = `
            <div class="login-container">
                <div class="card">
                    <div class="card-body">
                        <h2 class="text-center mb-4">School Management System</h2>
                        <form id="loginForm">
                            <div class="mb-3">
                                <label for="loginEmail" class="form-label">Email</label>
                                <input type="email" class="form-control" id="loginEmail" required>
                            </div>
                            <div class="mb-3">
                                <label for="loginPassword" class="form-label">Password</label>
                                <input type="password" class="form-control" id="loginPassword" required>
                            </div>
                            <button type="submit" class="btn btn-primary w-100">Login</button>
                        </form>
                    </div>
                </div>
            </div>
        `;
    };
    
    // Show dashboard
    const showDashboard = () => {
        document.body.innerHTML = `
            <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
                <div class="container">
                    <a class="navbar-brand" href="#">SchoolMS</a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav me-auto">
                            <li class="nav-item">
                                <a class="nav-link active" href="#" data-page="dashboard">Dashboard</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="#" data-page="students">Students</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="#" data-page="fees">Fees</a>
                            </li>
                        </ul>
                        <div class="d-flex">
                            <button class="btn btn-outline-light" id="logoutBtn">Logout</button>
                        </div>
                    </div>
                </div>
            </nav>
            
            <div class="container mt-4" id="content">
                <!-- Content will be loaded here -->
            </div>
        `;
        
        // Reattach event listeners
        document.getElementById('logoutBtn').addEventListener('click', handleLogout);
        showPage('dashboard');
    };
    
    // Show page based on route
    const showPage = (page) => {
        const content = document.getElementById('content');
        if (!content) return;
        
        switch (page) {
            case 'dashboard':
                showDashboardContent(content);
                break;
            case 'students':
                showStudentsContent(content);
                break;
            case 'fees':
                showFeesContent(content);
                break;
            default:
                showDashboardContent(content);
        }
    };
    
    // Show dashboard content
    const showDashboardContent = (container) => {
        container.innerHTML = `
            <h2>Dashboard</h2>
            <div class="row mt-4">
                <div class="col-md-4 mb-4">
                    <div class="card bg-primary text-white">
                        <div class="card-body">
                            <h5 class="card-title">Total Students</h5>
                            <h2>${students.length}</h2>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-4">
                    <div class="card bg-success text-white">
                        <div class="card-body">
                            <h5 class="card-title">Total Fees Collected</h5>
                            <h2>$${fees.reduce((sum, fee) => sum + parseFloat(fee.amount || 0), 0).toFixed(2)}</h2>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-4">
                    <div class="card bg-info text-white">
                        <div class="card-body">
                            <h5 class="card-title">Active Users</h5>
                            <h2>1</h2>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };
    
    // Show students content
    const showStudentsContent = (container) => {
        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2>Students</h2>
                <button class="btn btn-primary" id="addStudentBtn">Add Student</button>
            </div>
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Class</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${students.map(student => `
                            <tr>
                                <td>${student.id}</td>
                                <td>${student.name}</td>
                                <td>${student.email}</td>
                                <td>${student.class || 'N/A'}</td>
                                <td>
                                    <button class="btn btn-sm btn-primary">Edit</button>
                                    <button class="btn btn-sm btn-danger">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    };
    
    // Show fees content
    const showFeesContent = (container) => {
        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2>Fee Management</h2>
                <button class="btn btn-primary" id="addFeeBtn">Add Fee</button>
            </div>
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Student</th>
                            <th>Amount</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${fees.map(fee => `
                            <tr>
                                <td>${fee.id}</td>
                                <td>${getStudentName(fee.studentId)}</td>
                                <td>$${parseFloat(fee.amount || 0).toFixed(2)}</td>
                                <td>${new Date(fee.date).toLocaleDateString()}</td>
                                <td>${fee.status || 'Paid'}</td>
                                <td>
                                    <button class="btn btn-sm btn-primary">Edit</button>
                                    <button class="btn btn-sm btn-danger">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    };
    
    // Helper function to get student name by ID
    const getStudentName = (studentId) => {
        const student = students.find(s => s.id === studentId);
        return student ? student.name : 'Unknown';
    };
    
    // Public methods
    return {
        init
    };
})();

// Initialize the application when the DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        SchoolMS.init();
    });
} else {
    // DOMContentLoaded has already fired
    SchoolMS.init();
}

// For debugging
console.log('app.js loaded');
