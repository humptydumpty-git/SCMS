// Main Application
const SchoolMS = (() => {
    // State
    let currentUser = null;
    let students = [];
    let fees = [];
    
    // Initialize the application
    const init = () => {
        console.log('Initializing application...');
        try {
            loadData();
            setupEventListeners();
            
            // Show login form by default
            showLoginForm();
            
            console.log('Application initialized successfully');
        } catch (error) {
            console.error('Error during initialization:', error);
        }
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
            showLoginForm();
        } else {
            showDashboard();
        }
    };
    
    // Setup event listeners
    const setupEventListeners = () => {
        console.log('Setting up event listeners...');
        
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
            console.log('Login form event listener added');
        } else {
            console.warn('Login form not found');
        }
        
        // Logout button (using event delegation since it might be dynamically added)
        document.addEventListener('click', (e) => {
            if (e.target.matches('#logoutBtn, #logoutBtn *')) {
                e.preventDefault();
                handleLogout();
            }
            
            // Navigation links
            const navLink = e.target.closest('[data-page]');
            if (navLink) {
                e.preventDefault();
                const page = navLink.getAttribute('data-page');
                console.log('Navigation clicked:', page);
                showPage(page);
            }
        });
        
        console.log('Event listeners setup complete');
    };
    
    // Handle login
    const handleLogin = (e) => {
        console.log('Login attempt...');
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        console.log('Login attempt with:', { email, password });
        
        // Hardcoded admin credentials
        if (email === 'admin@school.edu' && password === 'admin123') {
            console.log('Login successful');
            currentUser = {
                id: 1,
                name: 'Admin',
                email: 'admin@school.edu',
                role: 'admin'
            };
            
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            console.log('User saved to localStorage');
            
            // Hide login modal
            const loginModal = document.getElementById('loginModal');
            if (loginModal) {
                loginModal.style.display = 'none';
                console.log('Login modal hidden');
            } else {
                console.warn('Login modal not found');
            }
            
            // Show sidebar and main content
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                sidebar.style.display = 'block';
            }
            
            // Show dashboard
            console.log('Attempting to show dashboard...');
            showDashboard();
        } else {
            console.log('Login failed: Invalid credentials');
            alert('Invalid credentials');
        }
    };
    
    // Handle logout
    const handleLogout = () => {
        console.log('Logout attempt...');
        currentUser = null;
        localStorage.removeItem('currentUser');
        console.log('User removed from localStorage');
        
        // Hide sidebar
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.style.display = 'none';
        }
        
        // Show login form
        showLoginForm();
    };
    
    // Show login form
    const showLoginForm = () => {
        console.log('showLoginForm called');
        // The login form is already in the HTML, just make sure it's visible
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.style.display = 'block';
        }
    };
    
    // Show dashboard
    const showDashboard = () => {
        console.log('showDashboard called');
        const appContent = document.getElementById('app-content');
        if (!appContent) {
            console.error('App content element not found');
            return;
        }
        
        // Check if user is logged in
        if (!currentUser) {
            console.log('No current user, redirecting to login');
            showLoginForm();
            return;
        }
        
        console.log('Rendering dashboard for user:', currentUser);
        
        // Set active nav item
        const navLinks = document.querySelectorAll('.nav-link');
        console.log('Found nav links:', navLinks.length);
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === 'dashboard') {
                link.classList.add('active');
                console.log('Set active nav item: Dashboard');
            }
        });
        
        // Update page title
        document.title = 'Dashboard | SchoolMS';
        
        // Render dashboard content
        appContent.innerHTML = `
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 class="h2">Dashboard</h1>
            </div>
            <div class="row">
                <div class="col-12">
                    <div class="card mb-4">
                        <div class="card-body">
                            <h5 class="card-title">Welcome, ${currentUser.name}!</h5>
                            <p class="card-text">You are logged in as ${currentUser.role}.</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row" id="dashboard-stats">
                <!-- Stats will be loaded here -->
            </div>
        `;
        
        console.log('Dashboard content rendered');
        
        // Load dashboard content
        const statsContainer = document.getElementById('dashboard-stats');
        if (statsContainer) {
            showDashboardContent(statsContainer);
        } else {
            console.error('Dashboard stats container not found');
        }
    };
    
    // Show page based on route
    const showPage = (page) => {
        console.log('Showing page:', page);
        const appContent = document.getElementById('app-content');
        if (!appContent) {
            console.error('App content container not found');
            return;
        }
        
        // Update active nav item
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === page) {
                link.classList.add('active');
            }
        });
        
        // Show the appropriate content
        switch (page) {
            case 'dashboard':
                showDashboard();
                break;
            case 'students':
                showStudentsContent(appContent);
                break;
            case 'fees':
                showFeesContent(appContent);
                break;
            default:
                showDashboard();
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
