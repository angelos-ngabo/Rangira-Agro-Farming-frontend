import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import Sidebar from '../../components/layout/Sidebar';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
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
  const [cells, setCells] = useState([]);
  const [villages, setVillages] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [selectedCell, setSelectedCell] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
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

      

      if (user.location) {
        const locationResponse = await dataService.getLocationById(user.location.id);
        const location = locationResponse.data;

        if (location.parent) {
          

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

          

          hierarchy.reverse();

          if (hierarchy.length > 0) {
            setSelectedProvince(hierarchy[0].id);
                if (hierarchy.length > 1) {
              const districtsResponse = await dataService.getChildLocations(hierarchy[0].id);
              setDistricts(districtsResponse.data.map(d => ({ id: d.id, name: d.name, code: d.code })) || []);
              setSelectedDistrict(hierarchy[1].id);

              if (hierarchy.length > 2) {
                const sectorsResponse = await dataService.getChildLocations(hierarchy[1].id);
                setSectors(sectorsResponse.data.map(s => ({ id: s.id, name: s.name, code: s.code })) || []);
                setSelectedSector(hierarchy[2].id);

                if (hierarchy.length > 3) {
                  const cellsResponse = await dataService.getChildLocations(hierarchy[2].id);
                  setCells(cellsResponse.data.map(c => ({ id: c.id, name: c.name, code: c.code })) || []);
                  setSelectedCell(hierarchy[3].id);

                  if (hierarchy.length > 4) {
                    const villagesResponse = await dataService.getChildLocations(hierarchy[3].id);
                    setVillages(villagesResponse.data.map(v => ({ id: v.id, name: v.name, code: v.code })) || []);
                    setSelectedVillage(hierarchy[4].id);
                  }
                }
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
      setProvinces(response.data.map(p => ({ id: p, name: p })));
    } catch (error) {
      console.error('Error fetching provinces:', error);
      toast.error('Failed to load provinces');
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
      dataService.getDistricts(selectedProvince)
        .then((response) => setDistricts(response.data.map(d => ({ id: d, name: d })) || []))
        .catch(console.error);
    } else {
      setDistricts([]);
    }
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedDistrict && selectedProvince) {
      dataService.getSectors(selectedProvince, selectedDistrict)
        .then((response) => setSectors(response.data.map(s => ({ id: s, name: s })) || []))
        .catch(console.error);
    } else {
      setSectors([]);
    }
  }, [selectedDistrict, selectedProvince]);

  useEffect(() => {
    if (selectedSector && selectedDistrict && selectedProvince) {
      dataService.getCells(selectedProvince, selectedDistrict, selectedSector)
        .then((response) => setCells(response.data.map(c => ({ id: c, name: c })) || []))
        .catch(console.error);
    } else {
      setCells([]);
    }
  }, [selectedSector, selectedDistrict, selectedProvince]);

  useEffect(() => {
    if (selectedCell && selectedSector && selectedDistrict && selectedProvince) {
      dataService.getVillages(selectedProvince, selectedDistrict, selectedSector, selectedCell)
        .then((response) => {
          if (response.data && Array.isArray(response.data)) {
            setVillages(response.data.map(v => ({ id: v.id, name: v.village })));
          } else {
            setVillages([]);
          }
        })
        .catch(console.error);
    } else {
      setVillages([]);
    }
  }, [selectedCell, selectedSector, selectedDistrict, selectedProvince]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleProvinceChange = (e) => {
    setSelectedProvince(e.target.value);
    setSelectedDistrict('');
    setSelectedSector('');
    setSelectedCell('');
    setSelectedVillage('');
    setFormData(prev => ({ ...prev, locationId: '' }));
  };

  const handleDistrictChange = (e) => {
    setSelectedDistrict(e.target.value);
    setSelectedSector('');
    setSelectedCell('');
    setSelectedVillage('');
    setFormData(prev => ({ ...prev, locationId: '' }));
  };

  const handleSectorChange = (e) => {
    const sectorId = e.target.value;
    setSelectedSector(sectorId);
    setSelectedCell('');
    setSelectedVillage('');
    setFormData(prev => ({ ...prev, locationId: '' }));
  };

  const handleCellChange = (e) => {
    const cellId = e.target.value;
    setSelectedCell(cellId);
    setSelectedVillage('');
    setFormData(prev => ({ ...prev, locationId: '' }));
  };

  const handleVillageChange = (e) => {
    const villageId = e.target.value;
    setSelectedVillage(villageId);
    setFormData(prev => ({ ...prev, locationId: villageId }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedProvince || !selectedDistrict || !selectedSector || !selectedCell || !selectedVillage) {
      toast.error('Please select a complete location (Province → District → Sector → Cell → Village)');
      return;
    }

    if (formData.userType === 'STOREKEEPER' && !formData.warehouseId) {
      toast.error('Please select a warehouse for the storekeeper');
      return;
    }

    setLoading(true);
    try {
      await dataService.updateUser(id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        locationId: selectedVillage,
        userType: formData.userType,
        status: formData.status,
      });

      

      if (formData.userType === 'STOREKEEPER' && formData.warehouseId) {
        try {
          

          const currentUserResponse = await dataService.getUserById(id);
          const currentUser = currentUserResponse.data;
          const oldWarehouseId = currentUser.warehouseAccesses?.find(
            access => access.accessLevel === 'MANAGER' && access.isActive
          )?.warehouse?.id;

          

          if (oldWarehouseId !== parseInt(formData.warehouseId)) {
            

            const checkResponse = await dataService.checkStorekeeperAssignment(parseInt(id), parseInt(formData.warehouseId));
            const checkData = checkResponse.data;
            
            if (checkData.requiresConfirmation) {
              

              const confirmed = window.confirm(
                `⚠️ ${checkData.message}\n\n` +
                `Existing Warehouse: ${checkData.existingWarehouseName}\n` +
                `New Warehouse: ${formData.warehouseId}\n\n` +
                `Do you want to proceed with the replacement?`
              );
              
              if (!confirmed) {
                toast.info('Warehouse assignment cancelled. User updated without changing warehouse assignment.');
                return;
              }
            }
            
            await dataService.assignStorekeeperToWarehouse(parseInt(id), parseInt(formData.warehouseId));
            

            window.dispatchEvent(new Event('warehouse-assignment-changed'));
            localStorage.setItem('warehouse-assignment-last-update', Date.now().toString());
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
      <div className="form-layout-wrapper">
        <DashboardHeader title="Edit User" subtitle="Update user information" />
        <div className="form-container">
          <div className="form-card">

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
                    onChange={handleProvinceChange}
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
                    onChange={handleDistrictChange}
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

                <div className="form-group">
                  <label htmlFor="cell">Cell *</label>
                  <select
                    id="cell"
                    value={selectedCell}
                    onChange={handleCellChange}
                    required
                    disabled={!selectedSector}
                  >
                    <option value="">Select Cell</option>
                    {cells.map((cell) => (
                      <option key={cell.id} value={cell.id}>
                        {cell.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="village">Village *</label>
                  <select
                    id="village"
                    value={selectedVillage}
                    onChange={handleVillageChange}
                    required
                    disabled={!selectedCell}
                  >
                    <option value="">Select Village</option>
                    {villages.map((village) => (
                      <option key={village.id} value={village.id}>
                        {village.name}
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
    </div>
  );
};

export default EditUser;

