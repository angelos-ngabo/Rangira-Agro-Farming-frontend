import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import Sidebar from '../../components/layout/Sidebar';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import './Form.css';

const EditWarehouseAccess = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
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
  });

  useEffect(() => {
    if (user?.userType !== 'FARMER') {
      toast.error('Only farmers can edit warehouse access requests');
      navigate('/dashboard');
      return;
    }
    fetchWarehouses();
    fetchCropTypes();
    fetchApplication();
  }, [user, navigate, id]);

  const fetchApplication = async () => {
    try {
      setLoadingData(true);
      const response = await dataService.getWarehouseAccessById(id);
      const app = response.data || response;

      if (app.status !== 'PENDING') {
        toast.error('Only pending requests can be edited');
        navigate('/farmer/dashboard');
        return;
      }

      if (app.user?.id !== user?.id) {
        toast.error('You can only edit your own requests');
        navigate('/farmer/dashboard');
        return;
      }

      setFormData({
        warehouseId: app.warehouse?.id || '',
        requestedCapacityKg: app.requestedCapacityKg || '',
        cropTypeId: app.cropType?.id || '',
        cropQuantityKg: app.cropQuantityKg || '',
        qualityGrade: app.qualityGrade || 'A',
        expectedStorageDate: app.expectedStorageDate || '',
        expectedWithdrawalDate: app.expectedWithdrawalDate || '',
        cropNotes: app.cropNotes || '',
        notes: app.notes || '',
        cropImageUrl: app.cropImageUrl || '',
      });

      if (app.cropImageUrl) {
        setCropImageUrl(app.cropImageUrl);
      }
    } catch (error) {
      console.error('Error fetching application:', error);
      toast.error('Failed to load application details');
      navigate('/farmer/dashboard');
    } finally {
      setLoadingData(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await dataService.getWarehouses({ page: 0, size: 100, status: 'ACTIVE' });
      setWarehouses(response.data?.content || []);
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

    setLoading(true);
    try {
      if (!user?.id) {
        toast.error('User information is missing. Please log in again.');
        setLoading(false);
        return;
      }

      const payload = {
        userId: parseInt(user.id),
        warehouseId: parseInt(formData.warehouseId),
        requestedCapacityKg: formData.requestedCapacityKg ? parseFloat(formData.requestedCapacityKg) : null,
        cropTypeId: formData.cropTypeId ? parseInt(formData.cropTypeId) : null,
        cropQuantityKg: formData.cropQuantityKg ? parseFloat(formData.cropQuantityKg) : null,
        qualityGrade: formData.qualityGrade,
        expectedStorageDate: formData.expectedStorageDate || null,
        expectedWithdrawalDate: formData.expectedWithdrawalDate || null,
        cropNotes: formData.cropNotes || null,
        notes: formData.notes || null,
        cropImageUrl: formData.cropImageUrl || null,
      };

      console.log('Updating warehouse access request:', payload);
      await dataService.updateWarehouseAccess(id, payload);
      toast.success('Warehouse access request updated successfully!');
      navigate('/farmer/dashboard');
    } catch (error) {
      console.error('Error updating warehouse access:', error);
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Failed to update application';
      toast.error(errorMessage);
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
          <h1>Edit Warehouse Access Request</h1>
          <p className="form-subtitle">Update your warehouse access application details</p>

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
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.warehouseName} - Available: {warehouse.availableCapacityKg} KG
                  </option>
                ))}
              </select>
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
            </div>

            <div className="form-section-divider">
              <h3>Crop Information</h3>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="cropTypeId">Crop Type</label>
                <select
                  id="cropTypeId"
                  name="cropTypeId"
                  value={formData.cropTypeId}
                  onChange={handleChange}
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
                <label htmlFor="cropQuantityKg">Crop Quantity (KG)</label>
                <input
                  type="number"
                  id="cropQuantityKg"
                  name="cropQuantityKg"
                  value={formData.cropQuantityKg}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="500"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="qualityGrade">Quality Grade</label>
                <select
                  id="qualityGrade"
                  name="qualityGrade"
                  value={formData.qualityGrade}
                  onChange={handleChange}
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
                placeholder="Additional information about the crop..."
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
                    src={cropImageUrl.startsWith('http') ? cropImageUrl : `http://localhost:8080${cropImageUrl}`}
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
            </div>

            <div className="form-group">
              <label htmlFor="notes">Additional Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                placeholder="Any additional information..."
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => navigate('/farmer/dashboard')}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Save size={18} />
                {loading ? 'Updating...' : 'Update Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditWarehouseAccess;

