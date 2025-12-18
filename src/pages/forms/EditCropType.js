import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import Sidebar from '../../components/layout/Sidebar';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import './Form.css';

const EditCropType = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState({
    cropCode: '',
    cropName: '',
    category: 'CEREALS',
    measurementUnit: 'KG',
    description: '',
    pricePerKg: '',
    imageUrl: '',
  });

  useEffect(() => {
    if (user?.userType !== 'ADMIN') {
      toast.error('Only admins can edit crop types');
      navigate('/dashboard');
      return;
    }
    fetchCropType();
  }, [user, navigate, id]);

  const fetchCropType = async () => {
    try {
      const response = await dataService.getCropTypeById(id);
      const crop = response.data;
      setFormData({
        cropCode: crop.cropCode || '',
        cropName: crop.cropName || '',
        category: crop.category || 'CEREALS',
        measurementUnit: crop.measurementUnit || 'KG',
        description: crop.description || '',
        pricePerKg: crop.pricePerKg || '',
        imageUrl: crop.imageUrl || '',
      });
    } catch (error) {
      toast.error('Failed to load crop type');
      navigate('/crop-types');
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
      toast.success('Image loaded. Note: In production, upload to cloud storage.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    try {
      const cropData = {
        cropCode: formData.cropCode,
        cropName: formData.cropName,
        category: formData.category,
        measurementUnit: formData.measurementUnit,
        description: formData.description,
        pricePerKg: formData.pricePerKg ? parseFloat(formData.pricePerKg) : null,
        imageUrl: formData.imageUrl || null,
      };
      
      await dataService.updateCropType(id, cropData);
      toast.success('Crop type updated successfully!');
      navigate('/crop-types');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update crop type');
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
        <DashboardHeader title="Edit Crop Type" subtitle="Update crop type information" />
        <div className="form-card">
          <form onSubmit={handleSubmit} className="form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="cropCode">Crop Code *</label>
                <input
                  type="text"
                  id="cropCode"
                  name="cropCode"
                  value={formData.cropCode}
                  onChange={handleChange}
                  required
                  placeholder="e.g., CRP-MAI"
                />
              </div>

              <div className="form-group">
                <label htmlFor="cropName">Crop Name *</label>
                <input
                  type="text"
                  id="cropName"
                  name="cropName"
                  value={formData.cropName}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Maize"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="CEREALS">Cereals</option>
                  <option value="LEGUMES">Legumes</option>
                  <option value="TUBERS">Tubers</option>
                  <option value="VEGETABLES">Vegetables</option>
                  <option value="FRUITS">Fruits</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="measurementUnit">Measurement Unit *</label>
                <select
                  id="measurementUnit"
                  name="measurementUnit"
                  value={formData.measurementUnit}
                  onChange={handleChange}
                  required
                >
                  <option value="KG">Kilograms (KG)</option>
                  <option value="TON">Tons</option>
                  <option value="BAG">Bags</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="pricePerKg">Price per {formData.measurementUnit} (RWF) *</label>
                <input
                  type="number"
                  id="pricePerKg"
                  name="pricePerKg"
                  value={formData.pricePerKg}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="1000"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="imageUrl">Crop Image URL</label>
              <input
                type="text"
                id="imageUrl"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="https://example.com/crop-image.jpg"
              />
              <small style={{ color: '#666', fontSize: '12px' }}>
                Or upload image file (converts to base64)
              </small>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ marginTop: '8px' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder="Crop description..."
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => navigate('/crop-types')}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Save size={18} />
                {loading ? 'Updating...' : 'Update Crop Type'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditCropType;

