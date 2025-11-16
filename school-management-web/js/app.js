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
}

// 2. Fix fee submission
async function handleAddFee(e) {
    e.preventDefault();
    
    try {
        // Show loading state
        const submitBtn = document.querySelector('#feeForm button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
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
        
        // Add fee to the array
        const newFee = {
            id: fees.length > 0 ? Math.max(...fees.map(f => f.id)) + 1 : 1,
            ...formData,
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
    
    const container = document.querySelector('.container') || document.body;
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

// 6. Add renderFeesTable function
function renderFeesTable(filter = '') {
    const tbody = document.getElementById('feesTableBody');
    if (!tbody) return;
    
    const filteredFees = filter 
        ? fees.filter(fee => 
            (fee.studentName && fee.studentName.toLowerCase().includes(filter.toLowerCase())) ||
            (fee.reference && fee.reference.toLowerCase().includes(filter.toLowerCase()))
        )
        : fees;
    
    tbody.innerHTML = filteredFees.length > 0 
        ? filteredFees.map(fee => `
            <tr>
                <td>${fee.id}</td>
                <td>${fee.studentName || 'N/A'}</td>
                <td>$${fee.amount?.toFixed(2)}</td>
                <td>${new Date(fee.paymentDate).toLocaleDateString()}</td>
                <td><span class="badge bg-${fee.status === 'Paid' ? 'success' : fee.status === 'Pending' ? 'warning' : 'danger'}">${fee.status}</span></td>
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
        `).join('')
        : '<tr><td colspan="6" class="text-center py-4">No fees found</td></tr>';
    
    // Add event listeners to action buttons
    document.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const action = e.target.closest('[data-action]').getAttribute('data-action');
            const feeId = parseInt(e.target.closest('[data-id]').getAttribute('data-id'));
            
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