// Main Application
const SchoolMS = (() => {
    // State
    let currentUser = null;
    let students = [
        {
            id: 1,
            admissionNumber: 'STD-2023-001',
            firstName: 'John',
            lastName: 'Doe',
            gender: 'Male',
            dateOfBirth: '2010-05-15',
            email: 'john.doe@example.com',
            phone: '1234567890',
            address: '123 Main St, City',
            class: '10',
            section: 'A',
            admissionDate: '2023-01-10',
            parentName: 'Jane Doe',
            parentPhone: '0987654321',
            parentEmail: 'parent@example.com',
            status: 'Active',
            createdAt: new Date().toISOString()
        },
        {
            id: 2,
            admissionNumber: 'STD-2023-002',
            firstName: 'Jane',
            lastName: 'Smith',
            gender: 'Female',
            dateOfBirth: '2011-08-22',
            email: 'jane.smith@example.com',
            phone: '2345678901',
            address: '456 Oak Ave, Town',
            class: '9',
            section: 'B',
            admissionDate: '2023-01-12',
            parentName: 'John Smith',
            parentPhone: '9876543210',
            parentEmail: 'parent.smith@example.com',
            status: 'Active',
            createdAt: new Date().toISOString()
        }
    ];
    
    let fees = [];
    let classes = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    let sections = ['A', 'B', 'C', 'D'];
    let academicYears = [
        { id: 1, name: '2023-2024', isCurrent: true },
        { id: 2, name: '2022-2023', isCurrent: false },
        { id: 3, name: '2021-2022', isCurrent: false }
    ];
    
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
        
        // Handle all clicks in the document
        document.addEventListener('click', (e) => {
            // Logout button
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
            
            // Add Student button
            if (e.target.matches('#addStudentBtn, #addStudentBtn *')) {
                e.preventDefault();
                showAddStudentForm();
            }
            
            // Add Fee button
            if (e.target.matches('#addFeeBtn, #addFeeBtn *')) {
                e.preventDefault();
                showAddFeeForm();
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
            case 'profile':
                showProfileContent(appContent);
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
        // Get current academic year
        const currentYear = academicYears.find(y => y.isCurrent) || academicYears[0];
        
        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 class="mb-0">Student Management</h2>
                    <p class="text-muted mb-0">Academic Year: ${currentYear.name}</p>
                </div>
                <div>
                    <button class="btn btn-primary" id="addStudentBtn">
                        <i class="fas fa-plus me-1"></i> Add New Student
                    </button>
                    <button class="btn btn-outline-secondary ms-2" id="exportStudentsBtn">
                        <i class="fas fa-download me-1"></i> Export
                    </button>
                </div>
            </div>
            
            <!-- Student Statistics -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card bg-primary text-white">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="mb-0">Total Students</h6>
                                    <h2 class="mb-0">${students.length}</h2>
                                </div>
                                <i class="fas fa-users fa-2x opacity-50"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-success text-white">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="mb-0">Active Students</h6>
                                    <h2 class="mb-0">${students.filter(s => s.status === 'Active').length}</h2>
                                </div>
                                <i class="fas fa-user-check fa-2x opacity-50"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-info text-white">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="mb-0">Boys</h6>
                                    <h2 class="mb-0">${students.filter(s => s.gender === 'Male').length}</h2>
                                </div>
                                <i class="fas fa-male fa-2x opacity-50"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-warning text-white">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="mb-0">Girls</h6>
                                    <h2 class="mb-0">${students.filter(s => s.gender === 'Female').length}</h2>
                                </div>
                                <i class="fas fa-female fa-2x opacity-50"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Filters -->
            <div class="card mb-4">
                <div class="card-body p-3">
                    <div class="row g-3">
                        <div class="col-md-3">
                            <label class="form-label">Class</label>
                            <select class="form-select" id="filterClass">
                                <option value="">All Classes</option>
                                ${classes.map(c => `<option value="${c}">Class ${c}</option>`).join('')}
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Section</label>
                            <select class="form-select" id="filterSection">
                                <option value="">All Sections</option>
                                ${sections.map(s => `<option value="${s}">Section ${s}</option>`).join('')}
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Search</label>
                            <div class="input-group">
                                <input type="text" class="form-control" id="searchStudent" placeholder="Search by name, ID, or parent...">
                                <button class="btn btn-outline-secondary" type="button" id="searchBtn">
                                    <i class="fas fa-search"></i>
                                </button>
                            </div>
                        </div>
                        <div class="col-md-2 d-flex align-items-end">
                            <button class="btn btn-outline-secondary w-100" id="resetFilters">
                                <i class="fas fa-undo me-1"></i> Reset
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Student List -->
            <div class="card">
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>#</th>
                                    <th>Student</th>
                                    <th>Admission No.</th>
                                    <th>Class</th>
                                    <th>Gender</th>
                                    <th>Parent</th>
                                    <th>Contact</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="studentList">
                                ${students.map((student, index) => `
                                    <tr>
                                        <td>${index + 1}</td>
                                        <td>
                                            <div class="d-flex align-items-center">
                                                <div class="avatar avatar-sm me-2">
                                                    <span class="avatar-initial rounded-circle bg-primary text-white">
                                                        ${student.firstName.charAt(0)}${student.lastName.charAt(0)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <h6 class="mb-0">${student.firstName} ${student.lastName}</h6>
                                                    <small class="text-muted">${student.email}</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td>${student.admissionNumber}</td>
                                        <td>${student.class} - ${student.section}</td>
                                        <td>${student.gender}</td>
                                        <td>
                                            <div>${student.parentName}</div>
                                            <small class="text-muted">${student.parentPhone}</small>
                                        </td>
                                        <td>${student.phone}</td>
                                        <td>
                                            <span class="badge bg-${student.status === 'Active' ? 'success' : 'danger'} bg-opacity-10 text-${student.status === 'Active' ? 'success' : 'danger'} p-2">
                                                ${student.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div class="dropdown">
                                                <button class="btn btn-sm btn-light dropdown-toggle" type="button" id="studentActions${student.id}" data-bs-toggle="dropdown" aria-expanded="false">
                                                    <i class="fas fa-ellipsis-v"></i>
                                                </button>
                                                <ul class="dropdown-menu" aria-labelledby="studentActions${student.id}">
                                                    <li>
                                                        <a class="dropdown-item" href="#" data-action="view" data-id="${student.id}">
                                                            <i class="fas fa-eye me-2"></i>View Details
                                                        </a>
                                                    </li>
                                                    <li>
                                                        <a class="dropdown-item" href="#" data-action="edit" data-id="${student.id}">
                                                            <i class="fas fa-edit me-2"></i>Edit
                                                        </a>
                                                    </li>
                                                    <li>
                                                        <a class="dropdown-item" href="#" data-action="promote" data-id="${student.id}">
                                                            <i class="fas fa-graduation-cap me-2"></i>Promote
                                                        </a>
                                                    </li>
                                                    <li><hr class="dropdown-divider"></li>
                                                    <li>
                                                        <a class="dropdown-item text-danger" href="#" data-action="delete" data-id="${student.id}">
                                                            <i class="fas fa-trash-alt me-2"></i>Delete
                                                        </a>
                                                    </li>
                                                </ul>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Pagination -->
                    <div class="d-flex justify-content-between align-items-center p-3 border-top">
                        <div class="text-muted">
                            Showing <span class="fw-bold">1</span> to <span class="fw-bold">${Math.min(10, students.length)}</span> of <span class="fw-bold">${students.length}</span> entries
                        </div>
                        <nav>
                            <ul class="pagination mb-0">
                                <li class="page-item disabled">
                                    <a class="page-link" href="#" tabindex="-1" aria-disabled="true">Previous</a>
                                </li>
                                <li class="page-item active"><a class="page-link" href="#">1</a></li>
                                ${students.length > 10 ? '<li class="page-item"><a class="page-link" href="#">2</a></li>' : ''}
                                ${students.length > 20 ? '<li class="page-item"><a class="page-link" href="#">3</a></li>' : ''}
                                ${students.length > 10 ? `
                                    <li class="page-item">
                                        <a class="page-link" href="#">Next</a>
                                    </li>
                                ` : ''}
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>
            
            <!-- Quick Actions -->
            <div class="mt-3 d-flex justify-content-end">
                <div class="btn-group">
                    <button type="button" class="btn btn-outline-secondary">
                        <i class="fas fa-print me-1"></i> Print List
                    </button>
                    <button type="button" class="btn btn-outline-secondary">
                        <i class="fas fa-file-export me-1"></i> Export to Excel
                    </button>
                    <button type="button" class="btn btn-outline-secondary">
                        <i class="fas fa-file-pdf me-1"></i> Export to PDF
                    </button>
                </div>
            </div>
        `;
        
        // Add event listeners for the new elements
        setupStudentEventListeners();
    };
    
    // Setup event listeners for student management
    const setupStudentEventListeners = () => {
        // Add Student button
        document.getElementById('addStudentBtn')?.addEventListener('click', showAddStudentForm);
        
        // Search functionality
        const searchBtn = document.getElementById('searchBtn');
        const searchInput = document.getElementById('searchStudent');
        
        const performSearch = () => {
            const searchTerm = searchInput.value.toLowerCase();
            const rows = document.querySelectorAll('#studentList tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        };
        
        searchBtn?.addEventListener('click', performSearch);
        searchInput?.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') performSearch();
        });
        
        // Filter functionality
        const filterClass = document.getElementById('filterClass');
        const filterSection = document.getElementById('filterSection');
        const resetFilters = document.getElementById('resetFilters');
        
        const applyFilters = () => {
            const classValue = filterClass.value;
            const sectionValue = filterSection.value;
            
            const rows = document.querySelectorAll('#studentList tr');
            rows.forEach(row => {
                const classMatch = !classValue || row.cells[3].textContent.includes(classValue);
                const sectionMatch = !sectionValue || row.cells[3].textContent.includes(sectionValue);
                row.style.display = (classMatch && sectionMatch) ? '' : 'none';
            });
        };
        
        filterClass?.addEventListener('change', applyFilters);
        filterSection?.addEventListener('change', applyFilters);
        resetFilters?.addEventListener('click', () => {
            if (filterClass) filterClass.value = '';
            if (filterSection) filterSection.value = '';
            if (searchInput) searchInput.value = '';
            
            const rows = document.querySelectorAll('#studentList tr');
            rows.forEach(row => row.style.display = '');
        });
    };
    
    // Show add student form
    const showAddStudentForm = () => {
        const appContent = document.getElementById('app-content');
        if (!appContent) return;
        
        const newId = students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1;
        const admissionNumber = `STD-${new Date().getFullYear()}-${String(newId).padStart(3, '0')}`;
        
        appContent.innerHTML = `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Add New Student</h5>
                    <button type="button" class="btn-close" onclick="showPage('students')"></button>
                </div>
                <div class="card-body">
                    <form id="studentForm">
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label for="firstName" class="form-label">First Name <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="firstName" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="lastName" class="form-label">Last Name <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="lastName" required>
                            </div>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label for="dateOfBirth" class="form-label">Date of Birth <span class="text-danger">*</span></label>
                                <input type="date" class="form-control" id="dateOfBirth" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Gender <span class="text-danger">*</span></label>
                                <div class="d-flex gap-3">
                                    <div class="form-check">
                                        <input class="form-check-input" type="radio" name="gender" id="genderMale" value="Male" checked>
                                        <label class="form-check-label" for="genderMale">
                                            Male
                                        </label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="radio" name="gender" id="genderFemale" value="Female">
                                        <label class="form-check-label" for="genderFemale">
                                            Female
                                        </label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="radio" name="gender" id="genderOther" value="Other">
                                        <label class="form-check-label" for="genderOther">
                                            Other
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label for="email" class="form-label">Email address</label>
                                <input type="email" class="form-control" id="email">
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="phone" class="form-label">Phone Number</label>
                                <input type="tel" class="form-control" id="phone">
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <label for="address" class="form-label">Address</label>
                            <textarea class="form-control" id="address" rows="2"></textarea>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-4 mb-3">
                                <label for="studentClass" class="form-label">Class <span class="text-danger">*</span></label>
                                <select class="form-select" id="studentClass" required>
                                    ${classes.map(c => `<option value="${c}">Class ${c}</option>`).join('')}
                                </select>
                            </div>
                            <div class="col-md-4 mb-3">
                                <label for="section" class="form-label">Section <span class="text-danger">*</span></label>
                                <select class="form-select" id="section" required>
                                    ${sections.map(s => `<option value="${s}">Section ${s}</option>`).join('')}
                                </select>
                            </div>
                            <div class="col-md-4 mb-3">
                                <label for="admissionDate" class="form-label">Admission Date <span class="text-danger">*</span></label>
                                <input type="date" class="form-control" id="admissionDate" value="${new Date().toISOString().split('T')[0]}" required>
                            </div>
                        </div>
                        
                        <h5 class="mt-4 mb-3">Parent/Guardian Information</h5>
                        
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label for="parentName" class="form-label">Parent/Guardian Name <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="parentName" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="parentRelation" class="form-label">Relationship <span class="text-danger">*</span></label>
                                <select class="form-select" id="parentRelation" required>
                                    <option value="Father">Father</option>
                                    <option value="Mother">Mother</option>
                                    <option value="Guardian">Guardian</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label for="parentEmail" class="form-label">Parent Email</label>
                                <input type="email" class="form-control" id="parentEmail">
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="parentPhone" class="form-label">Parent Phone <span class="text-danger">*</span></label>
                                <input type="tel" class="form-control" id="parentPhone" required>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <label for="parentAddress" class="form-label">Parent Address</label>
                            <textarea class="form-control" id="parentAddress" rows="2"></textarea>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label for="status" class="form-label">Status <span class="text-danger">*</span></label>
                                <select class="form-select" id="status" required>
                                    <option value="Active" selected>Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="Graduated">Graduated</option>
                                    <option value="Transferred">Transferred</option>
                                </select>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="admissionNumber" class="form-label">Admission Number</label>
                                <input type="text" class="form-control" id="admissionNumber" value="${admissionNumber}" readonly>
                            </div>
                        </div>
                        
                        <div class="d-flex justify-content-end gap-2 mt-4">
                            <button type="button" class="btn btn-secondary" onclick="showPage('students')">
                                <i class="fas fa-times me-1"></i> Cancel
                            </button>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save me-1"></i> Save Student
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        // Add form submission handler
        const form = document.getElementById('studentForm');
        if (form) {
            form.addEventListener('submit', handleAddStudent);
        }
    };
    
    // Handle add student form submission
    const handleAddStudent = (e) => {
        e.preventDefault();
        
        const newStudent = {
            id: students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1,
            admissionNumber: document.getElementById('admissionNumber').value,
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            gender: document.querySelector('input[name="gender"]:checked').value,
            dateOfBirth: document.getElementById('dateOfBirth').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
            class: document.getElementById('studentClass').value,
            section: document.getElementById('section').value,
            admissionDate: document.getElementById('admissionDate').value,
            parentName: document.getElementById('parentName').value,
            parentRelation: document.getElementById('parentRelation').value,
            parentEmail: document.getElementById('parentEmail').value,
            parentPhone: document.getElementById('parentPhone').value,
            parentAddress: document.getElementById('parentAddress').value,
            status: document.getElementById('status').value,
            createdAt: new Date().toISOString()
        };
        
        students.push(newStudent);
        saveData();
        
        // Show success message and go back to students list
        alert('Student added successfully!');
        showPage('students');
    };

    // Public API
    return {
        init,
        showLogin: showLoginForm,
        showDashboard,
        showStudentsContent,
        showPage
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
