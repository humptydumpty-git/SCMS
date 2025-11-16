// ==================== SECURITY & ACCESS CONTROL ====================
// User Roles
const ROLES = {
    ADMIN: 'admin',
    TEACHER: 'teacher',
    STUDENT: 'student',
    PARENT: 'parent'
};

// Permissions
const PERMISSIONS = {
    VIEW_DASHBOARD: ['admin', 'teacher'],
    MANAGE_STUDENTS: ['admin', 'teacher'],
    MANAGE_FEES: ['admin', 'teacher'],
    MANAGE_USERS: ['admin'],
    VIEW_ATTENDANCE: ['admin', 'teacher', 'parent'],
    MANAGE_ATTENDANCE: ['admin', 'teacher'],
    VIEW_GRADES: ['admin', 'teacher', 'parent', 'student'],
    MANAGE_GRADES: ['admin', 'teacher'],
    EXPORT_DATA: ['admin', 'teacher']
};

// Simple password hashing (in production, use proper hashing like bcrypt)
function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
}

// Get current user
function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

// Set current user
function setCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('sessionStart', new Date().toISOString());
}

// Check if user has permission
function hasPermission(permission) {
    const user = getCurrentUser();
    if (!user) return false;
    if (user.role === ROLES.ADMIN) return true; // Admin has all permissions
    return PERMISSIONS[permission]?.includes(user.role) || false;
}

// Check session timeout (30 minutes)
function checkSession() {
    const sessionStart = localStorage.getItem('sessionStart');
    if (!sessionStart) return false;
    
    const sessionDuration = 30 * 60 * 1000; // 30 minutes
    const now = new Date().getTime();
    const start = new Date(sessionStart).getTime();
    
    if (now - start > sessionDuration) {
        logout();
        return false;
    }
    
    // Update session
    localStorage.setItem('sessionStart', new Date().toISOString());
    return true;
}

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('sessionStart');
    window.location.reload();
}

// Initialize default admin user if not exists
function initializeDefaultUsers() {
    // Load existing users from localStorage first
    const existingUsers = JSON.parse(localStorage.getItem('users')) || [];
    
    // If no users exist, create default admin
    if (existingUsers.length === 0) {
        const defaultAdmin = {
            id: 1,
            username: 'admin',
            email: 'admin@school.edu',
            password: hashPassword('admin123'),
            role: ROLES.ADMIN,
            firstName: 'Admin',
            lastName: 'User',
            createdAt: new Date().toISOString()
        };
        users.push(defaultAdmin);
        saveData();
    } else {
        // Check if admin user exists, if not create it
        const adminExists = existingUsers.some(u => u.email === 'admin@school.edu');
        if (!adminExists) {
            const defaultAdmin = {
                id: Math.max(...existingUsers.map(u => u.id || 0), 0) + 1,
                username: 'admin',
                email: 'admin@school.edu',
                password: hashPassword('admin123'),
                role: ROLES.ADMIN,
                firstName: 'Admin',
                lastName: 'User',
                createdAt: new Date().toISOString()
            };
            users.push(defaultAdmin);
            saveData();
        } else {
            // Load existing users into the array
            users.length = 0; // Clear array
            users.push(...existingUsers);
        }
    }
}

// ==================== DATA STORAGE ====================
let fees = [];
let students = [];
let users = [];
let attendance = [];
let grades = [];

// Load data from localStorage
function loadData() {
    try {
        fees = JSON.parse(localStorage.getItem('fees')) || [];
        students = JSON.parse(localStorage.getItem('students')) || [];
        users = JSON.parse(localStorage.getItem('users')) || [];
        attendance = JSON.parse(localStorage.getItem('attendance')) || [];
        grades = JSON.parse(localStorage.getItem('grades')) || [];
    } catch (error) {
        console.error('Error loading data:', error);
        fees = [];
        students = [];
        users = [];
        attendance = [];
        grades = [];
    }
}

// Save data to localStorage
async function saveData() {
    try {
        localStorage.setItem('fees', JSON.stringify(fees));
        localStorage.setItem('students', JSON.stringify(students));
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('attendance', JSON.stringify(attendance));
        localStorage.setItem('grades', JSON.stringify(grades));
        return true;
    } catch (error) {
        console.error('Error saving data:', error);
        throw error;
    }
}

// ==================== FEE MANAGEMENT ====================
// 1. Fix fee management buttons
function setupFeeEventListeners() {
    // Add fee button
    document.getElementById('addFeeBtn')?.addEventListener('click', showAddFeeForm);
    
    // Print button
    document.getElementById('printFeesBtn')?.addEventListener('click', () => {
        window.print();
    });
    
    // Export button
    document.getElementById('exportFeesBtn')?.addEventListener('click', () => {
        exportFees('excel');
    });
    
    // Import button
    document.getElementById('importFeesBtn')?.addEventListener('click', () => {
        document.getElementById('importFeesInput')?.click();
    });
    
    // Import file input change
    document.getElementById('importFeesInput')?.addEventListener('change', handleFeeImport);
    
    // Search input
    const searchInput = document.getElementById('feeSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterFees(e.target.value);
        });
    }
    
    // Status filter
    const statusFilter = document.getElementById('feeStatusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            filterFees(document.getElementById('feeSearchInput')?.value || '', e.target.value);
        });
    }
}

// Show add fee form modal
function showAddFeeForm() {
    const modalHTML = `
        <div class="modal fade" id="feeModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Record Fee Payment</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="feeForm">
                            <div class="mb-3">
                                <label for="feeStudentId" class="form-label">Student <span class="text-danger">*</span></label>
                                <select class="form-select" id="feeStudentId" required>
                                    <option value="">Select Student</option>
                                    ${students.map(s => `<option value="${s.id}">${s.name || s.firstName + ' ' + s.lastName}</option>`).join('')}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="feeAmount" class="form-label">Amount <span class="text-danger">*</span></label>
                                <input type="number" class="form-control" id="feeAmount" step="0.01" min="0" required>
                            </div>
                            <div class="mb-3">
                                <label for="feePaymentDate" class="form-label">Payment Date <span class="text-danger">*</span></label>
                                <input type="date" class="form-control" id="feePaymentDate" required>
                            </div>
                            <div class="mb-3">
                                <label for="feePaymentMethod" class="form-label">Payment Method</label>
                                <select class="form-select" id="feePaymentMethod">
                                    <option value="Cash">Cash</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Cheque">Cheque</option>
                                    <option value="Card">Card</option>
                                    <option value="Online">Online</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="feeReference" class="form-label">Reference Number</label>
                                <input type="text" class="form-control" id="feeReference">
                            </div>
                            <div class="mb-3">
                                <label for="feeDescription" class="form-label">Description</label>
                                <textarea class="form-control" id="feeDescription" rows="3"></textarea>
                            </div>
                            <div class="d-grid">
                                <button type="submit" class="btn btn-primary">Record Payment</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('feeModal');
    if (existingModal) existingModal.remove();
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Set default date to today
    document.getElementById('feePaymentDate').valueAsDate = new Date();
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('feeModal'));
    modal.show();
    
    // Add form submit handler
    document.getElementById('feeForm').addEventListener('submit', handleAddFee);
}

// Filter fees
function filterFees(searchTerm = '', statusFilter = '') {
    const tbody = document.getElementById('feesTableBody');
    if (!tbody) return;
    
    let filtered = fees;
    
    // Apply search filter
    if (searchTerm) {
        filtered = filtered.filter(fee => {
            const student = students.find(s => s.id === fee.studentId);
            const studentName = student ? (student.name || student.firstName + ' ' + student.lastName) : '';
            return (
                (studentName && studentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (fee.paymentReference && fee.paymentReference.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (fee.id && fee.id.toString().includes(searchTerm))
            );
        });
    }
    
    // Apply status filter
    if (statusFilter) {
        filtered = filtered.filter(fee => fee.status === statusFilter);
    }
    
    // Update table
    renderFeesTable(filtered);
}

// Export fees
function exportFees(format = 'excel') {
    if (fees.length === 0) {
        showAlert('No fees to export', 'warning');
        return;
    }
    
    // Create CSV content
    const headers = ['ID', 'Student', 'Amount', 'Payment Date', 'Payment Method', 'Reference', 'Status'];
    const rows = fees.map(fee => {
        const student = students.find(s => s.id === fee.studentId);
        const studentName = student ? (student.name || student.firstName + ' ' + student.lastName) : 'N/A';
        return [
            fee.id,
            studentName,
            fee.amount,
            new Date(fee.paymentDate).toLocaleDateString(),
            fee.paymentMethod || 'N/A',
            fee.paymentReference || 'N/A',
            fee.status
        ];
    });
    
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fees_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showAlert('Fees exported successfully!', 'success');
}

// Handle fee import
function handleFeeImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            // Simple CSV parsing (you might want to use a library for complex CSVs)
            const text = event.target.result;
            const lines = text.split('\n');
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            
            // Process rows (skip header)
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
                // Add import logic here
            }
            
            showAlert('Fees imported successfully!', 'success');
            renderFeesTable();
        } catch (error) {
            console.error('Import error:', error);
            showAlert('Failed to import fees. Please check the file format.', 'danger');
        }
    };
    reader.readAsText(file);
    
    // Reset input
    e.target.value = '';
}

// View fee details
function viewFeeDetails(feeId) {
    const fee = fees.find(f => f.id === feeId);
    if (!fee) {
        showAlert('Fee not found', 'danger');
        return;
    }
    
    const student = students.find(s => s.id === fee.studentId);
    const studentName = student ? (student.name || student.firstName + ' ' + student.lastName) : 'N/A';
    
    const modalHTML = `
        <div class="modal fade" id="viewFeeModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Fee Details</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <dl class="row">
                            <dt class="col-sm-4">ID:</dt>
                            <dd class="col-sm-8">${fee.id}</dd>
                            <dt class="col-sm-4">Student:</dt>
                            <dd class="col-sm-8">${studentName}</dd>
                            <dt class="col-sm-4">Amount:</dt>
                            <dd class="col-sm-8">$${fee.amount?.toFixed(2)}</dd>
                            <dt class="col-sm-4">Payment Date:</dt>
                            <dd class="col-sm-8">${new Date(fee.paymentDate).toLocaleDateString()}</dd>
                            <dt class="col-sm-4">Payment Method:</dt>
                            <dd class="col-sm-8">${fee.paymentMethod || 'N/A'}</dd>
                            <dt class="col-sm-4">Reference:</dt>
                            <dd class="col-sm-8">${fee.paymentReference || 'N/A'}</dd>
                            <dt class="col-sm-4">Status:</dt>
                            <dd class="col-sm-8"><span class="badge bg-${fee.status === 'Paid' ? 'success' : fee.status === 'Pending' ? 'warning' : 'danger'}">${fee.status}</span></dd>
                            ${fee.description ? `<dt class="col-sm-4">Description:</dt><dd class="col-sm-8">${fee.description}</dd>` : ''}
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('viewFeeModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = new bootstrap.Modal(document.getElementById('viewFeeModal'));
    modal.show();
}

// Edit fee
function editFee(feeId) {
    const fee = fees.find(f => f.id === feeId);
    if (!fee) {
        showAlert('Fee not found', 'danger');
        return;
    }
    
    showAddFeeForm();
    
    // Wait for modal to be shown, then populate fields
    setTimeout(() => {
        document.getElementById('feeStudentId').value = fee.studentId;
        document.getElementById('feeAmount').value = fee.amount;
        document.getElementById('feePaymentDate').value = fee.paymentDate.split('T')[0];
        document.getElementById('feePaymentMethod').value = fee.paymentMethod || 'Cash';
        document.getElementById('feeReference').value = fee.paymentReference || '';
        document.getElementById('feeDescription').value = fee.description || '';
        
        // Update form handler to edit instead of add
        const form = document.getElementById('feeForm');
        form.removeEventListener('submit', handleAddFee);
        form.addEventListener('submit', (e) => handleUpdateFee(e, feeId));
    }, 300);
}

// Update fee
async function handleUpdateFee(e, feeId) {
    e.preventDefault();
    
    try {
        const feeIndex = fees.findIndex(f => f.id === feeId);
        if (feeIndex === -1) throw new Error('Fee not found');
        
        const formData = {
            studentId: document.getElementById('feeStudentId').value,
            amount: parseFloat(document.getElementById('feeAmount').value),
            paymentDate: document.getElementById('feePaymentDate').value,
            paymentMethod: document.getElementById('feePaymentMethod').value,
            paymentReference: document.getElementById('feeReference').value,
            description: document.getElementById('feeDescription').value,
            status: fees[feeIndex].status
        };
        
        if (!formData.studentId || isNaN(formData.amount) || !formData.paymentDate) {
            throw new Error('Please fill in all required fields');
        }
        
        fees[feeIndex] = {
            ...fees[feeIndex],
            ...formData,
            updatedAt: new Date().toISOString()
        };
        
        await saveData();
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('feeModal'));
        if (modal) modal.hide();
        
        showAlert('Fee updated successfully!', 'success');
        showFeesContent(document.getElementById('app-content'));
    } catch (error) {
        console.error('Error updating fee:', error);
        showAlert(error.message || 'Failed to update fee.', 'danger');
    }
}

// Delete fee
async function deleteFee(feeId) {
    if (!confirm('Are you sure you want to delete this fee record?')) return;
    
    try {
        const feeIndex = fees.findIndex(f => f.id === feeId);
        if (feeIndex === -1) throw new Error('Fee not found');
        
        fees.splice(feeIndex, 1);
        await saveData();
        
        showAlert('Fee deleted successfully!', 'success');
        renderFeesTable();
    } catch (error) {
        console.error('Error deleting fee:', error);
        showAlert('Failed to delete fee.', 'danger');
    }
}

// Handle add fee submission
async function handleAddFee(e) {
    e.preventDefault();
    
    try {
        // Show loading state
        const submitBtn = document.querySelector('#feeForm button[type="submit"]');
        if (!submitBtn) return;
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
        
        // Get form data
        const formData = {
            studentId: document.getElementById('feeStudentId').value,
            amount: parseFloat(document.getElementById('feeAmount').value),
            paymentDate: document.getElementById('feePaymentDate').value,
            paymentMethod: document.getElementById('feePaymentMethod').value,
            paymentReference: document.getElementById('feeReference').value,
            description: document.getElementById('feeDescription').value,
            status: 'Paid' // Default status
        };
        
        // Validate required fields
        if (!formData.studentId || isNaN(formData.amount) || !formData.paymentDate) {
            throw new Error('Please fill in all required fields');
        }
        
        // Get student name for display
        const student = students.find(s => s.id === parseInt(formData.studentId));
        const studentName = student ? (student.name || student.firstName + ' ' + student.lastName) : 'Unknown';
        
        // Add fee to the array
        const newFee = {
            id: fees.length > 0 ? Math.max(...fees.map(f => f.id)) + 1 : 1,
            ...formData,
            studentId: parseInt(formData.studentId),
            studentName: studentName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        fees.push(newFee);
        await saveData();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('feeModal'));
        if (modal) modal.hide();
        
        // Show success message
        showAlert('Fee recorded successfully!', 'success');
        
        // Refresh fee list
        showFeesContent(document.getElementById('app-content'));
        
    } catch (error) {
        console.error('Error adding fee:', error);
        showAlert(error.message || 'Failed to record fee. Please try again.', 'danger');
    } finally {
        // Reset button state
        const submitBtn = document.querySelector('#feeForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Record Payment';
        }
    }
}

// 3. Fix authentication state management
function checkAuth() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn && !window.location.href.includes('login.html')) {
        window.location.href = 'login.html';
    }
    return isLoggedIn;
}

// 4. Add showAlert helper function
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show mt-3`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Try to find app-content container, otherwise use main container
    const container = document.getElementById('app-content') || 
                     document.querySelector('.container-fluid') || 
                     document.querySelector('.container') || 
                     document.body;
    container.prepend(alertDiv);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        const alert = bootstrap.Alert.getOrCreateInstance(alertDiv);
        if (alert) alert.close();
    }, 5000);
}

// 5. Update the showFeesContent function to ensure proper initialization
function showFeesContent(container) {
    if (!container) return;
    
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="mb-0">Fee Management</h2>
            <div>
                <button id="exportFeesBtn" class="btn btn-outline-secondary me-2">
                    <i class="fas fa-download me-1"></i> Export
                </button>
                <button id="printFeesBtn" class="btn btn-outline-secondary me-2">
                    <i class="fas fa-print me-1"></i> Print
                </button>
                <button id="addFeeBtn" class="btn btn-primary">
                    <i class="fas fa-plus me-1"></i> Record Payment
                </button>
            </div>
        </div>
        
        <div class="card">
            <div class="card-body">
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="input-group">
                            <span class="input-group-text"><i class="fas fa-search"></i></span>
                            <input type="text" id="feeSearchInput" class="form-control" placeholder="Search fees...">
                        </div>
                    </div>
                    <div class="col-md-3">
                        <select id="feeStatusFilter" class="form-select">
                            <option value="">All Status</option>
                            <option value="Paid">Paid</option>
                            <option value="Pending">Pending</option>
                            <option value="Overdue">Overdue</option>
                        </select>
                    </div>
                </div>
                
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Student</th>
                                <th>Amount</th>
                                <th>Payment Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="feesTableBody">
                            <!-- Filled by JavaScript -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <!-- Hidden file input for import -->
        <input type="file" id="importFeesInput" accept=".xlsx,.xls,.csv" style="display: none;">
    `;
    
    // Initialize event listeners
    setupFeeEventListeners();
    renderFeesTable();
}

// Render fees table
function renderFeesTable(filteredFees = null) {
    const tbody = document.getElementById('feesTableBody');
    if (!tbody) return;
    
    const feesToRender = filteredFees !== null ? filteredFees : fees;
    
    tbody.innerHTML = feesToRender.length > 0 
        ? feesToRender.map(fee => {
            const student = students.find(s => s.id === fee.studentId);
            const studentName = fee.studentName || (student ? (student.name || student.firstName + ' ' + student.lastName) : 'N/A');
            
            return `
            <tr>
                <td>${fee.id}</td>
                <td>${studentName}</td>
                <td>$${fee.amount?.toFixed(2) || '0.00'}</td>
                <td>${fee.paymentDate ? new Date(fee.paymentDate).toLocaleDateString() : 'N/A'}</td>
                <td><span class="badge bg-${fee.status === 'Paid' ? 'success' : fee.status === 'Pending' ? 'warning' : 'danger'}">${fee.status || 'Pending'}</span></td>
                <td>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="#" data-action="view-fee" data-id="${fee.id}"><i class="fas fa-eye me-2"></i>View</a></li>
                            <li><a class="dropdown-item" href="#" data-action="edit-fee" data-id="${fee.id}"><i class="fas fa-edit me-2"></i>Edit</a></li>
                            <li><a class="dropdown-item text-danger" href="#" data-action="delete-fee" data-id="${fee.id}"><i class="fas fa-trash me-2"></i>Delete</a></li>
                        </ul>
                    </div>
                </td>
            </tr>
        `;
        }).join('')
        : '<tr><td colspan="6" class="text-center py-4">No fees found</td></tr>';
    
    // Add event listeners to action buttons
    document.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const actionBtn = e.target.closest('[data-action]');
            if (!actionBtn) return;
            
            const action = actionBtn.getAttribute('data-action');
            const feeId = parseInt(actionBtn.getAttribute('data-id'));
            
            switch (action) {
                case 'view-fee':
                    viewFeeDetails(feeId);
                    break;
                case 'edit-fee':
                    editFee(feeId);
                    break;
                case 'delete-fee':
                    deleteFee(feeId);
                    break;
            }
        });
    });
}

// ==================== DASHBOARD ====================
function showDashboardContent(container) {
    if (!container) return;
    
    const totalStudents = students.length;
    const totalFees = fees.length;
    const totalAmount = fees.reduce((sum, fee) => sum + (fee.amount || 0), 0);
    const paidFees = fees.filter(f => f.status === 'Paid').length;
    
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="mb-0">Dashboard</h2>
        </div>
        
        <div class="row mb-4">
            <div class="col-md-3 mb-3">
                <div class="card stat-card">
                    <i class="fas fa-user-graduate"></i>
                    <div class="number">${totalStudents}</div>
                    <div class="label">Total Students</div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card stat-card">
                    <i class="fas fa-money-bill-wave"></i>
                    <div class="number">${totalFees}</div>
                    <div class="label">Total Fees</div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card stat-card">
                    <i class="fas fa-dollar-sign"></i>
                    <div class="number">$${totalAmount.toFixed(2)}</div>
                    <div class="label">Total Amount</div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card stat-card">
                    <i class="fas fa-check-circle"></i>
                    <div class="number">${paidFees}</div>
                    <div class="label">Paid Fees</div>
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Recent Fees</h5>
                    </div>
                    <div class="card-body">
                        ${fees.length > 0 ? `
                            <div class="table-responsive">
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Student</th>
                                            <th>Amount</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${fees.slice(-5).reverse().map(fee => {
                                            const student = students.find(s => s.id === fee.studentId);
                                            const studentName = fee.studentName || (student ? (student.name || student.firstName + ' ' + student.lastName) : 'N/A');
                                            return `
                                                <tr>
                                                    <td>${fee.id}</td>
                                                    <td>${studentName}</td>
                                                    <td>$${fee.amount?.toFixed(2) || '0.00'}</td>
                                                    <td>${fee.paymentDate ? new Date(fee.paymentDate).toLocaleDateString() : 'N/A'}</td>
                                                </tr>
                                            `;
                                        }).join('')}
                                    </tbody>
                                </table>
                            </div>
                        ` : '<p class="text-muted text-center py-3">No fees recorded yet</p>'}
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Quick Actions</h5>
                    </div>
                    <div class="card-body">
                        <div class="d-grid gap-2">
                            <button class="btn btn-primary" onclick="navigateToPage('fees')">
                                <i class="fas fa-plus me-2"></i>Record Fee Payment
                            </button>
                            <button class="btn btn-outline-primary" onclick="navigateToPage('students')">
                                <i class="fas fa-user-graduate me-2"></i>Manage Students
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ==================== STUDENTS ====================
function showStudentsContent(container) {
    if (!container) return;
    
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="mb-0"><i class="fas fa-user-graduate me-2"></i>Student Management</h2>
            <div>
                <button id="importStudentsBtn" class="btn btn-outline-secondary me-2">
                    <i class="fas fa-upload me-1"></i> Import
                </button>
                <button id="exportStudentsBtn" class="btn btn-outline-secondary me-2">
                    <i class="fas fa-download me-1"></i> Export
                </button>
                <button id="addStudentBtn" class="btn btn-primary">
                    <i class="fas fa-plus me-1"></i> Add Student
                </button>
            </div>
        </div>
        
        <div class="card shadow-sm">
            <div class="card-body">
                <div class="row mb-3">
                    <div class="col-md-4">
                        <div class="input-group">
                            <span class="input-group-text"><i class="fas fa-search"></i></span>
                            <input type="text" id="studentSearchInput" class="form-control" placeholder="Search students...">
                        </div>
                    </div>
                    <div class="col-md-3">
                        <select id="studentClassFilter" class="form-select">
                            <option value="">All Classes</option>
                            <option value="Grade 1">Grade 1</option>
                            <option value="Grade 2">Grade 2</option>
                            <option value="Grade 3">Grade 3</option>
                            <option value="Grade 4">Grade 4</option>
                            <option value="Grade 5">Grade 5</option>
                            <option value="Grade 6">Grade 6</option>
                            <option value="Grade 7">Grade 7</option>
                            <option value="Grade 8">Grade 8</option>
                            <option value="Grade 9">Grade 9</option>
                            <option value="Grade 10">Grade 10</option>
                            <option value="Grade 11">Grade 11</option>
                            <option value="Grade 12">Grade 12</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <select id="studentSectionFilter" class="form-select">
                            <option value="">All Sections</option>
                            <option value="A">Section A</option>
                            <option value="B">Section B</option>
                            <option value="C">Section C</option>
                            <option value="D">Section D</option>
                        </select>
                    </div>
                </div>
                
                <div class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead class="table-light">
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Class</th>
                                <th>Section</th>
                                <th>Year Admitted</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Parent</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="studentsTableBody">
                            ${students.length > 0 ? students.map(student => {
                                const parentName = student.parentName || (student.fatherName ? `${student.fatherName} / ${student.motherName || ''}` : 'N/A');
                                return `
                                <tr>
                                    <td><span class="badge bg-secondary">${student.id}</span></td>
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <div class="avatar-circle me-2">${(student.firstName?.[0] || 'S').toUpperCase()}</div>
                                            <div>
                                                <strong>${student.firstName || ''} ${student.lastName || ''}</strong>
                                                ${student.email ? `<br><small class="text-muted">${student.email}</small>` : ''}
                                            </div>
                                        </div>
                                    </td>
                                    <td><span class="badge bg-info">${student.class || 'N/A'}</span></td>
                                    <td><span class="badge bg-primary">${student.section || 'N/A'}</span></td>
                                    <td>${student.yearAdmitted || 'N/A'}</td>
                                    <td>${student.email || 'N/A'}</td>
                                    <td>${student.phone || 'N/A'}</td>
                                    <td><small>${parentName}</small></td>
                                    <td>
                                        <div class="btn-group" role="group">
                                            <button class="btn btn-sm btn-outline-info" onclick="viewStudentDetails(${student.id})" title="View">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            <button class="btn btn-sm btn-outline-primary" onclick="editStudent(${student.id})" title="Edit">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn btn-sm btn-outline-danger" onclick="deleteStudent(${student.id})" title="Delete">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                            }).join('') : '<tr><td colspan="9" class="text-center py-4"><div class="empty-state"><i class="fas fa-user-graduate"></i><h4>No students found</h4><p>Click "Add Student" to add a new student</p></div></td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <input type="file" id="importStudentsInput" accept=".xlsx,.xls,.csv" style="display: none;">
    `;
    
    document.getElementById('addStudentBtn')?.addEventListener('click', () => {
        showAddStudentForm();
    });
    
    document.getElementById('exportStudentsBtn')?.addEventListener('click', exportStudents);
    document.getElementById('importStudentsBtn')?.addEventListener('click', () => {
        document.getElementById('importStudentsInput')?.click();
    });
    
    const searchInput = document.getElementById('studentSearchInput');
    const classFilter = document.getElementById('studentClassFilter');
    const sectionFilter = document.getElementById('studentSectionFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterStudents);
    }
    if (classFilter) {
        classFilter.addEventListener('change', filterStudents);
    }
    if (sectionFilter) {
        sectionFilter.addEventListener('change', filterStudents);
    }
}

function showAddStudentForm() {
    const currentYear = new Date().getFullYear();
    const years = Array.from({length: 20}, (_, i) => currentYear - i);
    
    const modalHTML = `
        <div class="modal fade" id="studentModal" tabindex="-1">
            <div class="modal-dialog modal-lg modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title"><i class="fas fa-user-plus me-2"></i>Add New Student</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="studentForm">
                            <ul class="nav nav-tabs mb-3" id="studentFormTabs" role="tablist">
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link active" id="personal-tab" data-bs-toggle="tab" data-bs-target="#personal" type="button">
                                        <i class="fas fa-user me-1"></i>Personal Info
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="academic-tab" data-bs-toggle="tab" data-bs-target="#academic" type="button">
                                        <i class="fas fa-graduation-cap me-1"></i>Academic Info
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="parents-tab" data-bs-toggle="tab" data-bs-target="#parents" type="button">
                                        <i class="fas fa-users me-1"></i>Parents Info
                                    </button>
                                </li>
                            </ul>
                            
                            <div class="tab-content" id="studentFormTabContent">
                                <!-- Personal Information Tab -->
                                <div class="tab-pane fade show active" id="personal" role="tabpanel">
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label for="studentFirstName" class="form-label">First Name <span class="text-danger">*</span></label>
                                            <input type="text" class="form-control" id="studentFirstName" required>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="studentLastName" class="form-label">Last Name <span class="text-danger">*</span></label>
                                            <input type="text" class="form-control" id="studentLastName" required>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label for="studentEmail" class="form-label">Email Address</label>
                                            <input type="email" class="form-control" id="studentEmail" placeholder="student@example.com">
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="studentPhone" class="form-label">Phone Number</label>
                                            <input type="tel" class="form-control" id="studentPhone" placeholder="+1234567890">
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label for="studentDateOfBirth" class="form-label">Date of Birth</label>
                                            <input type="date" class="form-control" id="studentDateOfBirth">
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="studentGender" class="form-label">Gender</label>
                                            <select class="form-select" id="studentGender">
                                                <option value="">Select Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <label for="studentAddress" class="form-label">Address</label>
                                        <textarea class="form-control" id="studentAddress" rows="2" placeholder="Street address, City, State, ZIP"></textarea>
                                    </div>
                                </div>
                                
                                <!-- Academic Information Tab -->
                                <div class="tab-pane fade" id="academic" role="tabpanel">
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label for="studentClass" class="form-label">Class <span class="text-danger">*</span></label>
                                            <select class="form-select" id="studentClass" required>
                                                <option value="">Select Class</option>
                                                <option value="Grade 1">Grade 1</option>
                                                <option value="Grade 2">Grade 2</option>
                                                <option value="Grade 3">Grade 3</option>
                                                <option value="Grade 4">Grade 4</option>
                                                <option value="Grade 5">Grade 5</option>
                                                <option value="Grade 6">Grade 6</option>
                                                <option value="Grade 7">Grade 7</option>
                                                <option value="Grade 8">Grade 8</option>
                                                <option value="Grade 9">Grade 9</option>
                                                <option value="Grade 10">Grade 10</option>
                                                <option value="Grade 11">Grade 11</option>
                                                <option value="Grade 12">Grade 12</option>
                                            </select>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="studentSection" class="form-label">Section <span class="text-danger">*</span></label>
                                            <select class="form-select" id="studentSection" required>
                                                <option value="">Select Section</option>
                                                <option value="A">Section A</option>
                                                <option value="B">Section B</option>
                                                <option value="C">Section C</option>
                                                <option value="D">Section D</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label for="studentYearAdmitted" class="form-label">Year Admitted <span class="text-danger">*</span></label>
                                            <select class="form-select" id="studentYearAdmitted" required>
                                                <option value="">Select Year</option>
                                                ${years.map(year => `<option value="${year}">${year}</option>`).join('')}
                                            </select>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="studentRollNumber" class="form-label">Roll Number</label>
                                            <input type="text" class="form-control" id="studentRollNumber" placeholder="Auto-generated if empty">
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <label for="studentAdmissionNumber" class="form-label">Admission Number</label>
                                        <input type="text" class="form-control" id="studentAdmissionNumber" placeholder="Unique admission ID">
                                    </div>
                                </div>
                                
                                <!-- Parents Information Tab -->
                                <div class="tab-pane fade" id="parents" role="tabpanel">
                                    <h6 class="mb-3"><i class="fas fa-male me-2"></i>Father's Information</h6>
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label for="fatherName" class="form-label">Father's Name <span class="text-danger">*</span></label>
                                            <input type="text" class="form-control" id="fatherName" required>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="fatherPhone" class="form-label">Father's Phone</label>
                                            <input type="tel" class="form-control" id="fatherPhone">
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label for="fatherEmail" class="form-label">Father's Email</label>
                                            <input type="email" class="form-control" id="fatherEmail">
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="fatherOccupation" class="form-label">Father's Occupation</label>
                                            <input type="text" class="form-control" id="fatherOccupation">
                                        </div>
                                    </div>
                                    
                                    <hr class="my-4">
                                    
                                    <h6 class="mb-3"><i class="fas fa-female me-2"></i>Mother's Information</h6>
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label for="motherName" class="form-label">Mother's Name <span class="text-danger">*</span></label>
                                            <input type="text" class="form-control" id="motherName" required>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="motherPhone" class="form-label">Mother's Phone</label>
                                            <input type="tel" class="form-control" id="motherPhone">
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label for="motherEmail" class="form-label">Mother's Email</label>
                                            <input type="email" class="form-control" id="motherEmail">
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="motherOccupation" class="form-label">Mother's Occupation</label>
                                            <input type="text" class="form-control" id="motherOccupation">
                                        </div>
                                    </div>
                                    
                                    <hr class="my-4">
                                    
                                    <h6 class="mb-3"><i class="fas fa-home me-2"></i>Guardian Information (If Different)</h6>
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label for="guardianName" class="form-label">Guardian's Name</label>
                                            <input type="text" class="form-control" id="guardianName">
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="guardianPhone" class="form-label">Guardian's Phone</label>
                                            <input type="tel" class="form-control" id="guardianPhone">
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <label for="guardianRelation" class="form-label">Relationship to Student</label>
                                        <input type="text" class="form-control" id="guardianRelation" placeholder="e.g., Uncle, Aunt, Grandparent">
                                    </div>
                                    <div class="mb-3">
                                        <label for="parentAddress" class="form-label">Parent/Guardian Address</label>
                                        <textarea class="form-control" id="parentAddress" rows="2"></textarea>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-save me-1"></i>Save Student
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('studentModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = new bootstrap.Modal(document.getElementById('studentModal'));
    modal.show();
    
    document.getElementById('studentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const newStudent = {
            id: students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1,
            firstName: document.getElementById('studentFirstName').value,
            lastName: document.getElementById('studentLastName').value,
            email: document.getElementById('studentEmail').value,
            phone: document.getElementById('studentPhone').value,
            dateOfBirth: document.getElementById('studentDateOfBirth').value,
            gender: document.getElementById('studentGender').value,
            address: document.getElementById('studentAddress').value,
            class: document.getElementById('studentClass').value,
            section: document.getElementById('studentSection').value,
            yearAdmitted: document.getElementById('studentYearAdmitted').value,
            rollNumber: document.getElementById('studentRollNumber').value || `R${String(students.length + 1).padStart(4, '0')}`,
            admissionNumber: document.getElementById('studentAdmissionNumber').value || `ADM${String(students.length + 1).padStart(6, '0')}`,
            fatherName: document.getElementById('fatherName').value,
            fatherPhone: document.getElementById('fatherPhone').value,
            fatherEmail: document.getElementById('fatherEmail').value,
            fatherOccupation: document.getElementById('fatherOccupation').value,
            motherName: document.getElementById('motherName').value,
            motherPhone: document.getElementById('motherPhone').value,
            motherEmail: document.getElementById('motherEmail').value,
            motherOccupation: document.getElementById('motherOccupation').value,
            guardianName: document.getElementById('guardianName').value,
            guardianPhone: document.getElementById('guardianPhone').value,
            guardianRelation: document.getElementById('guardianRelation').value,
            parentAddress: document.getElementById('parentAddress').value,
            parentName: `${document.getElementById('fatherName').value} / ${document.getElementById('motherName').value}`,
            createdAt: new Date().toISOString()
        };
        
        students.push(newStudent);
        await saveData();
        modal.hide();
        showAlert('Student added successfully!', 'success');
        showStudentsContent(document.getElementById('app-content'));
    });
}

function editStudent(id) {
    const student = students.find(s => s.id === id);
    if (!student) return;
    
    showAddStudentForm();
    setTimeout(() => {
        document.querySelector('#studentModal .modal-title').innerHTML = '<i class="fas fa-user-edit me-2"></i>Edit Student';
        
        // Personal Info
        document.getElementById('studentFirstName').value = student.firstName || '';
        document.getElementById('studentLastName').value = student.lastName || '';
        document.getElementById('studentEmail').value = student.email || '';
        document.getElementById('studentPhone').value = student.phone || '';
        document.getElementById('studentDateOfBirth').value = student.dateOfBirth || '';
        document.getElementById('studentGender').value = student.gender || '';
        document.getElementById('studentAddress').value = student.address || '';
        
        // Academic Info
        document.getElementById('studentClass').value = student.class || '';
        document.getElementById('studentSection').value = student.section || '';
        document.getElementById('studentYearAdmitted').value = student.yearAdmitted || '';
        document.getElementById('studentRollNumber').value = student.rollNumber || '';
        document.getElementById('studentAdmissionNumber').value = student.admissionNumber || '';
        
        // Parents Info
        document.getElementById('fatherName').value = student.fatherName || '';
        document.getElementById('fatherPhone').value = student.fatherPhone || '';
        document.getElementById('fatherEmail').value = student.fatherEmail || '';
        document.getElementById('fatherOccupation').value = student.fatherOccupation || '';
        document.getElementById('motherName').value = student.motherName || '';
        document.getElementById('motherPhone').value = student.motherPhone || '';
        document.getElementById('motherEmail').value = student.motherEmail || '';
        document.getElementById('motherOccupation').value = student.motherOccupation || '';
        document.getElementById('guardianName').value = student.guardianName || '';
        document.getElementById('guardianPhone').value = student.guardianPhone || '';
        document.getElementById('guardianRelation').value = student.guardianRelation || '';
        document.getElementById('parentAddress').value = student.parentAddress || '';
        
        const form = document.getElementById('studentForm');
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const index = students.findIndex(s => s.id === id);
            students[index] = {
                ...students[index],
                firstName: document.getElementById('studentFirstName').value,
                lastName: document.getElementById('studentLastName').value,
                email: document.getElementById('studentEmail').value,
                phone: document.getElementById('studentPhone').value,
                dateOfBirth: document.getElementById('studentDateOfBirth').value,
                gender: document.getElementById('studentGender').value,
                address: document.getElementById('studentAddress').value,
                class: document.getElementById('studentClass').value,
                section: document.getElementById('studentSection').value,
                yearAdmitted: document.getElementById('studentYearAdmitted').value,
                rollNumber: document.getElementById('studentRollNumber').value,
                admissionNumber: document.getElementById('studentAdmissionNumber').value,
                fatherName: document.getElementById('fatherName').value,
                fatherPhone: document.getElementById('fatherPhone').value,
                fatherEmail: document.getElementById('fatherEmail').value,
                fatherOccupation: document.getElementById('fatherOccupation').value,
                motherName: document.getElementById('motherName').value,
                motherPhone: document.getElementById('motherPhone').value,
                motherEmail: document.getElementById('motherEmail').value,
                motherOccupation: document.getElementById('motherOccupation').value,
                guardianName: document.getElementById('guardianName').value,
                guardianPhone: document.getElementById('guardianPhone').value,
                guardianRelation: document.getElementById('guardianRelation').value,
                parentAddress: document.getElementById('parentAddress').value,
                parentName: `${document.getElementById('fatherName').value} / ${document.getElementById('motherName').value}`,
                updatedAt: new Date().toISOString()
            };
            await saveData();
            bootstrap.Modal.getInstance(document.getElementById('studentModal')).hide();
            showAlert('Student updated successfully!', 'success');
            showStudentsContent(document.getElementById('app-content'));
        });
    }, 300);
}

function viewStudentDetails(id) {
    const student = students.find(s => s.id === id);
    if (!student) return;
    
    const modalHTML = `
        <div class="modal fade" id="viewStudentModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-info text-white">
                        <h5 class="modal-title"><i class="fas fa-user-circle me-2"></i>Student Details</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-4">
                            <div class="col-md-12 text-center">
                                <div class="avatar-large mb-3">${(student.firstName?.[0] || 'S').toUpperCase()}</div>
                                <h4>${student.firstName || ''} ${student.lastName || ''}</h4>
                                <p class="text-muted">${student.email || 'No email'}</p>
                            </div>
                        </div>
                        
                        <ul class="nav nav-tabs mb-3">
                            <li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#viewPersonal">Personal</a></li>
                            <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#viewAcademic">Academic</a></li>
                            <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#viewParents">Parents</a></li>
                        </ul>
                        
                        <div class="tab-content">
                            <div class="tab-pane fade show active" id="viewPersonal">
                                <dl class="row">
                                    <dt class="col-sm-4">Date of Birth:</dt><dd class="col-sm-8">${student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'}</dd>
                                    <dt class="col-sm-4">Gender:</dt><dd class="col-sm-8">${student.gender || 'N/A'}</dd>
                                    <dt class="col-sm-4">Phone:</dt><dd class="col-sm-8">${student.phone || 'N/A'}</dd>
                                    <dt class="col-sm-4">Address:</dt><dd class="col-sm-8">${student.address || 'N/A'}</dd>
                                </dl>
                            </div>
                            <div class="tab-pane fade" id="viewAcademic">
                                <dl class="row">
                                    <dt class="col-sm-4">Class:</dt><dd class="col-sm-8"><span class="badge bg-info">${student.class || 'N/A'}</span></dd>
                                    <dt class="col-sm-4">Section:</dt><dd class="col-sm-8"><span class="badge bg-primary">${student.section || 'N/A'}</span></dd>
                                    <dt class="col-sm-4">Year Admitted:</dt><dd class="col-sm-8">${student.yearAdmitted || 'N/A'}</dd>
                                    <dt class="col-sm-4">Roll Number:</dt><dd class="col-sm-8">${student.rollNumber || 'N/A'}</dd>
                                    <dt class="col-sm-4">Admission Number:</dt><dd class="col-sm-8">${student.admissionNumber || 'N/A'}</dd>
                                </dl>
                            </div>
                            <div class="tab-pane fade" id="viewParents">
                                <h6>Father's Information</h6>
                                <dl class="row mb-3">
                                    <dt class="col-sm-4">Name:</dt><dd class="col-sm-8">${student.fatherName || 'N/A'}</dd>
                                    <dt class="col-sm-4">Phone:</dt><dd class="col-sm-8">${student.fatherPhone || 'N/A'}</dd>
                                    <dt class="col-sm-4">Email:</dt><dd class="col-sm-8">${student.fatherEmail || 'N/A'}</dd>
                                    <dt class="col-sm-4">Occupation:</dt><dd class="col-sm-8">${student.fatherOccupation || 'N/A'}</dd>
                                </dl>
                                <h6>Mother's Information</h6>
                                <dl class="row mb-3">
                                    <dt class="col-sm-4">Name:</dt><dd class="col-sm-8">${student.motherName || 'N/A'}</dd>
                                    <dt class="col-sm-4">Phone:</dt><dd class="col-sm-8">${student.motherPhone || 'N/A'}</dd>
                                    <dt class="col-sm-4">Email:</dt><dd class="col-sm-8">${student.motherEmail || 'N/A'}</dd>
                                    <dt class="col-sm-4">Occupation:</dt><dd class="col-sm-8">${student.motherOccupation || 'N/A'}</dd>
                                </dl>
                                ${student.guardianName ? `
                                <h6>Guardian's Information</h6>
                                <dl class="row">
                                    <dt class="col-sm-4">Name:</dt><dd class="col-sm-8">${student.guardianName}</dd>
                                    <dt class="col-sm-4">Phone:</dt><dd class="col-sm-8">${student.guardianPhone || 'N/A'}</dd>
                                    <dt class="col-sm-4">Relationship:</dt><dd class="col-sm-8">${student.guardianRelation || 'N/A'}</dd>
                                </dl>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" onclick="editStudent(${id}); bootstrap.Modal.getInstance(document.getElementById('viewStudentModal')).hide();">
                            <i class="fas fa-edit me-1"></i>Edit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('viewStudentModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = new bootstrap.Modal(document.getElementById('viewStudentModal'));
    modal.show();
}

function filterStudents() {
    const searchTerm = document.getElementById('studentSearchInput')?.value.toLowerCase() || '';
    const classFilter = document.getElementById('studentClassFilter')?.value || '';
    const sectionFilter = document.getElementById('studentSectionFilter')?.value || '';
    
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;
    
    let filtered = students.filter(student => {
        const matchesSearch = !searchTerm || 
            (student.firstName && student.firstName.toLowerCase().includes(searchTerm)) ||
            (student.lastName && student.lastName.toLowerCase().includes(searchTerm)) ||
            (student.email && student.email.toLowerCase().includes(searchTerm)) ||
            (student.rollNumber && student.rollNumber.toLowerCase().includes(searchTerm)) ||
            (student.admissionNumber && student.admissionNumber.toLowerCase().includes(searchTerm));
        
        const matchesClass = !classFilter || student.class === classFilter;
        const matchesSection = !sectionFilter || student.section === sectionFilter;
        
        return matchesSearch && matchesClass && matchesSection;
    });
    
    tbody.innerHTML = filtered.length > 0 ? filtered.map(student => {
        const parentName = student.parentName || (student.fatherName ? `${student.fatherName} / ${student.motherName || ''}` : 'N/A');
        return `
            <tr>
                <td><span class="badge bg-secondary">${student.id}</span></td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="avatar-circle me-2">${(student.firstName?.[0] || 'S').toUpperCase()}</div>
                        <div>
                            <strong>${student.firstName || ''} ${student.lastName || ''}</strong>
                            ${student.email ? `<br><small class="text-muted">${student.email}</small>` : ''}
                        </div>
                    </div>
                </td>
                <td><span class="badge bg-info">${student.class || 'N/A'}</span></td>
                <td><span class="badge bg-primary">${student.section || 'N/A'}</span></td>
                <td>${student.yearAdmitted || 'N/A'}</td>
                <td>${student.email || 'N/A'}</td>
                <td>${student.phone || 'N/A'}</td>
                <td><small>${parentName}</small></td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-info" onclick="viewStudentDetails(${student.id})" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-primary" onclick="editStudent(${student.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteStudent(${student.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('') : '<tr><td colspan="9" class="text-center py-4"><div class="empty-state"><i class="fas fa-user-graduate"></i><h4>No students found</h4></div></td></tr>';
}

function exportStudents() {
    if (students.length === 0) {
        showAlert('No students to export', 'warning');
        return;
    }
    
    const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Class', 'Section', 'Year Admitted', 'Roll Number', 'Admission Number', 'Father Name', 'Mother Name'];
    const rows = students.map(student => [
        student.id,
        student.firstName || '',
        student.lastName || '',
        student.email || '',
        student.phone || '',
        student.class || '',
        student.section || '',
        student.yearAdmitted || '',
        student.rollNumber || '',
        student.admissionNumber || '',
        student.fatherName || '',
        student.motherName || ''
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showAlert('Students exported successfully!', 'success');
}

window.viewStudentDetails = viewStudentDetails;

async function deleteStudent(id) {
    if (!confirm('Are you sure you want to delete this student?')) return;
    
    const index = students.findIndex(s => s.id === id);
    if (index === -1) return;
    
    students.splice(index, 1);
    await saveData();
    showAlert('Student deleted successfully!', 'success');
    showStudentsContent(document.getElementById('app-content'));
}

// ==================== USERS ====================
function showUsersContent(container) {
    if (!container) return;
    
    if (!hasPermission('MANAGE_USERS')) {
        container.innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>You do not have permission to manage users.
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="mb-0"><i class="fas fa-users me-2"></i>User Management</h2>
            <button id="addUserBtn" class="btn btn-primary">
                <i class="fas fa-plus me-1"></i> Add User
            </button>
        </div>
        
        <div class="card shadow-sm">
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead class="table-light">
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Username</th>
                                <th>Role</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="usersTableBody">
                            ${users.length > 0 ? users.map(user => `
                                <tr>
                                    <td><span class="badge bg-secondary">${user.id}</span></td>
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <div class="avatar-circle me-2">${(user.firstName?.[0] || 'U').toUpperCase()}</div>
                                            <div>
                                                <strong>${user.firstName || ''} ${user.lastName || ''}</strong>
                                            </div>
                                        </div>
                                    </td>
                                    <td>${user.email || 'N/A'}</td>
                                    <td>${user.username || 'N/A'}</td>
                                    <td><span class="badge bg-${user.role === 'admin' ? 'danger' : user.role === 'teacher' ? 'primary' : 'info'}">${user.role?.toUpperCase() || 'N/A'}</span></td>
                                    <td>${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                                    <td>
                                        <div class="btn-group" role="group">
                                            <button class="btn btn-sm btn-outline-primary" onclick="editUser(${user.id})" title="Edit">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            ${user.role !== 'admin' || users.filter(u => u.role === 'admin').length > 1 ? `
                                            <button class="btn btn-sm btn-outline-danger" onclick="deleteUser(${user.id})" title="Delete">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                            ` : ''}
                                        </div>
                                    </td>
                                </tr>
                            `).join('') : '<tr><td colspan="7" class="text-center py-4"><div class="empty-state"><i class="fas fa-users"></i><h4>No users found</h4><p>Click "Add User" to add a new user</p></div></td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('addUserBtn')?.addEventListener('click', showAddUserForm);
}

function showAddUserForm() {
    const modalHTML = `
        <div class="modal fade" id="userModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title"><i class="fas fa-user-plus me-2"></i>Add New User</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="userForm">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="userFirstName" class="form-label">First Name <span class="text-danger">*</span></label>
                                    <input type="text" class="form-control" id="userFirstName" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="userLastName" class="form-label">Last Name <span class="text-danger">*</span></label>
                                    <input type="text" class="form-control" id="userLastName" required>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="userEmail" class="form-label">Email <span class="text-danger">*</span></label>
                                <input type="email" class="form-control" id="userEmail" required>
                            </div>
                            <div class="mb-3">
                                <label for="userUsername" class="form-label">Username <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="userUsername" required>
                            </div>
                            <div class="mb-3">
                                <label for="userPassword" class="form-label">Password <span class="text-danger">*</span></label>
                                <input type="password" class="form-control" id="userPassword" required minlength="6">
                            </div>
                            <div class="mb-3">
                                <label for="userRole" class="form-label">Role <span class="text-danger">*</span></label>
                                <select class="form-select" id="userRole" required>
                                    <option value="">Select Role</option>
                                    <option value="admin">Admin</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="student">Student</option>
                                    <option value="parent">Parent</option>
                                </select>
                            </div>
                            <div class="d-grid">
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-save me-1"></i>Save User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('userModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = new bootstrap.Modal(document.getElementById('userModal'));
    modal.show();
    
    document.getElementById('userForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const newUser = {
            id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
            firstName: document.getElementById('userFirstName').value,
            lastName: document.getElementById('userLastName').value,
            email: document.getElementById('userEmail').value,
            username: document.getElementById('userUsername').value,
            password: hashPassword(document.getElementById('userPassword').value),
            role: document.getElementById('userRole').value,
            createdAt: new Date().toISOString()
        };
        
        // Check if email or username already exists
        if (users.find(u => u.email === newUser.email || u.username === newUser.username)) {
            showAlert('Email or username already exists', 'danger');
            return;
        }
        
        users.push(newUser);
        await saveData();
        modal.hide();
        showAlert('User added successfully!', 'success');
        showUsersContent(document.getElementById('app-content'));
    });
}

function editUser(id) {
    const user = users.find(u => u.id === id);
    if (!user) return;
    
    showAddUserForm();
    setTimeout(() => {
        document.querySelector('#userModal .modal-title').innerHTML = '<i class="fas fa-user-edit me-2"></i>Edit User';
        document.getElementById('userFirstName').value = user.firstName || '';
        document.getElementById('userLastName').value = user.lastName || '';
        document.getElementById('userEmail').value = user.email || '';
        document.getElementById('userUsername').value = user.username || '';
        document.getElementById('userRole').value = user.role || '';
        document.getElementById('userPassword').required = false;
        document.getElementById('userPassword').placeholder = 'Leave blank to keep current password';
        
        const form = document.getElementById('userForm');
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const index = users.findIndex(u => u.id === id);
            users[index] = {
                ...users[index],
                firstName: document.getElementById('userFirstName').value,
                lastName: document.getElementById('userLastName').value,
                email: document.getElementById('userEmail').value,
                username: document.getElementById('userUsername').value,
                role: document.getElementById('userRole').value,
                password: document.getElementById('userPassword').value ? hashPassword(document.getElementById('userPassword').value) : users[index].password,
                updatedAt: new Date().toISOString()
            };
            await saveData();
            bootstrap.Modal.getInstance(document.getElementById('userModal')).hide();
            showAlert('User updated successfully!', 'success');
            showUsersContent(document.getElementById('app-content'));
        });
    }, 300);
}

async function deleteUser(id) {
    const user = users.find(u => u.id === id);
    if (!user) return;
    
    if (user.role === 'admin' && users.filter(u => u.role === 'admin').length === 1) {
        showAlert('Cannot delete the last admin user', 'danger');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete user ${user.firstName} ${user.lastName}?`)) return;
    
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return;
    
    users.splice(index, 1);
    await saveData();
    showAlert('User deleted successfully!', 'success');
    showUsersContent(document.getElementById('app-content'));
}

window.editUser = editUser;
window.deleteUser = deleteUser;

// ==================== NAVIGATION ====================
function navigateToPage(page) {
    const container = document.getElementById('app-content');
    if (!container) return;
    
    // Update active nav link
    document.querySelectorAll('[data-page]').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === page) {
            link.classList.add('active');
        }
    });
    
    // Show appropriate content
    switch (page) {
        case 'dashboard':
            showDashboardContent(container);
            break;
        case 'students':
            showStudentsContent(container);
            break;
        case 'fees':
            showFeesContent(container);
            break;
        case 'users':
            showUsersContent(container);
            break;
        default:
            showDashboardContent(container);
    }
}

// Make navigateToPage available globally for onclick handlers
window.navigateToPage = navigateToPage;
window.editStudent = editStudent;
window.deleteStudent = deleteStudent;

// ==================== LOGIN ====================
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Make sure users are loaded
    if (users.length === 0) {
        loadData();
        initializeDefaultUsers();
    }
    
    // Find user
    const user = users.find(u => u.email === email);
    
    if (user && user.password === hashPassword(password)) {
        // Remove password from user object before storing
        const { password: _, ...userWithoutPassword } = user;
        setCurrentUser(userWithoutPassword);
        
        const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        if (loginModal) loginModal.hide();
        document.getElementById('loginModal').style.display = 'none';
        document.getElementById('loginModal').classList.remove('show');
        
        showAlert(`Welcome back, ${user.firstName}!`, 'success');
        showDashboardContent(document.getElementById('app-content'));
    } else {
        showAlert('Invalid email or password. Please check your credentials.', 'danger');
        console.log('Login attempt failed. Users in system:', users.length);
        console.log('Looking for email:', email);
    }
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    // Load data first
    loadData();
    
    // Then initialize default users (this will check if users exist and create admin if needed)
    initializeDefaultUsers();
    
    // Reload data after initialization to ensure users array is populated
    loadData();
    
    // Check session
    const isLoggedIn = checkSession() && localStorage.getItem('isLoggedIn') === 'true';
    
    // Update user display in navbar
    const currentUser = getCurrentUser();
    if (currentUser) {
        const userDropdown = document.querySelector('#userDropdown');
        if (userDropdown) {
            userDropdown.innerHTML = `<i class="fas fa-user-circle me-1"></i> ${currentUser.firstName} (${currentUser.role.toUpperCase()})`;
        }
    }
    
    // Setup login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Setup login modal
    const loginModal = document.getElementById('loginModal');
    if (loginModal && !isLoggedIn) {
        const modal = new bootstrap.Modal(loginModal, { backdrop: 'static', keyboard: false });
        modal.show();
    } else if (loginModal && isLoggedIn) {
        loginModal.style.display = 'none';
        loginModal.classList.remove('show');
    }
    
    // Setup navigation with permission checks
    document.querySelectorAll('[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            
            // Check permissions
            if (page === 'students' && !hasPermission('MANAGE_STUDENTS')) {
                showAlert('You do not have permission to access this page', 'warning');
                return;
            }
            if (page === 'fees' && !hasPermission('MANAGE_FEES')) {
                showAlert('You do not have permission to access this page', 'warning');
                return;
            }
            if (page === 'users' && !hasPermission('MANAGE_USERS')) {
                showAlert('You do not have permission to access this page', 'warning');
                return;
            }
            
            navigateToPage(page);
        });
    });
    
    // Hide navigation items based on permissions
    if (!hasPermission('MANAGE_STUDENTS')) {
        document.querySelectorAll('[data-page="students"]').forEach(el => el.style.display = 'none');
    }
    if (!hasPermission('MANAGE_FEES')) {
        document.querySelectorAll('[data-page="fees"]').forEach(el => el.style.display = 'none');
    }
    if (!hasPermission('MANAGE_USERS')) {
        document.querySelectorAll('[data-page="users"]').forEach(el => el.style.display = 'none');
    }
    
    // Setup logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            logout();
        });
    }
    
    // Check session periodically
    setInterval(() => {
        if (!checkSession()) {
            showAlert('Your session has expired. Please login again.', 'warning');
        }
    }, 60000); // Check every minute
    
    // Show dashboard if logged in
    if (isLoggedIn) {
        navigateToPage('dashboard');
    }
});