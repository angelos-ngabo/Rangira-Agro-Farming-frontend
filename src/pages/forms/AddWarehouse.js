import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import Sidebar from '../../components/layout/Sidebar';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
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
  const [cells, setCells] = useState([]);
  const [villages, setVillages] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [selectedCell, setSelectedCell] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');

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
    const fetchProvinces = async () => {
      try {
        const response = await dataService.getProvinces();
        setProvinces(response.data.map(p => ({ id: p.id, name: p.name, code: p.code })));
      } catch (error) {
        console.error('Error fetching provinces:', error);
        toast.error('Failed to load provinces');
      }
    };
    fetchProvinces();
  }, [user, navigate]);

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
          console.log('Fetching cells for sector ID:', selectedSector);
          const response = await dataService.getChildLocations(selectedSector);
          console.log('Cells API response:', response);
          if (response && response.data && Array.isArray(response.data)) {
            const cellsList = response.data.map(c => ({ id: c.id, name: c.name, code: c.code }));
            console.log('Parsed cells list:', cellsList);
            setCells(cellsList);
            if (cellsList.length === 0) {
              console.warn('No cells found for sector:', selectedSector);
              toast.error('No cells found for this sector. Please ensure locations are seeded.');
            }
          } else {
            console.warn('Invalid response format for cells:', response);
            setCells([]);
            toast.error('Invalid response format when loading cells');
          }
        } catch (error) {
          console.error('Error fetching cells:', error);
          console.error('Error details:', error.response?.data || error.message);
          toast.error(`Failed to load cells: ${error.response?.data?.message || error.message}`);
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
          console.log('Fetching villages for cell ID:', selectedCell);
          const response = await dataService.getChildLocations(selectedCell);
          console.log('Villages API response:', response);
          if (response && response.data && Array.isArray(response.data)) {
            const villagesList = response.data.map(v => ({ id: v.id, name: v.name, code: v.code }));
            console.log('Parsed villages list:', villagesList);
            setVillages(villagesList);
            if (villagesList.length === 0) {
              console.warn('No villages found for cell:', selectedCell);
              toast.error('No villages found for this cell. Please ensure locations are seeded.');
            }
          } else {
            console.warn('Invalid response format for villages:', response);
            setVillages([]);
            toast.error('Invalid response format when loading villages');
          }
        } catch (error) {
          console.error('Error fetching villages:', error);
          console.error('Error details:', error.response?.data || error.message);
          toast.error(`Failed to load villages: ${error.response?.data?.message || error.message}`);
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

    if (!selectedProvince || !selectedDistrict || !selectedSector || !selectedCell || !selectedVillage) {
      toast.error('Please select a complete location (Province → District → Sector → Cell → Village)');
      return;
    }

    setLoading(true);
    try {
      await dataService.createWarehouse({
        ...formData,
        locationId: selectedVillage,
        totalCapacityKg: parseFloat(formData.totalCapacityKg),
        availableCapacityKg: parseFloat(formData.totalCapacityKg),
        status: 'ACTIVE',
      });

      localStorage.setItem('warehouse-last-update', Date.now().toString());
      window.dispatchEvent(new Event('warehouse-updated'));

      toast.success('Warehouse created successfully! A pin will appear on the map.');
      navigate('/warehouses');
    } catch (error) {
      console.error('Error creating warehouse:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to create warehouse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <Sidebar />
      <div className="form-layout-wrapper">
        <DashboardHeader title="Add Warehouse" subtitle="Create a new warehouse in the system" />
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
    </div>
  );
};

export default AddWarehouse;

