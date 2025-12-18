import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import Sidebar from '../../components/layout/Sidebar';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import { useQuery, useQueryClient } from 'react-query';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import './Form.css';

const EditWarehouse = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
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
  const [currentStorekeeperId, setCurrentStorekeeperId] = useState(null);

  const [formData, setFormData] = useState({
    warehouseCode: '',
    warehouseName: '',
    warehouseType: 'COOPERATIVE',
    totalCapacityKg: '',
    availableCapacityKg: '',
    status: 'ACTIVE',
    locationId: '',
    storekeeperId: '',
  });

  

  const { data: storekeepersData } = useQuery(
    'storekeepers-for-warehouse',
    async () => {
      

      const response = await dataService.getUsersByType('STOREKEEPER');
      return response.data || [];
    },
    { enabled: !!user && user.userType === 'ADMIN' }
  );

  useEffect(() => {
    if (user?.userType !== 'ADMIN') {
      toast.error('Only admins can edit warehouses');
      navigate('/dashboard');
      return;
    }
    fetchProvinces();
    fetchWarehouse();
  }, [user, navigate, id]);

  const fetchProvinces = async () => {
    try {
      const response = await dataService.getProvinces();
      setProvinces(response.data.map(p => ({ id: p.id, name: p.name, code: p.code })));
    } catch (error) {
      console.error('Error fetching provinces:', error);
      toast.error('Failed to load provinces');
    }
  };

  const fetchWarehouse = async () => {
    try {
      const response = await dataService.getWarehouseById(id);
      const warehouse = response.data;
      
      

      try {
        const accessesResponse = await dataService.getWarehouseAccesses({ warehouseId: parseInt(id), isActive: true });
        const accesses = Array.isArray(accessesResponse.data) 
          ? accessesResponse.data 
          : accessesResponse.data?.content || [];
        const managerAccess = accesses.find(
          access => access.accessLevel === 'MANAGER' && 
                   access.isActive === true && 
                   access.user?.userType === 'STOREKEEPER'
        );
        if (managerAccess && managerAccess.user) {
          const storekeeperId = managerAccess.user.id || managerAccess.userId;
          if (storekeeperId) {
            setCurrentStorekeeperId(storekeeperId);
            setFormData(prev => ({ ...prev, storekeeperId: storekeeperId.toString() }));
          }
        }
      } catch (error) {
        console.error('Error fetching warehouse accesses:', error);
        

      }
      
      

      const totalCapacity = warehouse.totalCapacityKg ? parseFloat(warehouse.totalCapacityKg) : 0;
      const availableCapacity = warehouse.availableCapacityKg ? parseFloat(warehouse.availableCapacityKg) : totalCapacity;
      
      setFormData(prev => ({
        ...prev,
        warehouseCode: warehouse.warehouseCode || '',
        warehouseName: warehouse.warehouseName || '',
        warehouseType: warehouse.warehouseType || 'COOPERATIVE',
        totalCapacityKg: totalCapacity.toString(),
        availableCapacityKg: availableCapacity.toString(),
        status: warehouse.status || 'ACTIVE',
        locationId: warehouse.location?.id || '',
      }));

      

      if (warehouse.location) {
        const location = warehouse.location;
        let currentLocation = location;
        const hierarchy = [];
        
        

        while (currentLocation) {
          hierarchy.unshift(currentLocation);
          currentLocation = currentLocation.parent;
        }
        
        

        if (hierarchy.length >= 1) setSelectedProvince(hierarchy[0].id);
        if (hierarchy.length >= 2) {
          setSelectedDistrict(hierarchy[1].id);
          dataService.getChildLocations(hierarchy[0].id)
            .then((response) => setDistricts(response.data || []))
            .catch(() => {});
        }
        if (hierarchy.length >= 3) {
          setSelectedSector(hierarchy[2].id);
          dataService.getChildLocations(hierarchy[1].id)
            .then((response) => setSectors(response.data || []))
            .catch(() => {});
        }
        if (hierarchy.length >= 4) {
          setSelectedCell(hierarchy[3].id);
          dataService.getChildLocations(hierarchy[2].id)
            .then((response) => setCells(response.data || []))
            .catch(() => {});
        }
        if (hierarchy.length >= 5) {
          setSelectedVillage(hierarchy[4].id);
          dataService.getChildLocations(hierarchy[3].id)
            .then((response) => setVillages(response.data || []))
            .catch(() => {});
        }
      }
    } catch (error) {
      toast.error('Failed to load warehouse');
      navigate('/warehouses');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (selectedProvince) {
      dataService.getChildLocations(selectedProvince)
        .then((response) => {
          setDistricts(response.data.map(d => ({ id: d.id, name: d.name, code: d.code })) || []);
          if (!selectedDistrict) {
            setSelectedDistrict('');
            setSelectedSector('');
            setSectors([]);
            setSelectedCell('');
            setSelectedVillage('');
            setCells([]);
            setVillages([]);
          }
        })
        .catch((error) => {
          console.error('Error fetching districts:', error);
        });
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
      dataService.getChildLocations(selectedDistrict)
        .then((response) => {
          setSectors(response.data.map(s => ({ id: s.id, name: s.name, code: s.code })) || []);
          if (!selectedSector) {
            setSelectedSector('');
            setSelectedCell('');
            setSelectedVillage('');
            setCells([]);
            setVillages([]);
            setFormData(prev => ({ ...prev, locationId: '' }));
          }
        })
        .catch((error) => {
          console.error('Error fetching sectors:', error);
        });
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
      dataService.getChildLocations(selectedSector)
        .then((response) => {
          setCells(response.data.map(c => ({ id: c.id, name: c.name, code: c.code })) || []);
          if (!selectedCell) {
            setSelectedCell('');
            setSelectedVillage('');
            setVillages([]);
            setFormData(prev => ({ ...prev, locationId: '' }));
          }
        })
        .catch((error) => {
          console.error('Error fetching cells:', error);
        });
    } else {
      setCells([]);
      setSelectedCell('');
      setSelectedVillage('');
      setVillages([]);
    }
  }, [selectedSector]);

  useEffect(() => {
    if (selectedCell) {
      dataService.getChildLocations(selectedCell)
        .then((response) => {
          setVillages(response.data.map(v => ({ id: v.id, name: v.name, code: v.code })) || []);
          if (!selectedVillage) {
            setSelectedVillage('');
            setFormData(prev => ({ ...prev, locationId: '' }));
          }
        })
        .catch((error) => {
          console.error('Error fetching villages:', error);
        });
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
    
    if (!formData.locationId || !selectedVillage) {
      toast.error('Please select a complete location (Province → District → Sector → Cell → Village)');
      return;
    }

    setLoading(true);
    try {
      

      const totalCapacity = parseFloat(formData.totalCapacityKg);
      const availableCapacity = parseFloat(formData.availableCapacityKg);
      
      if (isNaN(totalCapacity) || totalCapacity <= 0) {
        toast.error('Total capacity must be a valid positive number');
        setLoading(false);
        return;
      }
      
      if (isNaN(availableCapacity) || availableCapacity < 0) {
        toast.error('Available capacity must be a valid non-negative number');
        setLoading(false);
        return;
      }
      
      if (availableCapacity > totalCapacity) {
        toast.error('Available capacity cannot exceed total capacity');
        setLoading(false);
        return;
      }

      

      await dataService.updateWarehouse(id, {
        warehouseCode: formData.warehouseCode,
        warehouseName: formData.warehouseName,
        warehouseType: formData.warehouseType,
        totalCapacityKg: totalCapacity,
        availableCapacityKg: availableCapacity,
        status: formData.status,
        locationId: formData.locationId,
      });

      

      const newStorekeeperId = formData.storekeeperId ? parseInt(formData.storekeeperId) : null;
      const currentId = currentStorekeeperId ? (typeof currentStorekeeperId === 'string' ? parseInt(currentStorekeeperId) : currentStorekeeperId) : null;
      
      

      if (newStorekeeperId !== currentId) {
        if (newStorekeeperId) {
          

          try {
            

            const checkResponse = await dataService.checkStorekeeperAssignment(newStorekeeperId, parseInt(id));
            const checkData = checkResponse.data;
            
            if (checkData.requiresConfirmation) {
              

              const confirmed = window.confirm(
                `⚠️ ${checkData.message}\n\n` +
                `Existing Warehouse: ${checkData.existingWarehouseName}\n` +
                `New Warehouse: ${formData.warehouseName || 'This warehouse'}\n\n` +
                `Do you want to proceed with the replacement?`
              );
              
              if (!confirmed) {
                toast.info('Warehouse assignment cancelled. Warehouse updated without changing storekeeper assignment.');
                return;
              }
            }
            
            await dataService.assignStorekeeperToWarehouse(newStorekeeperId, parseInt(id));
            

            window.dispatchEvent(new Event('warehouse-assignment-changed'));
            localStorage.setItem('warehouse-assignment-last-update', Date.now().toString());
            toast.success('Warehouse and storekeeper assignment updated successfully!');
          } catch (error) {
            console.error('Error assigning storekeeper:', error);
            toast.error('Warehouse updated but storekeeper assignment failed. Please try assigning manually.');
          }
        } else if (currentId) {
          

          try {
            

            const accessesResponse = await dataService.getWarehouseAccesses({ 
              warehouseId: parseInt(id), 
              isActive: true 
            });
            const accesses = Array.isArray(accessesResponse.data) 
              ? accessesResponse.data 
              : accessesResponse.data?.content || [];
            const managerAccess = accesses.find(
              access => access.accessLevel === 'MANAGER' && 
                       access.isActive === true && 
                       (access.user?.id === currentId || access.userId === currentId)
            );
            if (managerAccess) {
              

              await dataService.updateWarehouseAccess(managerAccess.id, {
                ...managerAccess,
                isActive: false,
                status: 'REJECTED'
              });
              toast.success('Warehouse updated and storekeeper removed successfully!');
            } else {
              toast.success('Warehouse updated successfully!');
            }
          } catch (error) {
            console.error('Error removing storekeeper:', error);
            toast.warning('Warehouse updated but could not remove storekeeper. Please remove manually.');
          }
        } else {
          toast.success('Warehouse updated successfully!');
        }
      } else {
        toast.success('Warehouse updated successfully!');
      }
      
      

      queryClient.invalidateQueries(['warehouses']);
      queryClient.invalidateQueries('warehouse-accesses-for-storekeepers');
      
      navigate('/warehouses');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update warehouse');
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
        <DashboardHeader title="Edit Warehouse" subtitle="Update warehouse information" />
        <div className="form-container">
          <div className="form-card">
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

            <div className="form-group">
              <label htmlFor="storekeeperId">Storekeeper</label>
              <select
                id="storekeeperId"
                name="storekeeperId"
                value={formData.storekeeperId || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, storekeeperId: e.target.value }))}
              >
                <option value="">No Storekeeper Assigned</option>
                {storekeepersData?.map((storekeeper) => (
                  <option key={storekeeper.id} value={storekeeper.id}>
                    {storekeeper.firstName} {storekeeper.lastName} ({storekeeper.email})
                  </option>
                ))}
              </select>
              <small style={{ color: '#666', fontSize: '12px' }}>
                Select a storekeeper to assign to this warehouse. Leave empty to remove assignment.
              </small>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => navigate('/warehouses')}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Save size={18} />
                {loading ? 'Updating...' : 'Update Warehouse'}
              </button>
            </div>
          </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditWarehouse;

