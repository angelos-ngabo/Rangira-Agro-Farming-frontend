import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import Sidebar from '../../components/layout/Sidebar';

import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import './Form.css';

const EditUser = () => {
  const { user: currentUser } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
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
    locationId: '',
    userType: 'FARMER',
    warehouseId: '',
    status: 'ACTIVE',
  });

  useEffect(() => {
    if (currentUser?.userType !== 'ADMIN') {
      toast.error('Only admins can edit users');
      navigate('/dashboard');
      return;
    }
    fetchUserData();
    fetchProvinces();
    fetchWarehouses();
  }, [id, currentUser, navigate]);

  const fetchUserData = async () => {
    try {
      const response = await dataService.getUserById(id);
      const user = response.data;

      setFormData({
        userCode: user.userCode || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        locationId: user.location?.id || '',
        userType: user.userType || 'FARMER',
        warehouseId: user.warehouseAccesses?.[0]?.warehouse?.id || '',
        status: user.status || 'ACTIVE',
      });

      // Set location hierarchy if location exists
      if (user.location) {
        const locationResponse = await dataService.getLocationById(user.location.id);
        const location = locationResponse.data;

        if (location.parent) {
          // Navigate up the hierarchy to find province, district, sector
          let current = location;
          const hierarchy = [];

          while (current) {
            hierarchy.push(current);
            if (current.parent) {
              const parentResponse = await dataService.getLocationById(current.parent.id);
              current = parentResponse.data;
            } else {
              break;
            }
          }

          // Reverse to get from province to sector
          hierarchy.reverse();

          if (hierarchy.length > 0) {
            setSelectedProvince(hierarchy[0].id);
            if (hierarchy.length > 1) {
              const districtsResponse = await dataService.getChildLocations(hierarchy[0].id);
              setDistricts(districtsResponse.data || []);
              setSelectedDistrict(hierarchy[1].id);

              if (hierarchy.length > 2) {
                const sectorsResponse = await dataService.getChildLocations(hierarchy[1].id);
                setSectors(sectorsResponse.data || []);
                setSelectedSector(hierarchy[2].id);
              }
            }
          }
        }
      }

      setLoadingData(false);
    } catch (error) {
      console.error('Error fetching user:', error);
      toast.error('Failed to load user data');
      navigate('/users');
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

  const fetchWarehouses = async () => {
    try {
      const response = await dataService.getWarehouses({ page: 0, size: 100 });
      setWarehouses(response.data?.content || []);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  useEffect(() => {
    if (selectedProvince) {
      dataService.getChildLocations(selectedProvince)
        .then((response) => {
          setDistricts(response.data || []);
          if (!formData.locationId) {
            setSelectedDistrict('');
            setSelectedSector('');
            setSectors([]);
          }
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
          if (!formData.locationId) {
            setSelectedSector('');
          }
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

    if (!formData.locationId) {
      toast.error('Please select a location (Province → District → Sector)');
      return;
    }

    if (formData.userType === 'STOREKEEPER' && !formData.warehouseId) {
      toast.error('Please select a warehouse for the storekeeper');
      return;
    }

    setLoading(true);
    try {
      // Update user
      await dataService.updateUser(id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        locationId: formData.locationId,
        userType: formData.userType,
        status: formData.status,
      });

      // If storekeeper and warehouse changed, update warehouse access
      if (formData.userType === 'STOREKEEPER' && formData.warehouseId) {
        try {
          // Get current user to check existing warehouse assignment
          const currentUserResponse = await dataService.getUserById(id);
          const currentUser = currentUserResponse.data;
          const oldWarehouseId = currentUser.warehouseAccesses?.find(
            access => access.accessLevel === 'MANAGER' && access.isActive
          )?.warehouse?.id;

          // If warehouse changed, assign to new warehouse
          if (oldWarehouseId !== parseInt(formData.warehouseId)) {
            await dataService.assignStorekeeperToWarehouse(parseInt(id), parseInt(formData.warehouseId));
            toast.success('User updated and warehouse reassigned successfully!');
          } else {
            toast.success('User updated successfully!');
          }
        } catch (error) {
          console.error('Error assigning warehouse:', error);
          toast.error(error.response?.data?.message || 'User updated but warehouse assignment failed. Please try assigning manually.');
        }
      } else {
        toast.success('User updated successfully!');
      }

      navigate('/users');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="form-page">
        <Sidebar />

        <div className="form-container">
          <div className="form-card">
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page">
      <Sidebar />

      <div className="form-container">
        <div className="form-card">
          <h1>Edit User</h1>
          <p className="form-subtitle">Update user information</p>

          <form onSubmit={handleSubmit} className="form">
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
                  placeholder="john.doe@example.com"
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
              <label htmlFor="status">Status *</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>

            <div className="form-section-divider">
              <h3>Location Information</h3>
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

            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate('/users')}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Save size={18} />
                {loading ? 'Updating...' : 'Update User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditUser;

