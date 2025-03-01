import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { 
  FaUser, 
  FaTruck, 
  FaSignOutAlt, 
  FaCheck, 
  FaClock, 
  FaCalendarAlt,
  FaUserAlt,
  FaPhone,
  FaMapMarkerAlt,
  FaClipboardList,
  FaExclamationTriangle,
  FaHistory,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaSync,
  FaKey,
  FaArrowRight,
  FaArrowLeft,
  FaDatabase,
  FaMobileAlt
} from 'react-icons/fa';
import Notification from './Notification';

function UserDashboard() {
  const [formData, setFormData] = useState({
    serialNumber: '',
    date: new Date().toISOString().split('T')[0],
    driverMobile: '',
    driverName: '',
    vehicleNumber: '',
    vehicleType: '',
    source: '',
    loadingUnload: '',
    timeIn: '',
    timeOut: '',
    checkBy: '',
    remarks: ''
  });

  const [sourceSuggestions, setSourceSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [userData, setUserData] = useState({
    name: '',
    email: '',
    created_at: '',
    loading: true,
    error: null
  });

  const [userUnits, setUserUnits] = useState([]);

  const [entriesData, setEntriesData] = useState({
    entries: [],
    loading: true,
    error: null,
    page: 1,
    totalPages: 1,
    itemsPerPage: 10
  });

  const [submitState, setSubmitState] = useState({
    loading: false,
    success: false,
    error: null
  });

  const [activeSection, setActiveSection] = useState('form'); // 'form', 'history', or 'all-entries'

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const [notifications, setNotifications] = useState([]);

  const [filters, setFilters] = useState({
    search: '',
    vehicleType: '',
    source: '',
    loadingStatus: '',
    startDate: null,
    endDate: null
  });

  const [columnFilters, setColumnFilters] = useState({
    date: [],
    driverName: [],
    vehicleType: [],
    source: [],
    loadingUnload: [],
    checkBy: [],
  });

  const [activeFilter, setActiveFilter] = useState(null);

  const navigate = useNavigate();

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || role !== 'user') {
      localStorage.clear();
      navigate('/login');
      return;
    }

    // Set up axios interceptor for token expiration
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.clear();
          navigate('/login');
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [navigate]);

  const getToken = useCallback(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || role !== 'user') {
      localStorage.clear();
      navigate('/login');
      return null;
    }
    return token;
  }, [navigate]);

  const fetchUserData = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await axios.get('http://localhost:5000/api/user-data', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserData({
        name: response.data.name,
        loading: false,
        error: null
      });
    } catch (error) {
      setUserData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to fetch user data'
      }));
    }
  }, [getToken]);

  const fetchUserProfile = useCallback(async () => {
    const token = getToken();
    if (!token) {
      addNotification('Session expired. Please login again', 'error');
      navigate('/login');
      return;
    }

    try {
      const response = await axios.get('http://localhost:5000/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserData({
        ...response.data,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setUserData(prev => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || 'Failed to fetch profile'
      }));
      addNotification(error.response?.data?.message || 'Failed to fetch profile', 'error');
    }
  }, [getToken]);

  const fetchUserUnits = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await axios.get('http://localhost:5000/api/user/units', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserUnits(response.data);
    } catch (error) {
      console.error('Error fetching user units:', error);
    }
  }, [getToken]);

  const fetchEntries = useCallback(async () => {
    const token = getToken();
    if (!token) {
      addNotification('Session expired. Please login again', 'error');
      navigate('/login');
      return;
    }

    setEntriesData(prev => ({ ...prev, loading: true }));
    try {
      const endpoint = '/api/user-entries';
      const response = await axios.get(`http://localhost:5000${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Sort entries by date and time
      const sortedEntries = response.data.sort((a, b) => {
        const dateA = new Date(a.date + ' ' + a.timeIn);
        const dateB = new Date(b.date + ' ' + b.timeIn);
        return dateB - dateA;
      });

      setEntriesData({
        entries: sortedEntries,
        loading: false,
        error: null,
        page: 1,
        totalPages: Math.ceil(sortedEntries.length / 10),
        itemsPerPage: 10
      });
    } catch (error) {
      console.error('Error fetching entries:', error);
      setEntriesData(prev => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || 'Failed to fetch entries'
      }));
      addNotification(error.response?.data?.message || 'Failed to fetch entries', 'error');
    }
  }, [getToken, navigate]);

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const handleDriverMobileChange = async (e) => {
    const mobile = e.target.value.trim(); // Remove any whitespace
    setFormData(prev => ({ ...prev, driverMobile: mobile }));
    
    if (mobile.length >= 10) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/driver-info/${encodeURIComponent(mobile)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data && response.data.driverName) {
          setFormData(prev => ({ 
            ...prev, 
            driverName: response.data.driverName,
            driverMobile: mobile // Ensure mobile number is set correctly
          }));
          addNotification('Driver information found and auto-filled', 'success');
        }
      } catch (error) {
        console.error('Error fetching driver info:', error);
        if (error.response && error.response.status === 404) {
          // Clear driver name if no match found
          setFormData(prev => ({ ...prev, driverName: '' }));
        }
      }
    } else {
      // Clear driver name if mobile number is too short
      setFormData(prev => ({ ...prev, driverName: '' }));
    }
  };

  const handleVehicleNumberChange = async (e) => {
    const number = e.target.value.toUpperCase(); // Convert to uppercase for consistency
    setFormData(prev => ({ ...prev, vehicleNumber: number }));
    
    if (number.length >= 4) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/vehicle-info/${encodeURIComponent(number)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data && response.data.vehicleType) {
          setFormData(prev => ({ ...prev, vehicleType: response.data.vehicleType }));
        }
      } catch (error) {
        if (error.response && error.response.status !== 404) {
          console.error('Error fetching vehicle info:', error);
        }
      }
    }
  };

  const handleSourceChange = async (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, source: value }));

    if (value.length > 0) {
      try {
        const response = await axios.get(`http://localhost:5000/api/source-locations/suggestions?search=${value}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setSourceSuggestions(response.data);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching source suggestions:', error);
      }
    } else {
      setSourceSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSource = (source) => {
    setFormData(prev => ({ ...prev, source }));
    setShowSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitState({ loading: true, success: false, error: null });

    const token = getToken();
    if (!token) {
      addNotification('Session expired. Please login again', 'error');
      navigate('/login');
      return;
    }

    // Validate required fields
    const requiredFields = ['driverName', 'driverMobile', 'vehicleNumber', 'vehicleType', 'source', 'loadingUnload'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      setSubmitState({
        loading: false,
        success: false,
        error: `Please fill in all required fields: ${missingFields.join(', ')}`
      });
      addNotification(`Please fill in all required fields: ${missingFields.join(', ')}`, 'error');
      return;
    }

    try {
      // Save driver info
      await axios.post('http://localhost:5000/api/driver-info', {
        driverMobile: formData.driverMobile,
        driverName: formData.driverName
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Save vehicle info
      await axios.post('http://localhost:5000/api/vehicle-info', {
        vehicleNumber: formData.vehicleNumber,
        vehicleType: formData.vehicleType
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Save the source location for suggestions
      if (formData.source) {
        await axios.post('http://localhost:5000/api/source-locations', 
          { location: formData.source },
          { headers: { Authorization: `Bearer ${token}` }}
        );
      }

      const unitsList = userUnits.map(unit => `Unit ${unit.unit_number}`).join(', ');
      const submissionData = {
        ...formData,
        recordedBy: `${userData.name} (${unitsList})`
      };

      const response = await axios.post('http://localhost:5000/api/entries', submissionData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSubmitState({
        loading: false,
        success: true,
        error: null
      });

      addNotification('Entry submitted successfully', 'success');

      // Reset form
      setFormData({
        serialNumber: '',
        date: new Date().toISOString().split('T')[0],
        driverMobile: '',
        driverName: '',
        vehicleNumber: '',
        vehicleType: '',
        source: '',
        loadingUnload: '',
        timeIn: '',
        timeOut: '',
        checkBy: '',
        remarks: ''
      });
      
      fetchEntries();

    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitState({
        loading: false,
        success: false,
        error: error.response?.data?.message || 'Failed to submit entry'
      });
      addNotification(error.response?.data?.message || 'Failed to submit entry', 'error');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Add validation for driver mobile number
    if (name === 'driverMobile') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prevState => ({
        ...prevState,
        [name]: numericValue
      }));
      return;
    }

    // Add validation for date to prevent future dates
    if (name === 'date') {
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time part for proper date comparison
      
      if (selectedDate > today) {
        // If future date is selected, keep the previous value
        return;
      }
    }

    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEntries();
    setRefreshing(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleProfileDropdown = (e) => {
    e.stopPropagation();
    setShowProfileDropdown(!showProfileDropdown);
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      addNotification('All password fields are required', 'error');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addNotification('New passwords do not match', 'error');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      addNotification('New password must be at least 6 characters long', 'error');
      return;
    }

    const token = getToken();
    if (!token) {
      addNotification('Session expired. Please login again', 'error');
      navigate('/login');
      return;
    }

    try {
      await axios.put('http://localhost:5000/api/change-password', passwordForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      addNotification('Password changed successfully', 'success');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setTimeout(() => {
        setShowChangePasswordModal(false);
      }, 2000);
    } catch (error) {
      addNotification(error.response?.data?.message || 'Failed to change password', 'error');
    }
  };

  const handleLogout = () => {
    addNotification('Successfully logged out', 'success');
    setTimeout(() => {
      localStorage.clear();
      navigate('/login', { replace: true });
    }, 1000);
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setShowProfileDropdown(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Check for login success notification
    const showLoginSuccess = localStorage.getItem('showLoginSuccess');
    if (showLoginSuccess === 'true') {
      addNotification('User logged in successfully', 'success');
      localStorage.removeItem('showLoginSuccess');
    }

    fetchUserProfile();
    fetchUserUnits();
    fetchEntries();
  }, [fetchUserProfile, fetchUserUnits, fetchEntries]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries, activeSection]);

  const handlePageChange = (newPage) => {
    setEntriesData(prev => ({ ...prev, page: newPage }));
  };

  const applyFilters = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    setEntriesData(prev => ({ ...prev, page: 1 }));
  };

  const renderProfile = () => {
    return (
      <div className="profile-container">
        <div className="profile-header">
          <FaUser className="profile-icon" />
          <h2>Profile Information</h2>
        </div>
        <div className="profile-details">
          <p><strong>Name:</strong> {userData.name}</p>
          <p><strong>Email:</strong> {userData.email}</p>
          <p><strong>Joined:</strong> {new Date(userData.created_at).toLocaleDateString()}</p>
          <div className="units-section">
            <h3>Assigned Units</h3>
            <div className="units-list">
              {userUnits.map(unit => (
                <div key={unit.id} className="unit-item">
                  <span className="unit-number">Unit {unit.unit_number}</span>
                  <span className="unit-name">{unit.unit_name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (userData.loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="modern-dashboard">
      <div className="notifications-container">
        {notifications.map(notification => (
          <Notification
            key={notification.id}
            message={notification.message}
            type={notification.type}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
      <aside className={`dashboard-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <FaTruck className="company-logo" />
          <h2>Gate Entry</h2>
          <button className="toggle-btn" onClick={toggleSidebar}>
            {isSidebarOpen ? <FaChevronLeft /> : <FaChevronRight />}
          </button>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar" onClick={toggleProfileDropdown}>
            <FaUser />
          </div>
          <div className="user-info">
            <h3 className="user-name">{userData.name}</h3>
            <p className="user-role">Gate Operator</p>
          </div>
          {/* Profile Dropdown */}
          <div className={`profile-dropdown ${showProfileDropdown ? 'show' : ''}`}>
            <button className="profile-dropdown-item" onClick={() => setShowProfileModal(true)}>
              <FaUser />
              <span>My Profile</span>
            </button>
            <button className="profile-dropdown-item" onClick={() => setShowChangePasswordModal(true)}>
              <FaKey />
              <span>Change Password</span>
            </button>
            <div className="profile-dropdown-divider" />
            <button className="profile-dropdown-item" onClick={handleLogout}>
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>
        </div>

        <div className="sidebar-menu">
          <button 
            className={`menu-item ${activeSection === 'form' ? 'active' : ''}`}
            onClick={() => setActiveSection('form')}
          >
            <FaClipboardList className="menu-icon" />
            {isSidebarOpen && <span>New Entry</span>}
          </button>

          <button 
            className={`menu-item ${activeSection === 'history' ? 'active' : ''}`}
            onClick={() => setActiveSection('history')}
          >
            <FaHistory className="menu-icon" />
            {isSidebarOpen && <span>My Entries</span>}
          </button>
        </div>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="menu-item logout">
            <FaSignOutAlt className="menu-icon" />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div className="dashboard-content">
        <div className="content-header">
          <div className="header-title">
            <h1>
              {activeSection === 'form' 
                ? 'New Vehicle Entry' 
                : 'My Recent Entries'}
            </h1>
            <p className="header-subtitle">
              {activeSection === 'form' 
                ? 'Fill in the details below to create a new entry'
                : 'View and manage your recent entries'}
            </p>
          </div>
          {activeSection !== 'form' && (
            <div className="header-actions">
              <button 
                className="refresh-button"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <FaSync className={`refresh-icon ${refreshing ? 'spinning' : ''}`} />
              </button>
            </div>
          )}
        </div>

        {activeSection === 'form' ? (
          <form onSubmit={handleSubmit} className="form-sections-container">
            <div className="form-section">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="serialNumber">
                    <span className="label-icon">#</span>
                    Serial Number
                  </label>
                  <input
                    type="text"
                    id="serialNumber"
                    name="serialNumber"
                    className="form-control"
                    value={formData.serialNumber}
                    onChange={handleChange}
                    required
                    disabled={submitState.loading}
                    placeholder="Enter serial number"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="date">
                    <FaCalendarAlt className="label-icon" />
                    Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    className="form-control"
                    value={formData.date}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                    required
                    disabled={submitState.loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="driverMobile">
                    < FaMobileAlt className="label-icon" />
                    Driver Mobile
                  </label>
                  <input
                    type="tel"
                    id="driverMobile"
                    name="driverMobile"
                    className="form-control"
                    value={formData.driverMobile}
                    onChange={handleDriverMobileChange}
                    required
                    disabled={submitState.loading}
                    placeholder="Enter 10 digit mobile number"
                    pattern="[0-9]{10}"
                    maxLength="10"
                  />
                  {formData.driverMobile && formData.driverMobile.length !== 10 && (
                    <small className="validation-error">Mobile number must be exactly 10 digits</small>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="driverName">
                    <FaUser className="label-icon" />
                    Driver Name
                  </label>
                  <input
                    type="text"
                    id="driverName"
                    name="driverName"
                    className="form-control"
                    value={formData.driverName}
                    onChange={handleChange}
                    required
                    disabled={submitState.loading}
                    placeholder="Enter driver's name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="vehicleNumber">
                    <span className="label-icon">#</span>
                    Vehicle Number
                  </label>
                  <input
                    type="text"
                    id="vehicleNumber"
                    name="vehicleNumber"
                    className="form-control"
                    value={formData.vehicleNumber}
                    onChange={handleVehicleNumberChange}
                    required
                    disabled={submitState.loading}
                    placeholder="Enter vehicle number"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="vehicleType">
                    <FaTruck className="label-icon" />
                    Vehicle Type
                  </label>
                  <input
                    type="text"
                    id="vehicleType"
                    name="vehicleType"
                    className="form-control"
                    value={formData.vehicleType}
                    onChange={handleChange}
                    required
                    disabled={submitState.loading}
                    placeholder="Enter vehicle type"
                  />
                </div>

                <div className="form-group">
                  <label><FaMapMarkerAlt className="label-icon" /> Source</label>
                  <div className="suggestion-container">
                    <input
                      type="text"
                      name="source"
                      value={formData.source}
                      onChange={handleSourceChange}
                      onFocus={() => formData.source && handleSourceChange({ target: { value: formData.source } })}
                      required
                      disabled={submitState.loading}
                      placeholder="Enter source location"
                    />
                    {showSuggestions && sourceSuggestions.length > 0 && (
                      <ul className="suggestions-list">
                        {sourceSuggestions.map((suggestion, index) => (
                          <li key={index} onClick={() => selectSource(suggestion)}>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="loadingUnload">
                    <FaTruck className="label-icon" />
                    Purpose
                  </label>
                  <select
                    id="loadingUnload"
                    name="loadingUnload"
                    className="form-control"
                    value={formData.loadingUnload}
                    onChange={handleChange}
                    required
                    disabled={submitState.loading}
                  >
                    <option value="">Select Purpose</option>
                    <option value="Loading">Loading</option>
                    <option value="Unloading">Unloading</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="timeIn">
                    <FaClock className="label-icon" />
                    Time In
                  </label>
                  <input
                    type="time"
                    id="timeIn"
                    name="timeIn"
                    className="form-control"
                    value={formData.timeIn}
                    onChange={handleChange}
                    required
                    disabled={submitState.loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="timeOut">
                    <FaClock className="label-icon" />
                    Time Out
                  </label>
                  <input
                    type="time"
                    id="timeOut"
                    name="timeOut"
                    className="form-control"
                    value={formData.timeOut}
                    onChange={handleChange}
                    disabled={submitState.loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="checkBy">
                    <FaUser className="label-icon" />
                    Checked By
                  </label>
                  <input
                    type="text"
                    id="checkBy"
                    name="checkBy"
                    className="form-control"
                    value={formData.checkBy}
                    onChange={handleChange}
                    required
                    disabled={submitState.loading}
                    placeholder="Enter checker's name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="remarks">
                    <FaClipboardList className="label-icon" />
                    Remarks
                  </label>
                  <input
                    type="text"
                    id="remarks"
                    name="remarks"
                    className="form-control"
                    value={formData.remarks}
                    onChange={handleChange}
                    disabled={submitState.loading}
                    placeholder="Enter any additional remarks"
                  />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="submit-button" 
                disabled={submitState.loading}
              >
                {submitState.loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <FaCheck />
                    <span>Submit Entry</span>
                  </>
                )}
              </button>
            </div>

            {submitState.error && (
              <div className="message-banner error">
                <FaExclamationTriangle />
                <span>{submitState.error}</span>
              </div>
            )}
            
            {submitState.success && (
              <div className="message-banner success">
                <FaCheck />
                <span>Vehicle entry recorded successfully!</span>
              </div>
            )}
          </form>
        ) : (
          <div className="entries-section">
            <div className="section-header">
              <h2>My Entries History</h2>
              <div className="header-actions">
                <button className="refresh-btn" onClick={handleRefresh} disabled={refreshing}>
                  <FaSync className={refreshing ? 'spin' : ''} /> Refresh
                </button>
              </div>
            </div>

            <div className="entries-table-container">
              {entriesData.loading ? (
                <div className="loading-spinner">Loading...</div>
              ) : entriesData.error ? (
                <div className="error-message">{entriesData.error}</div>
              ) : (
                <>
                  <div className="filters-section">
                    <input
                      type="text"
                      placeholder="Search entries..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="search-input"
                    />
                  </div>

                  <div className="entries-table-wrapper">
                    <table className="entries-table">
                      <thead>
                        <tr>
                          <th>Serial No.</th>
                          <th>Date</th>
                          <th>Driver Details</th>
                          <th>Vehicle Details</th>
                          <th>Source</th>
                          <th>Loading/Unloading</th>
                          <th>Time In/Out</th>
                          <th>Checked By</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entriesData.entries
                          .filter(entry => {
                            const searchTerm = filters.search.toLowerCase();
                            return (
                              entry.serialNumber?.toString().toLowerCase().includes(searchTerm) ||
                              entry.date?.toLowerCase().includes(searchTerm) ||
                              entry.driverName?.toLowerCase().includes(searchTerm) ||
                              entry.driverMobile?.toLowerCase().includes(searchTerm) ||
                              entry.vehicleNumber?.toLowerCase().includes(searchTerm) ||
                              entry.vehicleType?.toLowerCase().includes(searchTerm) ||
                              entry.source?.toLowerCase().includes(searchTerm) ||
                              entry.loadingUnload?.toLowerCase().includes(searchTerm) ||
                              entry.timeIn?.toLowerCase().includes(searchTerm) ||
                              entry.timeOut?.toLowerCase().includes(searchTerm) ||
                              entry.checkBy?.toLowerCase().includes(searchTerm) ||
                              entry.remarks?.toLowerCase().includes(searchTerm)
                            );
                          })
                          .slice((entriesData.page - 1) * 10, entriesData.page * 10)
                          .map((entry) => (
                            <tr key={entry.id}>
                              <td>{entry.serialNumber}</td>
                              <td>{new Date(entry.date).toLocaleDateString()}</td>
                              <td>
                                <div className="driver-details">
                                  <div>{entry.driverName}</div>
                                  {entry.driverMobile && (
                                    <div className="mobile">
                                      {entry.driverMobile}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div className="vehicle-details">
                                  <div>{entry.vehicleNumber}</div>
                                  <div className="type">
                                    <FaTruck className="icon-small" /> {entry.vehicleType}
                                  </div>
                                </div>
                              </td>
                              <td>{entry.source}</td>
                              <td>
                                <span className={`status ${entry.loadingUnload?.toLowerCase()}`}>
                                  {entry.loadingUnload}
                                </span>
                              </td>
                              <td>
                                <div className="time-details">
                                  <div>In: {entry.timeIn}</div>
                                  {entry.timeOut && <div>Out: {entry.timeOut}</div>}
                                </div>
                              </td>
                              <td>{entry.checkBy}</td>
                              <td>{entry.remarks}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  {entriesData.entries.length === 0 ? (
                    <div className="no-entries">
                      <FaDatabase className="no-data-icon" />
                      <p>No entries found</p>
                    </div>
                  ) : (
                    <div className="pagination">
                      <div className="pagination-info">
                        <span>
                          Showing {Math.min(((entriesData.page - 1) * 10) + 1, entriesData.entries.length)} to{' '}
                          {Math.min(entriesData.page * 10, entriesData.entries.length)} of{' '}
                          {entriesData.entries.length} entries
                        </span>
                      </div>
                      <div className="pagination-controls">
                        <button
                          onClick={() => handlePageChange(entriesData.page - 1)}
                          disabled={entriesData.page === 1}
                          className="pagination-button"
                        >
                          <FaChevronLeft /> Previous
                        </button>
                        <span className="page-info">
                          Page {entriesData.page} of {Math.ceil(entriesData.entries.length / 10)}
                        </span>
                        <button
                          onClick={() => handlePageChange(entriesData.page + 1)}
                          disabled={entriesData.page >= Math.ceil(entriesData.entries.length / 10)}
                          className="pagination-button"
                        >
                          Next <FaChevronRight />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Profile Modal */}
      {showProfileModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>My Profile</h2>
              <button className="close-button" onClick={() => setShowProfileModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              {renderProfile()}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setShowProfileModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Change Password</h2>
              <button 
                className="close-button"
                onClick={() => setShowChangePasswordModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-form">
              {passwordError && <div className="alert alert-error">{passwordError}</div>}
              {passwordSuccess && <div className="alert alert-success">{passwordSuccess}</div>}
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  placeholder="Enter current password"
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  placeholder="Enter new password"
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  placeholder="Confirm new password"
                />
              </div>
              <div className="modal-actions">
                <button 
                  className="save-button"
                  onClick={handleChangePassword}
                >
                  Change Password
                </button>
                <button
                  className="cancel-button"
                  onClick={() => setShowChangePasswordModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserDashboard;
