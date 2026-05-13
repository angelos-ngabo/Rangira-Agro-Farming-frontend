import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import Sidebar from '../../components/layout/Sidebar';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import { Send } from 'lucide-react';
import toast from 'react-hot-toast';
import './Form.css';

const WarehouseAccessApplication = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState([]);

  const [cropTypes, setCropTypes] = useState([]);
  const [cropImage, setCropImage] = useState(null);
  const [cropImageUrl, setCropImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    warehouseId: '',
    requestedCapacityKg: '',
    cropTypeId: '',
    cropQuantityKg: '',
    qualityGrade: 'A',
    expectedStorageDate: '',
    expectedWithdrawalDate: '',
    cropNotes: '',
    notes: '',
    cropImageUrl: '',
    desiredPricePerKg: '', 

  });

  useEffect(() => {
    if (user?.userType !== 'FARMER') {
      toast.error('Only farmers can apply for warehouse access');
      navigate('/dashboard');
    }
    fetchWarehouses();
    fetchCropTypes();
  }, [user, navigate]);

  const fetchWarehouses = async () => {
    try {
      const response = await dataService.getWarehouses({ page: 0, size: 100, status: 'ACTIVE' });
      const allWarehouses = response.data?.content || [];
      setWarehouses(allWarehouses);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const fetchCropTypes = async () => {
    try {
      const response = await dataService.getCropTypes({ page: 0, size: 100 });
      setCropTypes(response.data?.content || []);
    } catch (error) {
      console.error('Error fetching crop types:', error);
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

    if (!formData.warehouseId) {
      toast.error('Please select a warehouse');
      return;
    }

    if (!formData.cropTypeId || !formData.cropQuantityKg) {
      toast.error('Please provide crop type and quantity');
      return;
    }

    setLoading(true);
    try {
      

      if (!user?.id) {
        toast.error('User information is missing. Please log in again.');
        setLoading(false);
        return;
      }

      const warehouseId = parseInt(formData.warehouseId);
      if (isNaN(warehouseId)) {
        toast.error('Invalid warehouse selected');
        setLoading(false);
        return;
      }

      

      const payload = {
        userId: parseInt(user.id),
        warehouseId: warehouseId,
        accessLevel: 'VIEWER',
        grantedDate: new Date().toISOString().split('T')[0],
        status: 'PENDING',
        isActive: false,
      };

      

      if (formData.requestedCapacityKg && !isNaN(parseFloat(formData.requestedCapacityKg))) {
        payload.requestedCapacityKg = parseFloat(formData.requestedCapacityKg);
      }

      

      if (formData.cropTypeId) {
        payload.cropTypeId = parseInt(formData.cropTypeId);
      }

      

      if (formData.cropQuantityKg && !isNaN(parseFloat(formData.cropQuantityKg))) {
        payload.cropQuantityKg = parseFloat(formData.cropQuantityKg);
      }

      

      if (formData.qualityGrade) {
        payload.qualityGrade = formData.qualityGrade;
      }

      if (formData.expectedStorageDate) {
        payload.expectedStorageDate = formData.expectedStorageDate;
      }

      if (formData.expectedWithdrawalDate) {
        payload.expectedWithdrawalDate = formData.expectedWithdrawalDate;
      }

      if (formData.cropNotes) {
        payload.cropNotes = formData.cropNotes;
      }

      if (formData.notes) {
        payload.notes = formData.notes;
      }

      if (formData.cropImageUrl) {
        payload.cropImageUrl = formData.cropImageUrl;
      }

      

      if (formData.desiredPricePerKg && !isNaN(parseFloat(formData.desiredPricePerKg))) {
        payload.desiredPricePerKg = parseFloat(formData.desiredPricePerKg);
      }

      console.log('Submitting warehouse access request:', payload);
      await dataService.createWarehouseAccess(payload);
      toast.success('Warehouse access application submitted successfully!');
      navigate('/farmer/dashboard');
    } catch (error) {
      console.error('Error submitting warehouse access:', error);
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Failed to submit application';
      toast.error(errorMessage);

      

      if (error.response?.data) {
        console.error('Error details:', error.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <Sidebar />
      <div className="form-layout-wrapper">
        <DashboardHeader title="Apply for Warehouse Access" subtitle="Submit an application to access a warehouse for storing your crops" />
        <div className="form-container">
          <div className="form-card">

          <form onSubmit={handleSubmit} className="form">
            <div className="form-group">
              <label htmlFor="warehouseId">Select Warehouse *</label>
              <select
                id="warehouseId"
                name="warehouseId"
                value={formData.warehouseId}
                onChange={handleChange}
                required
              >
                <option value="">Select a warehouse</option>
                {warehouses.length > 0 ? (
                  warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.warehouseName} - Available: {warehouse.availableCapacityKg} KG
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No warehouses available</option>
                )}
              </select>
              <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '5px' }}>
                Showing {warehouses.length} warehouse(s)
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="requestedCapacityKg">Requested Capacity (KG) *</label>
              <input
                type="number"
                id="requestedCapacityKg"
                name="requestedCapacityKg"
                value={formData.requestedCapacityKg}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="1000"
              />
              <small style={{ color: '#666', fontSize: '12px' }}>
                Enter the amount of storage capacity you need in kilograms
              </small>
            </div>

            <div className="form-section-divider">
              <h3>Crop Information</h3>
              <p style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                Provide details about the crop you want to store. The storekeeper will use this information to insert it into the warehouse.
              </p>
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
                <label htmlFor="cropQuantityKg">Crop Quantity (KG) *</label>
                <input
                  type="number"
                  id="cropQuantityKg"
                  name="cropQuantityKg"
                  value={formData.cropQuantityKg}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="500"
                />
              </div>
            </div>

            <div className="form-row">
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

              <div className="form-group">
                <label htmlFor="expectedStorageDate">Expected Storage Date</label>
                <input
                  type="date"
                  id="expectedStorageDate"
                  name="expectedStorageDate"
                  value={formData.expectedStorageDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="expectedWithdrawalDate">Expected Withdrawal Date</label>
              <input
                type="date"
                id="expectedWithdrawalDate"
                name="expectedWithdrawalDate"
                value={formData.expectedWithdrawalDate}
                onChange={handleChange}
                min={formData.expectedStorageDate || new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="form-group">
              <label htmlFor="cropNotes">Crop Notes</label>
              <textarea
                id="cropNotes"
                name="cropNotes"
                value={formData.cropNotes}
                onChange={handleChange}
                rows="3"
                placeholder="Additional information about the crop (harvest date, storage conditions, etc.)..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="cropImage">Crop Image</label>
              <input
                type="file"
                id="cropImage"
                name="cropImage"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    

                    if (file.size > 5 * 1024 * 1024) {
                      toast.error('File size must be less than 5MB');
                      e.target.value = ''; 

                      return;
                    }

                    

                    if (!file.type.startsWith('image/')) {
                      toast.error('File must be an image');
                      e.target.value = ''; 

                      return;
                    }

                    setCropImage(file);
                    setUploadingImage(true);
                    try {
                      const response = await dataService.uploadWarehouseAccessImage(file);
                      const imageUrl = response.data?.imageUrl || response.data;
                      if (imageUrl) {
                        setCropImageUrl(imageUrl);
                        setFormData({ ...formData, cropImageUrl: imageUrl });
                        toast.success('Image uploaded successfully');
                      } else {
                        throw new Error('No image URL returned from server');
                      }
                    } catch (error) {
                      console.error('Error uploading image:', error);
                      const errorMessage = error.response?.data?.error ||
                        error.response?.data?.message ||
                        error.message ||
                        'Failed to upload image. Please try again.';
                      toast.error(errorMessage);
                      setCropImage(null);
                      setCropImageUrl('');
                      setFormData({ ...formData, cropImageUrl: '' });
                      e.target.value = ''; 

                    } finally {
                      setUploadingImage(false);
                    }
                  }
                }}
                disabled={uploadingImage}
              />
              {uploadingImage && <small style={{ color: '#666' }}>Uploading image...</small>}
              {cropImageUrl && (
                <div style={{ marginTop: '10px' }}>
                  <img
                    src={cropImageUrl.startsWith('http') ? cropImageUrl : `${process.env.REACT_APP_BACKEND_URL ?? 'http://localhost:8081'}${cropImageUrl}`}
                    alt="Crop preview"
                    style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '8px', border: '1px solid #ddd' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCropImage(null);
                      setCropImageUrl('');
                      setFormData({ ...formData, cropImageUrl: '' });
                    }}
                    style={{ marginLeft: '10px', padding: '5px 10px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Remove
                  </button>
                </div>
              )}
              <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '5px' }}>
                Upload a picture of your crop to help buyers identify what they're purchasing (max 5MB)
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Additional Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                placeholder="Any additional information about your storage needs..."
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => navigate('/farmer/dashboard')}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Send size={18} />
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarehouseAccessApplication;

