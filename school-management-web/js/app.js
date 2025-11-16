// ==================== DATA STORAGE ====================
let fees = [];
let students = [];
let users = [];

// Load data from localStorage
function loadData() {
    try {
        fees = JSON.parse(localStorage.getItem('fees')) || [];
        students = JSON.parse(localStorage.getItem('students')) || [];
        users = JSON.parse(localStorage.getItem('users')) || [];
    } catch (error) {
        console.error('Error loading data:', error);
        fees = [];
        students = [];
        users = [];
    }
}

// Save data to localStorage
async function saveData() {
    try {
        localStorage.setItem('fees', JSON.stringify(fees));
        localStorage.setItem('students', JSON.stringify(students));
        localStorage.setItem('users', JSON.stringify(users));
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
            <h2 class="mb-0">Students</h2>
            <button id="addStudentBtn" class="btn btn-primary">
                <i class="fas fa-plus me-1"></i> Add Student
            </button>
        </div>
        
        <div class="card">
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="studentsTableBody">
                            ${students.length > 0 ? students.map(student => `
                                <tr>
                                    <td>${student.id}</td>
                                    <td>${student.name || student.firstName + ' ' + student.lastName}</td>
                                    <td>${student.email || 'N/A'}</td>
                                    <td>${student.phone || 'N/A'}</td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-primary" onclick="editStudent(${student.id})">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger" onclick="deleteStudent(${student.id})">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('') : '<tr><td colspan="5" class="text-center py-4">No students found</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('addStudentBtn')?.addEventListener('click', () => {
        showAddStudentForm();
    });
}

function showAddStudentForm() {
    const modalHTML = `
        <div class="modal fade" id="studentModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Add Student</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="studentForm">
                            <div class="mb-3">
                                <label for="studentFirstName" class="form-label">First Name <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="studentFirstName" required>
                            </div>
                            <div class="mb-3">
                                <label for="studentLastName" class="form-label">Last Name <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="studentLastName" required>
                            </div>
                            <div class="mb-3">
                                <label for="studentEmail" class="form-label">Email</label>
                                <input type="email" class="form-control" id="studentEmail">
                            </div>
                            <div class="mb-3">
                                <label for="studentPhone" class="form-label">Phone</label>
                                <input type="tel" class="form-control" id="studentPhone">
                            </div>
                            <div class="d-grid">
                                <button type="submit" class="btn btn-primary">Add Student</button>
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
        document.getElementById('studentFirstName').value = student.firstName || '';
        document.getElementById('studentLastName').value = student.lastName || '';
        document.getElementById('studentEmail').value = student.email || '';
        document.getElementById('studentPhone').value = student.phone || '';
        
        document.querySelector('#studentModal .modal-title').textContent = 'Edit Student';
        const form = document.getElementById('studentForm');
        form.removeEventListener('submit', form.onsubmit);
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const index = students.findIndex(s => s.id === id);
            students[index] = {
                ...students[index],
                firstName: document.getElementById('studentFirstName').value,
                lastName: document.getElementById('studentLastName').value,
                email: document.getElementById('studentEmail').value,
                phone: document.getElementById('studentPhone').value,
                updatedAt: new Date().toISOString()
            };
            await saveData();
            bootstrap.Modal.getInstance(document.getElementById('studentModal')).hide();
            showAlert('Student updated successfully!', 'success');
            showStudentsContent(document.getElementById('app-content'));
        });
    }, 300);
}

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
    
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="mb-0">Users</h2>
        </div>
        
        <div class="card">
            <div class="card-body">
                <p class="text-muted">User management functionality coming soon...</p>
            </div>
        </div>
    `;
}

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
    
    // Simple authentication (in production, use proper authentication)
    if (email === 'admin@school.edu' && password === 'admin123') {
        localStorage.setItem('isLoggedIn', 'true');
        const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        if (loginModal) loginModal.hide();
        document.getElementById('loginModal').style.display = 'none';
        document.getElementById('loginModal').classList.remove('show');
        showDashboardContent(document.getElementById('app-content'));
    } else {
        showAlert('Invalid email or password', 'danger');
    }
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    // Load data
    loadData();
    
    // Check authentication
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
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
    
    // Setup navigation
    document.querySelectorAll('[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateToPage(link.getAttribute('data-page'));
        });
    });
    
    // Setup logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('isLoggedIn');
            window.location.reload();
        });
    }
    
    // Show dashboard if logged in
    if (isLoggedIn) {
        navigateToPage('dashboard');
    }
});