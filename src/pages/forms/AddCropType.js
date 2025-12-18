import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import Sidebar from '../../components/layout/Sidebar';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import './Form.css';

const AddCropType = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    cropCode: '',
    cropName: '',
    category: 'CEREALS',
    measurementUnit: 'KG',
    description: '',
    pricePerKg: '',
    imageUrl: '',
  });

  React.useEffect(() => {
    if (user?.userType !== 'ADMIN') {
      toast.error('Only admins can add crop types');
      navigate('/dashboard');
    }
  }, [user, navigate]);


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

      await dataService.createCropType(cropData);
      toast.success('Crop type created successfully!');
      navigate('/crop-types');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create crop type');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <Sidebar />
      <div className="form-layout-wrapper">
        <DashboardHeader title="Add Crop Type" subtitle="Create a new crop type in the system" />
        <div className="form-container">
          <div className="form-card">
            <h1>Add New Crop Type</h1>
            <p className="form-subtitle">Create a new crop type in the system</p>
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
                <Plus size={18} />
                {loading ? 'Creating...' : 'Create Crop Type'}
              </button>
            </div>
          </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCropType;

