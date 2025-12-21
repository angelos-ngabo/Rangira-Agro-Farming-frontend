import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from 'react-query';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import Sidebar from '../../components/layout/Sidebar';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import './Form.css';

const AddInventory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [cropTypes, setCropTypes] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [farmers, setFarmers] = useState([]);

  const [formData, setFormData] = useState({
    inventoryCode: '',
    cropTypeId: '',
    warehouseId: '',
    farmerId: '',
    quantityKg: '',
    qualityGrade: 'A',
    storageDate: new Date().toISOString().split('T')[0],
    expectedWithdrawalDate: '',
    notes: '',
  });

  useEffect(() => {
    if (user?.userType !== 'STOREKEEPER') {
      toast.error('Only storekeepers can add inventory');
      navigate('/dashboard');
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [cropsResponse, warehousesResponse, farmersResponse] = await Promise.all([
        dataService.getCropTypes({ page: 0, size: 100 }),
        fetchAssignedWarehouses(),
        dataService.getUsers({ page: 0, size: 100, userType: 'FARMER' }),
      ]);

      setCropTypes(cropsResponse.data?.content || []);
      setWarehouses(warehousesResponse);
      setFarmers(farmersResponse.data?.content || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchAssignedWarehouses = async () => {
    try {
      const accessResponse = await dataService.getWarehouseAccesses({ 
        userId: user.id, 
        isActive: true 
      });
      const warehouseIds = accessResponse.data?.map(a => a.warehouse?.id).filter(Boolean) || [];
      const warehousesData = await Promise.all(
        warehouseIds.map(id => dataService.getWarehouseById(id))
      );
      return warehousesData.map(w => w.data).filter(Boolean);
    } catch (error) {
      console.error('Error fetching assigned warehouses:', error);
      return [];
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check warehouse capacity
    const selectedWarehouse = warehouses.find(w => w.id === parseInt(formData.warehouseId));
    if (selectedWarehouse && parseFloat(formData.quantityKg) > selectedWarehouse.availableCapacityKg) {
      toast.error('Quantity exceeds available warehouse capacity');
      return;
    }

    setLoading(true);
    try {
      await dataService.createInventory({
        ...formData,
        cropTypeId: parseInt(formData.cropTypeId),
        warehouseId: parseInt(formData.warehouseId),
        farmerId: parseInt(formData.farmerId),
        storekeeperId: user.id,
        quantityKg: parseFloat(formData.quantityKg),
        remainingQuantityKg: parseFloat(formData.quantityKg),
        expectedWithdrawalDate: formData.expectedWithdrawalDate || null,
      });
      toast.success('Crop added to warehouse successfully!');
      
      // Invalidate all inventory-related queries to refresh data
      queryClient.invalidateQueries('inventories');
      queryClient.invalidateQueries('availableItems');
      queryClient.invalidateQueries('inventories-all-for-search');
      queryClient.invalidateQueries(['inventories']);
      queryClient.invalidateQueries(['warehouseInventory']);
      queryClient.invalidateQueries(['myInventory']);
      
      navigate('/storekeeper/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add inventory');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <Sidebar />
      <div className="form-container">
        <div className="form-card">
          <h1>Add Crop to Warehouse</h1>
          <p className="form-subtitle">Insert crops into your assigned warehouse</p>
          
          <form onSubmit={handleSubmit} className="form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="inventoryCode">Inventory Code *</label>
                <input
                  type="text"
                  id="inventoryCode"
                  name="inventoryCode"
                  value={formData.inventoryCode}
                  onChange={handleChange}
                  required
                  placeholder="e.g., INV-001"
                />
              </div>

              <div className="form-group">
                <label htmlFor="warehouseId">Warehouse *</label>
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
                      {warehouse.warehouseName} - Available: {warehouse.availableCapacityKg} KG
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="cropTypeId">Crop Type *</label>
                <select
                  id="cropTypeId"
                  name="cropTypeId"
                  value={formData.cropTypeId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Crop Type</option>
                  {cropTypes.map((crop) => (
                    <option key={crop.id} value={crop.id}>
                      {crop.cropName} ({crop.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="farmerId">Farmer *</label>
                <select
                  id="farmerId"
                  name="farmerId"
                  value={formData.farmerId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Farmer</option>
                  {farmers.map((farmer) => (
                    <option key={farmer.id} value={farmer.id}>
                      {farmer.firstName} {farmer.lastName} ({farmer.userCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="quantityKg">Quantity (KG) *</label>
                <input
                  type="number"
                  id="quantityKg"
                  name="quantityKg"
                  value={formData.quantityKg}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="1000"
                />
              </div>

              <div className="form-group">
                <label htmlFor="qualityGrade">Quality Grade *</label>
                <select
                  id="qualityGrade"
                  name="qualityGrade"
                  value={formData.qualityGrade}
                  onChange={handleChange}
                  required
                >
                  <option value="A">Grade A (Premium)</option>
                  <option value="B">Grade B (Good)</option>
                  <option value="C">Grade C (Standard)</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="storageDate">Storage Date *</label>
                <input
                  type="date"
                  id="storageDate"
                  name="storageDate"
                  value={formData.storageDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="expectedWithdrawalDate">Expected Withdrawal Date</label>
                <input
                  type="date"
                  id="expectedWithdrawalDate"
                  name="expectedWithdrawalDate"
                  value={formData.expectedWithdrawalDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                placeholder="Additional notes about this inventory..."
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => navigate('/storekeeper/dashboard')}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Plus size={18} />
                {loading ? 'Adding...' : 'Add to Warehouse'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddInventory;

