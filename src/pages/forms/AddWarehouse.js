import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import Sidebar from '../../components/layout/Sidebar';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import './Form.css';

const AddWarehouse = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedSector, setSelectedSector] = useState('');

  const [formData, setFormData] = useState({
    warehouseCode: '',
    warehouseName: '',
    warehouseType: 'COOPERATIVE',
    totalCapacityKg: '',
    locationId: '',
  });

  useEffect(() => {
    if (user?.userType !== 'ADMIN') {
      toast.error('Only admins can add warehouses');
      navigate('/dashboard');
    }
    fetchProvinces();
  }, [user, navigate]);

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
    
    if (!formData.locationId) {
      toast.error('Please select a location (Province → District → Sector)');
      return;
    }

    setLoading(true);
    try {
      await dataService.createWarehouse({
        ...formData,
        totalCapacityKg: parseFloat(formData.totalCapacityKg),
        availableCapacityKg: parseFloat(formData.totalCapacityKg),
        status: 'ACTIVE', // Required field
      });
      
      // Mark warehouse as updated to trigger map refresh
      localStorage.setItem('warehouse-last-update', Date.now().toString());
      window.dispatchEvent(new Event('warehouse-updated'));
      
      toast.success('Warehouse created successfully! A pin will appear on the map.');
      navigate('/warehouses');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create warehouse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <Sidebar />
      <div className="form-container">
        <div className="form-card">
          <h1>Add New Warehouse</h1>
          <p className="form-subtitle">Create a new warehouse in the system</p>
          <form onSubmit={handleSubmit} className="form">
            <div className="form-group">
              <label htmlFor="warehouseCode">Warehouse Code *</label>
              <input
                type="text"
                id="warehouseCode"
                name="warehouseCode"
                value={formData.warehouseCode}
                onChange={handleChange}
                required
                placeholder="e.g., WH-KGL-001"
              />
            </div>

            <div className="form-group">
              <label htmlFor="warehouseName">Warehouse Name *</label>
              <input
                type="text"
                id="warehouseName"
                name="warehouseName"
                value={formData.warehouseName}
                onChange={handleChange}
                required
                placeholder="e.g., Kimironko Central Warehouse"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="warehouseType">Warehouse Type *</label>
                <select
                  id="warehouseType"
                  name="warehouseType"
                  value={formData.warehouseType}
                  onChange={handleChange}
                  required
                >
                  <option value="COOPERATIVE">Cooperative</option>
                  <option value="PRIVATE">Private</option>
                  <option value="GOVERNMENT">Government</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="totalCapacityKg">Total Capacity (KG) *</label>
                <input
                  type="number"
                  id="totalCapacityKg"
                  name="totalCapacityKg"
                  value={formData.totalCapacityKg}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="50000"
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

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => navigate('/warehouses')}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Plus size={18} />
                {loading ? 'Creating...' : 'Create Warehouse'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddWarehouse;

