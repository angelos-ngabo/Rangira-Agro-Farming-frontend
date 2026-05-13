import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient, useMutation } from 'react-query';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import Sidebar from '../../components/layout/Sidebar';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import { useQuery } from 'react-query';
import toast from 'react-hot-toast';
import { Package, Edit, LogOut, Upload, Send } from 'lucide-react';
import './Form.css';

const InventoryRequestForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [inventories, setInventories] = useState([]);
  const [requestType, setRequestType] = useState('UPDATE'); 

  const [cropImage, setCropImage] = useState(null);
  const [cropImageUrl, setCropImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    inventoryId: '',
    requestType: 'UPDATE',
    

    newCropImageUrl: '',
    newPricePerKg: '',
    newNotes: '',
    

    withdrawalQuantityKg: '',
    withdrawalDate: '',
    

    farmerNotes: '',
  });

  

  const { data: inventoriesData, isLoading: inventoriesLoading } = useQuery(
    ['farmerInventories', user?.id],
    async () => {
      if (!user?.id) return [];
      try {
        

        const response = await dataService.getInventories({ 
          farmerId: user.id,
          page: 0,
          size: 1000
        });
        const data = response.data?.content || response.data || [];
        

        

        return data.filter(inv => {
          const hasRemaining = parseFloat(inv.remainingQuantityKg || 0) > 0;
          const isStoredOrPartiallySold = inv.status === 'STORED' || inv.status === 'PARTIALLY_SOLD';
          const belongsToFarmer = inv.farmer?.id === user.id || inv.farmer?.id === parseInt(user.id);
          return belongsToFarmer && hasRemaining && isStoredOrPartiallySold;
        });
      } catch (error) {
        console.error('Error fetching inventories:', error);
        toast.error('Failed to load inventories');
        return [];
      }
    },
    { enabled: !!user?.id && user?.userType === 'FARMER', refetchOnWindowFocus: true }
  );

  useEffect(() => {
    if (inventoriesData) {
      setInventories(inventoriesData);
    }
  }, [inventoriesData]);

  useEffect(() => {
    if (user?.userType !== 'FARMER') {
      toast.error('Only farmers can create inventory requests');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRequestTypeChange = (e) => {
    const newType = e.target.value;
    setRequestType(newType);
    setFormData(prev => ({
      ...prev,
      requestType: newType,
      

      newCropImageUrl: '',
      newPricePerKg: '',
      newNotes: '',
      withdrawalQuantityKg: '',
      withdrawalDate: '',
    }));
    setCropImageUrl('');
    setCropImage(null);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await dataService.uploadWarehouseAccessImage(file);
      

      let imageUrl = null;
      if (typeof response.data === 'string') {
        imageUrl = response.data;
      } else if (response.data?.url) {
        imageUrl = response.data.url;
      } else if (response.data?.imageUrl) {
        imageUrl = response.data.imageUrl;
      } else if (response.data?.cropImageUrl) {
        imageUrl = response.data.cropImageUrl;
      } else if (response.data) {
        imageUrl = response.data;
      }
      
      if (!imageUrl || typeof imageUrl !== 'string') {
        throw new Error('Invalid image URL received from server');
      }
      
      setCropImageUrl(imageUrl);
      setFormData(prev => ({ ...prev, newCropImageUrl: imageUrl }));
      toast.success('Image uploaded successfully! Preview the image below before submitting.');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const createRequestMutation = useMutation(
    (data) => dataService.createInventoryRequest(data),
    {
      onSuccess: () => {
        toast.success('Inventory request submitted successfully! The storekeeper will be notified.');
        queryClient.invalidateQueries('farmerInventories');
        queryClient.invalidateQueries('myInventoryRequests');
        navigate('/farmer/dashboard');
      },
      onError: (error) => {
        const message = error.response?.data?.message || error.message || 'Failed to submit request';
        toast.error(message);
      }
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.inventoryId) {
      toast.error('Please select an inventory');
      return;
    }

    if (requestType === 'UPDATE') {
      if (!formData.newCropImageUrl && !formData.newPricePerKg && !formData.newNotes) {
        toast.error('Please provide at least one field to update (image, price, or notes)');
        return;
      }
    } else if (requestType === 'WITHDRAWAL') {
      if (!formData.withdrawalQuantityKg || parseFloat(formData.withdrawalQuantityKg) <= 0) {
        toast.error('Please specify withdrawal quantity');
        return;
      }
      
      const selectedInventory = inventories.find(inv => inv.id === parseInt(formData.inventoryId));
      if (selectedInventory && parseFloat(formData.withdrawalQuantityKg) > selectedInventory.remainingQuantityKg) {
        toast.error(`Withdrawal quantity cannot exceed remaining quantity (${selectedInventory.remainingQuantityKg} KG)`);
        return;
      }
    }

    setLoading(true);
    try {
      const requestPayload = {
        inventoryId: parseInt(formData.inventoryId),
        requestType: requestType,
      };

      

      if (formData.farmerNotes && typeof formData.farmerNotes === 'string' && formData.farmerNotes.trim() !== '') {
        requestPayload.farmerNotes = formData.farmerNotes.trim();
      }

      if (requestType === 'UPDATE') {
        

        if (formData.newCropImageUrl && typeof formData.newCropImageUrl === 'string' && formData.newCropImageUrl.trim() !== '') {
          requestPayload.newCropImageUrl = formData.newCropImageUrl.trim();
        }
        if (formData.newPricePerKg && formData.newPricePerKg !== '') {
          const price = parseFloat(formData.newPricePerKg);
          if (!isNaN(price) && price > 0) {
            requestPayload.newPricePerKg = price;
          }
        }
        if (formData.newNotes && formData.newNotes.trim() !== '') {
          requestPayload.newNotes = formData.newNotes.trim();
        }
      } else {
        

        if (formData.withdrawalQuantityKg && formData.withdrawalQuantityKg !== '') {
          const quantity = parseFloat(formData.withdrawalQuantityKg);
          if (!isNaN(quantity) && quantity > 0) {
            requestPayload.withdrawalQuantityKg = quantity;
          }
        }
        if (formData.withdrawalDate && formData.withdrawalDate.trim() !== '') {
          requestPayload.withdrawalDate = formData.withdrawalDate.trim();
        }
      }

      await createRequestMutation.mutateAsync(requestPayload);
    } catch (error) {
      console.error('Error submitting request:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedInventory = inventories.find(inv => inv.id === parseInt(formData.inventoryId));

  

  const getImageUrl = (url) => {
    if (!url || typeof url !== 'string' || url.trim() === '') {
      return '';
    }
    if (url.startsWith('http')) {
      return url;
    }
    if (url.startsWith('/api/')) {
      return `${process.env.REACT_APP_BACKEND_URL ?? 'http://localhost:8081'}${url}`;
    }
    return `${process.env.REACT_APP_API_URL ?? 'http://localhost:8081/api'}/files/${url}`;
  };

  return (
    <div className="form-page">
      <Sidebar />
      <div className="form-layout-wrapper">
        <DashboardHeader 
          title={requestType === 'UPDATE' ? 'Update Inventory Request' : 'Withdraw Inventory Request'}
          subtitle={requestType === 'UPDATE' 
            ? 'Request to update inventory details (price, image, or notes)'
            : 'Request to withdraw inventory from warehouse'}
        />
        <div className="form-container">
          <div className="form-card">
          
          <form onSubmit={handleSubmit} className="form">
            <div className="form-group">
              <label htmlFor="inventoryId">Select Inventory *</label>
              <select
                id="inventoryId"
                name="inventoryId"
                value={formData.inventoryId}
                onChange={handleChange}
                required
                disabled={inventoriesLoading}
              >
                <option value="">Select an inventory...</option>
                {inventories.map((inventory) => (
                  <option key={inventory.id} value={inventory.id}>
                    {inventory.inventoryCode} - {inventory.cropType?.cropName} 
                    ({inventory.remainingQuantityKg} KG remaining)
                  </option>
                ))}
              </select>
              {inventoriesLoading && <small>Loading inventories...</small>}
              {!inventoriesLoading && inventories.length === 0 && (
                <small style={{ color: '#d32f2f' }}>No stored inventory available</small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="requestType">Request Type *</label>
              <select
                id="requestType"
                name="requestType"
                value={requestType}
                onChange={handleRequestTypeChange}
                required
              >
                <option value="UPDATE">Update Inventory (Price, Image, Notes)</option>
                <option value="WITHDRAWAL">Withdraw Inventory</option>
              </select>
            </div>

            {requestType === 'UPDATE' && (
              <>
                <div className="form-section-divider">
                  <h3>Update Details</h3>
                </div>

                <div className="form-group">
                  <label htmlFor="cropImage">New Crop Image</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                      type="file"
                      id="cropImage"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      style={{ padding: '8px' }}
                    />
                    {uploadingImage && <small>Uploading image...</small>}
                    {cropImageUrl && typeof cropImageUrl === 'string' && cropImageUrl.trim() !== '' && (
                      <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <img 
                          src={getImageUrl(cropImageUrl)} 
                          alt="Crop preview" 
                          style={{ 
                            maxWidth: '200px', 
                            maxHeight: '200px', 
                            borderRadius: '8px', 
                            border: '1px solid #ddd',
                            objectFit: 'cover',
                            display: 'block'
                          }}
                          onError={(e) => {
                            console.error('Image load error:', e);
                            e.target.style.display = 'none';
                            toast.error('Failed to load image preview');
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setCropImageUrl('');
                            setFormData(prev => ({ ...prev, newCropImageUrl: '' }));
                          }}
                          style={{ 
                            padding: '6px 12px', 
                            fontSize: '12px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            width: 'fit-content'
                          }}
                        >
                          Remove Image
                        </button>
                      </div>
                    )}
                  </div>
                  <small style={{ color: '#666' }}>Upload a new image for this inventory (optional)</small>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="newPricePerKg">New Price per KG (RWF)</label>
                    <input
                      type="number"
                      id="newPricePerKg"
                      name="newPricePerKg"
                      value={formData.newPricePerKg}
                      onChange={handleChange}
                      min="1"
                      step="1"
                      placeholder={selectedInventory?.cropType?.pricePerKg ? `Current: ${selectedInventory.cropType.pricePerKg.toLocaleString()}` : 'Enter new price'}
                    />
                    <small style={{ color: '#666' }}>Leave empty to keep current price</small>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="newNotes">New Notes</label>
                  <textarea
                    id="newNotes"
                    name="newNotes"
                    value={formData.newNotes}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Enter updated notes for this inventory..."
                  />
                  <small style={{ color: '#666' }}>Leave empty to keep current notes</small>
                </div>
              </>
            )}

            {requestType === 'WITHDRAWAL' && (
              <>
                <div className="form-section-divider">
                  <h3>Withdrawal Details</h3>
                </div>

                {selectedInventory && (
                  <div style={{ 
                    background: '#f0f7ff', 
                    padding: '16px', 
                    borderRadius: '8px', 
                    marginBottom: '16px',
                    border: '1px solid #b3d9ff'
                  }}>
                    <p style={{ margin: '4px 0', fontWeight: '600' }}>Available Quantity:</p>
                    <p style={{ margin: '4px 0', fontSize: '18px', color: '#1976d2' }}>
                      {selectedInventory.remainingQuantityKg} KG
                    </p>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="withdrawalQuantityKg">Withdrawal Quantity (KG) *</label>
                    <input
                      type="number"
                      id="withdrawalQuantityKg"
                      name="withdrawalQuantityKg"
                      value={formData.withdrawalQuantityKg}
                      onChange={handleChange}
                      required={requestType === 'WITHDRAWAL'}
                      min="0.01"
                      max={selectedInventory?.remainingQuantityKg || ''}
                      step="0.01"
                      placeholder={`Max: ${selectedInventory?.remainingQuantityKg || 0} KG`}
                    />
                    {selectedInventory && (
                      <small style={{ color: '#666' }}>
                        Maximum: {selectedInventory.remainingQuantityKg} KG
                      </small>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="withdrawalDate">Expected Withdrawal Date</label>
                    <input
                      type="date"
                      id="withdrawalDate"
                      name="withdrawalDate"
                      value={formData.withdrawalDate}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <small style={{ color: '#666' }}>Optional: When you plan to withdraw</small>
                  </div>
                </div>
              </>
            )}

            <div className="form-section-divider">
              <h3>Additional Notes</h3>
            </div>

            <div className="form-group">
              <label htmlFor="farmerNotes">Your Notes / Reason for Request</label>
              <textarea
                id="farmerNotes"
                name="farmerNotes"
                value={formData.farmerNotes}
                onChange={handleChange}
                rows="4"
                placeholder={`Explain why you're making this ${requestType === 'UPDATE' ? 'update' : 'withdrawal'} request...`}
              />
              <small style={{ color: '#666' }}>Optional: Provide additional context for the storekeeper</small>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => navigate('/farmer/dashboard')}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={loading || inventoriesLoading || inventories.length === 0}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Send size={18} />
                {loading ? 'Submitting...' : `Submit ${requestType === 'UPDATE' ? 'Update' : 'Withdrawal'} Request`}
              </button>
            </div>
          </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryRequestForm;

