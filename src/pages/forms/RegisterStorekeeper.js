import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import Sidebar from '../../components/layout/Sidebar';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import './Form.css';

const RegisterStorekeeper = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
    password: '',
    confirmPassword: '',
    locationId: '',
    userType: 'FARMER', 

    warehouseId: '', 

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
      setProvinces(response.data.map(p => ({ id: p.id, name: p.name, code: p.code })));
    } catch (error) {
      console.error('Error fetching provinces:', error);
      toast.error('Failed to load provinces');
    }
  };

  useEffect(() => {
    if (selectedProvince) {
      const fetchDistricts = async () => {
        try {
          const response = await dataService.getChildLocations(selectedProvince);
          setDistricts(response.data.map(d => ({ id: d.id, name: d.name, code: d.code })));
        } catch (error) {
          console.error('Error fetching districts:', error);
          toast.error('Failed to load districts');
          setDistricts([]);
        }
      };
      fetchDistricts();
      setSelectedDistrict('');
      setSelectedSector('');
      setSectors([]);
      setSelectedCell('');
      setSelectedVillage('');
      setCells([]);
      setVillages([]);
      setFormData(prev => ({ ...prev, locationId: '' }));
    } else {
      setDistricts([]);
      setSelectedDistrict('');
      setSelectedSector('');
      setSectors([]);
      setSelectedCell('');
      setSelectedVillage('');
      setCells([]);
      setVillages([]);
    }
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedDistrict) {
      const fetchSectors = async () => {
        try {
          const response = await dataService.getChildLocations(selectedDistrict);
          setSectors(response.data.map(s => ({ id: s.id, name: s.name, code: s.code })));
        } catch (error) {
          console.error('Error fetching sectors:', error);
          toast.error('Failed to load sectors');
          setSectors([]);
        }
      };
      fetchSectors();
      setSelectedSector('');
      setSelectedCell('');
      setSelectedVillage('');
      setCells([]);
      setVillages([]);
      setFormData(prev => ({ ...prev, locationId: '' }));
    } else {
      setSectors([]);
      setSelectedSector('');
      setSelectedCell('');
      setSelectedVillage('');
      setCells([]);
      setVillages([]);
    }
  }, [selectedDistrict]);

  useEffect(() => {
    if (selectedSector) {
      const fetchCells = async () => {
        try {
          const response = await dataService.getChildLocations(selectedSector);
          if (response.data && Array.isArray(response.data)) {
            const cellsList = response.data.map(c => ({ id: c.id, name: c.name, code: c.code }));
            setCells(cellsList);
            if (cellsList.length === 0) {
              console.warn('No cells found for sector:', selectedSector);
            }
          } else {
            console.warn('Invalid response format for cells:', response);
            setCells([]);
          }
        } catch (error) {
          console.error('Error fetching cells:', error);
          toast.error('Failed to load cells');
          setCells([]);
        }
      };
      fetchCells();
      setSelectedCell('');
      setSelectedVillage('');
      setVillages([]);
      setFormData(prev => ({ ...prev, locationId: '' }));
    } else {
      setCells([]);
      setSelectedCell('');
      setSelectedVillage('');
      setVillages([]);
    }
  }, [selectedSector]);

  useEffect(() => {
    if (selectedCell) {
      const fetchVillages = async () => {
        try {
          const response = await dataService.getChildLocations(selectedCell);
          if (response.data && Array.isArray(response.data)) {
            const villagesList = response.data.map(v => ({ id: v.id, name: v.name, code: v.code }));
            setVillages(villagesList);
            if (villagesList.length === 0) {
              console.warn('No villages found for cell:', selectedCell);
            }
          } else {
            console.warn('Invalid response format for villages:', response);
            setVillages([]);
          }
        } catch (error) {
          console.error('Error fetching villages:', error);
          toast.error('Failed to load villages');
          setVillages([]);
        }
      };
      fetchVillages();
      setSelectedVillage('');
      setFormData(prev => ({ ...prev, locationId: '' }));
    } else {
      setVillages([]);
      setSelectedVillage('');
    }
  }, [selectedCell]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

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
      const { confirmPassword, warehouseId, ...registerData } = formData;
      const userData = {
        ...registerData,
        userType: formData.userType,
        locationId: selectedVillage,
      };
      
      const createdUser = await dataService.createUserByAdmin(userData);
      
      

      if (formData.userType === 'STOREKEEPER' && warehouseId) {
        try {
          

          const checkResponse = await dataService.checkStorekeeperAssignment(createdUser.data.id, parseInt(warehouseId));
          const checkData = checkResponse.data;
          
          if (checkData.requiresConfirmation) {
            

            const confirmed = window.confirm(
              `⚠️ ${checkData.message}\n\n` +
              `Existing Warehouse: ${checkData.existingWarehouseName}\n` +
              `New Warehouse: ${warehouseId}\n\n` +
              `Do you want to proceed with the replacement?`
            );
            
            if (!confirmed) {
              toast.info('Warehouse assignment cancelled. User created without warehouse assignment.');
              return;
            }
          }
          
          await dataService.assignStorekeeperToWarehouse(createdUser.data.id, parseInt(warehouseId));
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
      <div className="form-layout-wrapper">
        <DashboardHeader title="Register User" subtitle="Create a new farmer or storekeeper account" />
        <div className="form-container">
          <div className="form-card">
          
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
    </div>
  );
};

export default RegisterStorekeeper;

