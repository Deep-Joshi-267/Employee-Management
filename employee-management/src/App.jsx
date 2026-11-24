import React, { useState, useEffect } from 'react';
import { 
  Users, 
  PlusCircle, 
  ChevronLeft, 
  ChevronRight, 
  Mail, 
  Phone, 
  Briefcase, 
  Layers, 
  IndianRupee, 
  Calendar, 
  Edit3, 
  Trash2, 
  X, 
  CheckCircle2, 
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import './App.css';

const API_BASE_URL = 'http://localhost:5000/api';

function App() {
  // Sidenav controlled state
  const [isExpanded, setIsExpanded] = useState(true);
  // Active Tab: 'add' or 'view'
  const [activeTab, setActiveTab] = useState('add');

  // Employee Data States
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  // Pagination State for View Tab (9 cards per page)
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

  const totalPages = Math.ceil(employees.length / ITEMS_PER_PAGE) || 1;
  const indexOfLastEmployee = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstEmployee = indexOfLastEmployee - ITEMS_PER_PAGE;
  const currentEmployees = employees.slice(indexOfFirstEmployee, indexOfLastEmployee);

  // Automatically adjust currentPage if totalPages decreases (e.g. after deletion)
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [employees.length, totalPages, currentPage]);

  // Form State for Add Employee
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('ems_add_form_data');
    return saved ? JSON.parse(saved) : {
      emp_id: '',
      name: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      salary: '',
      date_of_joining: ''
    };
  });

  useEffect(() => {
    localStorage.setItem('ems_add_form_data', JSON.stringify(formData));
  }, [formData]);

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    salary: '',
    date_of_joining: ''
  });
  const [editFormErrors, setEditFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Toast State
  const [toasts, setToasts] = useState([]);

  // Fetch all employees
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/employees`);
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      } else {
        showToast('error', 'Failed to fetch employees list');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      showToast('error', 'Network error: Cannot connect to server');
    } finally {
      setLoading(false);
    }
  };

  // Fetch employees when "view" tab is selected
  useEffect(() => {
    if (activeTab === 'view') {
      fetchEmployees();
    }
  }, [activeTab]);

  // Show dynamic notification toasts
  const showToast = (type, message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Email format validator
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Phone validator (10 digits)
  const isValidPhone = (phone) => {
    return /^\d{10}$/.test(phone);
  };

  // Form Change Handler
  const handleInputChange = (e, isEdit = false) => {
    const { name, value } = e.target;
    if (isEdit) {
      setEditFormData(prev => ({ ...prev, [name]: value }));
      if (editFormErrors[name]) {
        setEditFormErrors(prev => ({ ...prev, [name]: '' }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      if (formErrors[name]) {
        setFormErrors(prev => ({ ...prev, [name]: '' }));
      }
    }
  };

  // Add Employee Submit handler
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validations
    const errors = {};
    Object.keys(formData).forEach(key => {
      if (!formData[key] || formData[key].toString().trim() === '') {
        errors[key] = 'This field is required';
      }
    });

    if (formData.email && !isValidEmail(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (formData.phone && !isValidPhone(formData.phone)) {
      errors.phone = 'Phone number must be exactly 10 digits';
    }

    if (formData.salary && (isNaN(formData.salary) || parseFloat(formData.salary) <= 0)) {
      errors.salary = 'Salary must be a positive number';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast('error', 'Please correct the validation errors in the form.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();

      if (response.ok) {
        showToast('success', 'Employee registered successfully!');
        // Clear form
        setFormData({
          emp_id: '',
          name: '',
          email: '',
          phone: '',
          position: '',
          department: '',
          salary: '',
          date_of_joining: ''
        });
        setFormErrors({});
      } else {
        showToast('error', data.error || 'Failed to add employee');
      }
    } catch (error) {
      console.error('Submission error:', error);
      showToast('error', 'Server error. Please ensure the backend is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete handler
  const handleDelete = async (emp_id, name) => {
    const confirmed = window.confirm(`Are you sure you want to delete employee ${name} (${emp_id})?`);
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_BASE_URL}/employees/${emp_id}`, {
        method: 'DELETE'
      });
      const data = await response.json();

      if (response.ok) {
        showToast('success', 'Employee deleted successfully');
        // Remove from UI list
        setEmployees(prev => prev.filter(emp => emp.emp_id !== emp_id));
      } else {
        showToast('error', data.error || 'Failed to delete employee');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showToast('error', 'Server error. Could not delete employee.');
    }
  };

  // Open Edit Modal
  const openEditModal = (employee) => {
    setEditingEmployee(employee);
    // Format date properly to YYYY-MM-DD for date input
    let formattedDate = '';
    if (employee.date_of_joining) {
      formattedDate = new Date(employee.date_of_joining).toISOString().split('T')[0];
    }

    setEditFormData({
      name: employee.name || '',
      email: employee.email || '',
      phone: employee.phone || '',
      position: employee.position || '',
      department: employee.department || '',
      salary: employee.salary || '',
      date_of_joining: formattedDate
    });
    setEditFormErrors({});
    setShowEditModal(true);
  };

  // Save changes from Edit Modal (PUT /api/employees/:emp_id)
  const handleEditSubmit = async (e) => {
    e.preventDefault();

    // Client-side validations
    const errors = {};
    Object.keys(editFormData).forEach(key => {
      if (!editFormData[key] || editFormData[key].toString().trim() === '') {
        errors[key] = 'This field is required';
      }
    });

    if (editFormData.email && !isValidEmail(editFormData.email)) {
      errors.email = 'Invalid email format';
    }

    if (editFormData.phone && !isValidPhone(editFormData.phone)) {
      errors.phone = 'Phone number must be exactly 10 digits';
    }

    if (editFormData.salary && (isNaN(editFormData.salary) || parseFloat(editFormData.salary) <= 0)) {
      errors.salary = 'Salary must be a positive number';
    }

    if (Object.keys(errors).length > 0) {
      setEditFormErrors(errors);
      showToast('error', 'Please correct the validation errors.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/employees/${editingEmployee.emp_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });
      const data = await response.json();

      if (response.ok) {
        showToast('success', 'Employee updated successfully!');
        setShowEditModal(false);
        // Refresh cards
        fetchEmployees();
      } else {
        showToast('error', data.error || 'Failed to update employee details');
      }
    } catch (error) {
      console.error('Update error:', error);
      showToast('error', 'Server error. Could not save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  // Format currency in INR format (e.g. ₹ 5,00,000.00)
  const formatSalary = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="app-container">
      {/* TOAST SYSTEM */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="toast-icon" size={18} />
            ) : (
              <AlertTriangle className="toast-icon" size={18} />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* SIDENAV */}
      <aside className={`sidenav ${isExpanded ? 'expanded' : 'collapsed'}`}>
        <div className="sidenav-header">
          {isExpanded && (
            <div className="logo-section">
              <FileSpreadsheet className="logo-icon" size={24} />
              <span>EMS Portal</span>
            </div>
          )}
          {!isExpanded && <FileSpreadsheet className="logo-icon" size={24} style={{ margin: '0 auto' }} />}
          <button 
            className="toggle-btn" 
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse Sidenav" : "Expand Sidenav"}
          >
            {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        <nav className="sidenav-menu">
          <button 
            className={`nav-item ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            <PlusCircle size={18} />
            <span className="nav-item-text">Add Employee</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'view' ? 'active' : ''}`}
            onClick={() => setActiveTab('view')}
          >
            <Users size={18} />
            <span className="nav-item-text">View & Edit</span>
          </button>
        </nav>

        <div className="sidenav-footer">
          {isExpanded ? <p>© 2026 EMS Corporate</p> : <p>EMS</p>}
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="main-content">
        <header className="page-header">
          <div className="header-text-group">
            <h1 className="page-title">
              {activeTab === 'add' ? 'Add New Employee' : 'Employee Roster'}
            </h1>
            <p className="page-subtitle">
              {activeTab === 'add' 
                ? 'Register a new employee record within the secure system.' 
                : 'Monitor, update, or remove employee records in real-time.'}
            </p>
          </div>
        </header>

        {/* TAB 1: ADD EMPLOYEE */}
        {activeTab === 'add' && (
          <div className="card-form-container">
            <form onSubmit={handleAddSubmit}>
              <div className="form-grid">
                
                <div className="form-group">
                  <label className="form-label">Employee ID *</label>
                  <input
                    type="text"
                    name="emp_id"
                    placeholder="e.g. EMP001"
                    className={`form-input ${formErrors.emp_id ? 'error' : ''}`}
                    value={formData.emp_id}
                    onChange={handleInputChange}
                  />
                  {formErrors.emp_id && <span className="error-text">{formErrors.emp_id}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g. Jane Doe"
                    className={`form-input ${formErrors.name ? 'error' : ''}`}
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                  {formErrors.name && <span className="error-text">{formErrors.name}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="e.g. jane.doe@company.com"
                    className={`form-input ${formErrors.email ? 'error' : ''}`}
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                  {formErrors.email && <span className="error-text">{formErrors.email}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="10-digit number"
                    maxLength={10}
                    className={`form-input ${formErrors.phone ? 'error' : ''}`}
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                  {formErrors.phone && <span className="error-text">{formErrors.phone}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Position / Role *</label>
                  <input
                    type="text"
                    name="position"
                    placeholder="e.g. Senior Developer"
                    className={`form-input ${formErrors.position ? 'error' : ''}`}
                    value={formData.position}
                    onChange={handleInputChange}
                  />
                  {formErrors.position && <span className="error-text">{formErrors.position}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Department *</label>
                  <input
                    type="text"
                    name="department"
                    placeholder="e.g. Engineering"
                    className={`form-input ${formErrors.department ? 'error' : ''}`}
                    value={formData.department}
                    onChange={handleInputChange}
                  />
                  {formErrors.department && <span className="error-text">{formErrors.department}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Salary (INR) Annually *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="salary"
                    placeholder="e.g. 850000"
                    className={`form-input ${formErrors.salary ? 'error' : ''}`}
                    value={formData.salary}
                    onChange={handleInputChange}
                  />
                  {formErrors.salary && <span className="error-text">{formErrors.salary}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Date of Joining *</label>
                  <input
                    type="date"
                    name="date_of_joining"
                    className={`form-input ${formErrors.date_of_joining ? 'error' : ''}`}
                    value={formData.date_of_joining}
                    onChange={handleInputChange}
                  />
                  {formErrors.date_of_joining && <span className="error-text">{formErrors.date_of_joining}</span>}
                </div>

              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Registering...' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: VIEW & EDIT CARDS */}
        {activeTab === 'view' && (
          <>
            {loading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Retrieving secure employee roster...</p>
              </div>
            ) : employees.length === 0 ? (
              <div className="empty-state">
                <Users className="empty-icon" size={44} />
                <h3>No Employees Registered Yet</h3>
                <p>Use the "Add Employee" tab to populate the system database.</p>
                <button className="btn btn-primary" onClick={() => setActiveTab('add')}>
                  Add Employee Now
                </button>
              </div>
            ) : (
              <>
                <div className="employees-grid">
                  {currentEmployees.map((emp) => (
                    <div key={emp.id} className="employee-card">
                      <div className="card-header">
                        <div className="card-title-group">
                          <span className="emp-name">{emp.name}</span>
                          <span className="emp-id-badge">{emp.emp_id}</span>
                        </div>
                      </div>
                      
                      <div className="card-body">
                        <div className="info-row">
                          <Mail className="info-icon" size={14} />
                          <span className="info-label">Email:</span>
                          <span className="info-val">{emp.email}</span>
                        </div>
                        
                        <div className="info-row">
                          <Phone className="info-icon" size={14} />
                          <span className="info-label">Phone:</span>
                          <span className="info-val">{emp.phone}</span>
                        </div>

                        <div className="info-row">
                          <Briefcase className="info-icon" size={14} />
                          <span className="info-label">Position:</span>
                          <span className="info-val">{emp.position}</span>
                        </div>

                        <div className="info-row">
                          <Layers className="info-icon" size={14} />
                          <span className="info-label">Dept:</span>
                          <span className="info-val">{emp.department}</span>
                        </div>

                        <div className="info-row">
                          <IndianRupee className="info-icon" size={14} />
                          <span className="info-label">Salary:</span>
                          <span className="info-val">{formatSalary(emp.salary)}</span>
                        </div>

                        <div className="info-row">
                          <Calendar className="info-icon" size={14} />
                          <span className="info-label">Joined:</span>
                          <span className="info-val">
                            {emp.date_of_joining ? new Date(emp.date_of_joining).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div className="card-actions">
                        <button 
                          className="card-btn card-btn-edit" 
                          onClick={() => openEditModal(emp)}
                        >
                          <Edit3 size={12} />
                          Edit
                        </button>
                        <button 
                          className="card-btn card-btn-delete"
                          onClick={() => handleDelete(emp.emp_id, emp.name)}
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="pagination-container">
                    <div className="pagination-info">
                      Showing <strong>{indexOfFirstEmployee + 1}</strong> to <strong>{Math.min(indexOfLastEmployee, employees.length)}</strong> of <strong>{employees.length}</strong> employees
                    </div>
                    <div className="pagination-controls">
                      <button 
                        className="pagination-nav-btn"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        title="Previous Page"
                      >
                        <ChevronLeft size={16} />
                        <span>Previous</span>
                      </button>

                      <div className="pagination-pages">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                          <button
                            key={pageNum}
                            className={`pagination-page-btn ${currentPage === pageNum ? 'active' : ''}`}
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </button>
                        ))}
                      </div>

                      <button 
                        className="pagination-nav-btn"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        title="Next Page"
                      >
                        <span>Next</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* EDIT POPUP MODAL */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Edit Employee Info ({editingEmployee?.emp_id})</h3>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      className={`form-input ${editFormErrors.name ? 'error' : ''}`}
                      value={editFormData.name}
                      onChange={(e) => handleInputChange(e, true)}
                    />
                    {editFormErrors.name && <span className="error-text">{editFormErrors.name}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      className={`form-input ${editFormErrors.email ? 'error' : ''}`}
                      value={editFormData.email}
                      onChange={(e) => handleInputChange(e, true)}
                    />
                    {editFormErrors.email && <span className="error-text">{editFormErrors.email}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      maxLength={10}
                      className={`form-input ${editFormErrors.phone ? 'error' : ''}`}
                      value={editFormData.phone}
                      onChange={(e) => handleInputChange(e, true)}
                    />
                    {editFormErrors.phone && <span className="error-text">{editFormErrors.phone}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Position / Role *</label>
                    <input
                      type="text"
                      name="position"
                      className={`form-input ${editFormErrors.position ? 'error' : ''}`}
                      value={editFormData.position}
                      onChange={(e) => handleInputChange(e, true)}
                    />
                    {editFormErrors.position && <span className="error-text">{editFormErrors.position}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Department *</label>
                    <input
                      type="text"
                      name="department"
                      className={`form-input ${editFormErrors.department ? 'error' : ''}`}
                      value={editFormData.department}
                      onChange={(e) => handleInputChange(e, true)}
                    />
                    {editFormErrors.department && <span className="error-text">{editFormErrors.department}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Salary (INR) Annually *</label>
                    <input
                      type="number"
                      step="0.01"
                      name="salary"
                      className={`form-input ${editFormErrors.salary ? 'error' : ''}`}
                      value={editFormData.salary}
                      onChange={(e) => handleInputChange(e, true)}
                    />
                    {editFormErrors.salary && <span className="error-text">{editFormErrors.salary}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Date of Joining *</label>
                    <input
                      type="date"
                      name="date_of_joining"
                      className={`form-input ${editFormErrors.date_of_joining ? 'error' : ''}`}
                      value={editFormData.date_of_joining}
                      onChange={(e) => handleInputChange(e, true)}
                    />
                    {editFormErrors.date_of_joining && <span className="error-text">{editFormErrors.date_of_joining}</span>}
                  </div>

                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
