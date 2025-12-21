import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import Sidebar from '../../components/layout/Sidebar';
import './Form.css';

const RegisterStorekeeper = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedSector, setSelectedSector] = useState('');

  const [warehouses, setWarehouses] = useState([]);
  const [formData, setFormData] = useState({
    userCode: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    locationId: '',
    userType: 'FARMER', // Default to FARMER, can select STOREKEEPER
    warehouseId: '', // For storekeepers
  });

  useEffect(() => {
    if (user?.userType !== 'ADMIN') {
      toast.error('Only admins can register storekeepers');
      navigate('/dashboard');
    }
    fetchProvinces();
    fetchWarehouses();
  }, [user, navigate]);
  
  const fetchWarehouses = async () => {
    try {
      const response = await dataService.getWarehouses({ page: 0, size: 100 });
      setWarehouses(response.data?.content || []);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const fetchProvinces = async () => {
    try {
      const response = await dataService.getProvinces();
      setProvinces(response.data || []);
    } catch (error) {
      console.error('Error fetching provinces:', error);
    }
  };

  useEffect(() => {
    if (selectedProvince) {
      dataService.getChildLocations(selectedProvince)
        .then((response) => {
          setDistricts(response.data || []);
          setSelectedDistrict('');
          setSelectedSector('');
          setSectors([]);
        })
        .catch((error) => {
          console.error('Error fetching districts:', error);
        });
    }
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedDistrict) {
      dataService.getChildLocations(selectedDistrict)
        .then((response) => {
          setSectors(response.data || []);
          setSelectedSector('');
        })
        .catch((error) => {
          console.error('Error fetching sectors:', error);
        });
    }
  }, [selectedDistrict]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSectorChange = (e) => {
    const sectorId = e.target.value;
    setSelectedSector(sectorId);
    setFormData(prev => ({ ...prev, locationId: sectorId }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (!formData.locationId) {
      toast.error('Please select a complete location (Province → District → Sector)');
      return;
    }

    if (formData.userType === 'STOREKEEPER' && !formData.warehouseId) {
      toast.error('Please select a warehouse for the storekeeper');
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, warehouseId, ...registerData } = formData;
      const userData = {
        ...registerData,
        userType: formData.userType,
      };
      
      const createdUser = await dataService.createUserByAdmin(userData);
      
      // If storekeeper, assign to warehouse
      if (formData.userType === 'STOREKEEPER' && warehouseId) {
        try {
          await dataService.createWarehouseAccess({
            userId: createdUser.data.id,
            warehouseId: parseInt(warehouseId),
            accessLevel: 'MANAGER',
            grantedDate: new Date().toISOString().split('T')[0],
            isActive: true,
            status: 'ACTIVE',
          });
        } catch (accessError) {
          console.error('Error assigning warehouse:', accessError);
          toast.error('User created but warehouse assignment failed. Please assign manually.');
        }
      }
      
      toast.success(`${formData.userType} registered successfully!`);
      navigate('/users');
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to register ${formData.userType}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <Sidebar />
      <div className="form-container">
        <div className="form-card">
          <h1>Register User</h1>
          <p className="form-subtitle">Create a new farmer or storekeeper account</p>
          <h1>Add User (Farmer/Storekeeper)</h1>
          <p className="form-subtitle">Create a new farmer or storekeeper account</p>
          
          <form onSubmit={handleSubmit} className="form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="userCode">User Code *</label>
                <input
                  type="text"
                  id="userCode"
                  name="userCode"
                  value={formData.userCode}
                  onChange={handleChange}
                  required
                  placeholder={formData.userType === 'STOREKEEPER' ? 'e.g., STORE-001' : 'e.g., FARM-001'}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="userType">User Type *</label>
                <select
                  id="userType"
                  name="userType"
                  value={formData.userType}
                  onChange={handleChange}
                  required
                >
                  <option value="FARMER">Farmer</option>
                  <option value="STOREKEEPER">Storekeeper</option>
                </select>
              </div>
            </div>
            
            {formData.userType === 'STOREKEEPER' && (
              <div className="form-group">
                <label htmlFor="warehouseId">Assign Warehouse *</label>
                <select
                  id="warehouseId"
                  name="warehouseId"
                  value={formData.warehouseId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Warehouse</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.warehouseName} - {warehouse.warehouseCode}
                    </option>
                  ))}
                </select>
                <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                  Select the warehouse this storekeeper will manage
                </small>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name *</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  placeholder="John"
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Last Name *</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="storekeeper@example.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number *</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  placeholder="+250788123456"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Location (Rwandan Hierarchy) *</label>
              <div className="location-hierarchy">
                <div className="form-group">
                  <label htmlFor="province">Province *</label>
                  <select
                    id="province"
                    value={selectedProvince}
                    onChange={(e) => setSelectedProvince(e.target.value)}
                    required
                  >
                    <option value="">Select Province</option>
                    {provinces.map((province) => (
                      <option key={province.id} value={province.id}>
                        {province.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="district">District *</label>
                  <select
                    id="district"
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    required
                    disabled={!selectedProvince}
                  >
                    <option value="">Select District</option>
                    {districts.map((district) => (
                      <option key={district.id} value={district.id}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="sector">Sector *</label>
                  <select
                    id="sector"
                    value={selectedSector}
                    onChange={handleSectorChange}
                    required
                    disabled={!selectedDistrict}
                  >
                    <option value="">Select Sector</option>
                    {sectors.map((sector) => (
                      <option key={sector.id} value={sector.id}>
                        {sector.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Min. 6 characters"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Confirm password"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => navigate('/users')}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <UserPlus size={18} />
                {loading ? 'Creating...' : `Create ${formData.userType}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterStorekeeper;

