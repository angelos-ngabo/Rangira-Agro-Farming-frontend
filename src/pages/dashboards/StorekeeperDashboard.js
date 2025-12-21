import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/common/Button';
import NotificationBell from '../../components/dashboard/NotificationBell';
import { Warehouse, Package, Eye, Pencil, X, XCircle, CheckCircle, Image, DollarSign, Mail, Edit } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { dataService as api } from '../../services/dataService';
import '../Dashboard.css';

const StorekeeperDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const [selectedInventory, setSelectedInventory] = useState(null);
  const [showEditInventoryModal, setShowEditInventoryModal] = useState(false);
  const [editCropImageUrl, setEditCropImageUrl] = useState('');
  const [editQuantityKg, setEditQuantityKg] = useState('');
  const [editRemainingQuantityKg, setEditRemainingQuantityKg] = useState('');
  const [editDesiredPricePerKg, setEditDesiredPricePerKg] = useState('');

  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [replyToNote, setReplyToNote] = useState(null); // To store the note being replied to

  // Fetch warehouse assigned to storekeeper
  const { data: warehouseData, isLoading: warehouseLoading, error: warehouseError } = useQuery({
    queryKey: ['storekeeperWarehouse', user?.id],
    queryFn: async () => {
      const response = await api.getWarehouses({ storekeeperId: user?.id });
      return response.data?.content || response.data || [];
    },
    enabled: !!user?.id,
    onSuccess: (data) => {
      setSelectedWarehouse(data);
    },
    onError: (err) => {
      console.error("Error fetching storekeeper's warehouse:", err);
      toast.error("Failed to load warehouse data.");
    }
  });

  // Fetch pending applications for the assigned warehouse
  const { data: applicationsData, isLoading: applicationsLoading, error: applicationsError } = useQuery({
    queryKey: ['pendingApplications', selectedWarehouse?.id],
    queryFn: async () => {
      const response = await api.getWarehouseAccesses({
        warehouseId: selectedWarehouse?.id,
        status: 'PENDING'
      });
      return response.data || [];
    },
    enabled: !!selectedWarehouse?.id,
    onError: (err) => {
      console.error("Error fetching pending applications:", err);
      toast.error("Failed to load pending applications.");
    }
  });

  const pendingApplications = applicationsData?.filter(app => app.status === 'PENDING');

  // Fetch warehouse inventory
  const { data: inventoryData, isLoading: inventoryLoading, error: inventoryError } = useQuery({
    queryKey: ['warehouseInventory', selectedWarehouse?.id],
    queryFn: async () => {
      const response = await api.getInventories({ warehouseId: selectedWarehouse?.id });
      return response.data?.content || response.data || [];
    },
    enabled: !!selectedWarehouse?.id,
    onError: (err) => {
      console.error("Error fetching warehouse inventory:", err);
      toast.error("Failed to load warehouse inventory.");
    }
  });

  const warehouseInventory = inventoryData;

  // Mutation for approving an application
  const approveApplicationMutation = useMutation({
    mutationFn: async ({ applicationId }) => {
      const response = await api.updateWarehouseAccessStatus(applicationId, 'APPROVED');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pendingApplications', selectedWarehouse?.id]);
      queryClient.invalidateQueries(['warehouseInventory', selectedWarehouse?.id]);
      queryClient.invalidateQueries(['storekeeperWarehouse', user?.id]); // Invalidate warehouse capacity
      toast.success('Application approved and inventory added!');
    },
    onError: (error) => {
      console.error('Error approving application:', error);
      toast.error(`Failed to approve application: ${error.response?.data?.message || error.message}`);
    }
  });

  const handleApproveApplication = (applicationId) => {
    approveApplicationMutation.mutate({ applicationId });
  };

  // Mutation for rejecting an application
  const rejectApplicationMutation = useMutation({
    mutationFn: async (applicationId) => {
      const response = await api.updateWarehouseAccessStatus(applicationId, 'REJECTED');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pendingApplications', selectedWarehouse?.id]);
      toast.success('Application rejected!');
    },
    onError: (error) => {
      console.error('Error rejecting application:', error);
      toast.error(`Failed to reject application: ${error.response?.data?.message || error.message}`);
    }
  });

  const handleRejectApplication = (applicationId) => {
    rejectApplicationMutation.mutate(applicationId);
  };

  // Mutation for updating inventory
  const updateInventoryMutation = useMutation({
    mutationFn: async (updateData) => {
      const response = await api.updateInventory(selectedInventory.id, updateData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['warehouseInventory', selectedWarehouse?.id]);
      toast.success('Inventory updated successfully!');
      setShowEditInventoryModal(false);
      setSelectedInventory(null);
    },
    onError: (error) => {
      console.error('Error updating inventory:', error);
      toast.error(`Failed to update inventory: ${error.response?.data?.message || error.message}`);
    }
  });

  // Mutation for sending a message
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      const response = await api.sendMessage(messageData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Message sent successfully!');
      setShowMessageModal(false);
      setSelectedFarmer(null);
      setMessageSubject('');
      setMessageContent('');
      setReplyToNote(null);
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast.error(`Failed to send message: ${error.response?.data?.message || error.message}`);
    }
  });

  const handleSubmitMessage = (e) => {
    e.preventDefault();
    if (!selectedFarmer || !messageSubject || !messageContent) {
      toast.error('Please fill all message fields.');
      return;
    }

    const messageData = {
      senderId: user.id,
      receiverId: selectedFarmer.id,
      subject: messageSubject,
      content: messageContent,
      relatedTo: replyToNote ? 'APPLICATION_NOTE' : 'GENERAL',
      relatedId: replyToNote ? replyToNote.id : null,
    };

    sendMessageMutation.mutate(messageData);
  };

  return (
    <>
      <div className="dashboard">
        <Sidebar />
        <div className="dashboard-container">
          <div className="dashboard-header">
            <div className="header-left">
              <h1>Storekeeper Dashboard</h1>
              <p>Welcome back, {user?.firstName}!</p>
            </div>
            <div className="header-right">
              <NotificationBell />
              {selectedWarehouse && (
                <div className="warehouse-badge">
                  <Warehouse size={18} />
                  <span>{selectedWarehouse.warehouseName}</span>
                </div>
              )}
            </div>
          </div>

          {warehouseLoading ? (
            <div className="loading-state">
              <div className="loader"></div>
              <p>Loading warehouse data...</p>
            </div>
          ) : selectedWarehouse ? (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: '#2ea35920' }}>
                    <Warehouse size={24} style={{ color: '#2ea359' }} />
                  </div>
                  <div className="stat-content">
                    <h3>Total Capacity</h3>
                    <p className="stat-value">{(selectedWarehouse.totalCapacityKg || 0).toLocaleString()} KG</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: '#3b82f620' }}>
                    <Package size={24} style={{ color: '#3b82f6' }} />
                  </div>
                  <div className="stat-content">
                    <h3>Available Capacity</h3>
                    <p className="stat-value">{(selectedWarehouse.availableCapacityKg || 0).toLocaleString()} KG</p>
                  </div>
                </div>
              </div>

              <div className="dashboard-sections">
                <div className="dashboard-section">
                  <h2>Pending Access Requests</h2>
                  {applicationsLoading ? (
                    <p>Loading applications...</p>
                  ) : pendingApplications && pendingApplications.length > 0 ? (
                    <div className="applications-list">
                      {pendingApplications.map((app) => (
                        <div key={app.id} className="application-card">
                          <div className="application-info">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                              <h4>{app.user?.firstName} {app.user?.lastName}</h4>
                              <Button
                                variant="outline"
                                size="small"
                                icon={Eye}
                                onClick={() => {
                                  setSelectedApplication(app);
                                  setShowReviewModal(true);
                                }}
                              >
                                Review Details
                              </Button>
                            </div>
                            <p><strong>Crop:</strong> {app.cropType?.cropName}</p>
                            <p><strong>Quantity:</strong> {app.cropQuantityKg} KG</p>
                            <p><strong>Status:</strong> <span className={`badge badge-${app.status?.toLowerCase()}`}>{app.status}</span></p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No pending applications</p>
                  )}
                </div>

                <div className="dashboard-section">
                  <h2>Warehouse Inventory</h2>
                  {inventoryLoading ? (
                    <p>Loading inventory...</p>
                  ) : warehouseInventory && warehouseInventory.length > 0 ? (
                    <div className="inventory-list">
                      {warehouseInventory.map((item) => (
                        <div key={item.id} className="inventory-item">
                          <div>
                            {item.cropImageUrl && (
                              <img
                                src={item.cropImageUrl.startsWith('http') ? item.cropImageUrl : `http://localhost:8080${item.cropImageUrl}`}
                                alt={item.cropType?.cropName || 'Crop'}
                                style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }}
                              />
                            )}
                            <h4>{item.cropType?.cropName || 'Unknown Crop'}</h4>
                            <p><strong>Code:</strong> {item.inventoryCode}</p>
                            <p><strong>Farmer:</strong> {item.farmer?.firstName} {item.farmer?.lastName}</p>
                            <p><strong>Quantity:</strong> {item.quantityKg} {item.cropType?.measurementUnit || 'KG'}</p>
                            <p><strong>Remaining:</strong> {item.remainingQuantityKg} {item.cropType?.measurementUnit || 'KG'}</p>
                            <p><strong>Grade:</strong> {item.qualityGrade}</p>
                            <p><strong>Status:</strong> <span className={`badge badge-${item.status?.toLowerCase()}`}>{item.status}</span></p>
                            {item.storageDate && (
                              <p><strong>Storage Date:</strong> {new Date(item.storageDate).toLocaleDateString()}</p>
                            )}
                            <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                              <Button
                                variant="outline"
                                size="small"
                                icon={Pencil}
                                onClick={() => {
                                  setSelectedInventory(item);
                                  setEditCropImageUrl(item.cropImageUrl || '');
                                  setEditQuantityKg(item.quantityKg || '');
                                  setEditRemainingQuantityKg(item.remainingQuantityKg || '');
                                  setEditDesiredPricePerKg(item.cropType?.pricePerKg || '');
                                  setShowEditInventoryModal(true);
                                }}
                              >
                                Edit
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                      <Package size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                      <p>No inventory in this warehouse</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="no-warehouse">
              <Warehouse size={48} />
              <p>No warehouse assigned to you yet.</p>
              <p>Please contact an administrator.</p>
            </div>
          )}
        </div>
      </div>

      {/* Message Modal */}
      {showMessageModal && (
        <div className="message-modal" onClick={(e) => {
          if (e.target.className === 'message-modal') {
            setShowMessageModal(false);
          }
        }}>
          <div className="message-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="message-modal-header">
              <h3>
                {replyToNote ? 'Reply to Farmer' : 'Send Message to Farmer'}
              </h3>
              <Button
                variant="outline"
                size="small"
                className="message-modal-close"
                onClick={() => {
                  setShowMessageModal(false);
                  setSelectedFarmer(null);
                  setMessageSubject('');
                  setMessageContent('');
                  setReplyToNote(null);
                }}
                icon={X}
              />
            </div>

            {selectedFarmer && (
              <div style={{ marginBottom: '16px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  <strong>To:</strong> {selectedFarmer.firstName} {selectedFarmer.lastName} ({selectedFarmer.email})
                </p>
              </div>
            )}

            <form className="message-form" onSubmit={handleSubmitMessage}>
              <div className="message-form-group">
                <label htmlFor="messageSubject">Subject *</label>
                <input
                  type="text"
                  id="messageSubject"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  placeholder="Enter message subject"
                  required
                />
              </div>

              <div className="message-form-group">
                <label htmlFor="messageContent">Message *</label>
                <textarea
                  id="messageContent"
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Enter your message..."
                  required
                />
              </div>

              <div className="message-form-actions">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowMessageModal(false);
                    setSelectedFarmer(null);
                    setMessageSubject('');
                    setMessageContent('');
                    setReplyToNote(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={sendMessageMutation.isLoading}
                  icon={Mail}
                >
                  {sendMessageMutation.isLoading ? 'Sending...' : 'Send Message'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedApplication && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Review Warehouse Access Request</h2>
              <Button variant="outline" size="small" className="modal-close" onClick={() => setShowReviewModal(false)} icon={X} />
            </div>
            <div className="modal-body">
              <div className="review-section">
                <h3>Farmer Information</h3>
                <p><strong>Name:</strong> {selectedApplication.user?.firstName} {selectedApplication.user?.lastName}</p>
                <p><strong>Email:</strong> {selectedApplication.user?.email}</p>
                <p><strong>Phone:</strong> {selectedApplication.user?.phoneNumber || 'N/A'}</p>
              </div>

              <div className="review-section">
                <h3>Request Details</h3>
                <p><strong>Requested Capacity:</strong> {selectedApplication.requestedCapacityKg} KG</p>
                <p><strong>Available Capacity:</strong> {selectedWarehouse?.availableCapacityKg} KG</p>
                <p><strong>Status:</strong> {selectedApplication.status}</p>
                <p><strong>Request Date:</strong> {selectedApplication.createdAt ? new Date(selectedApplication.createdAt).toLocaleDateString() : 'N/A'}</p>
                {selectedApplication.notes && (
                  <p><strong>Notes:</strong> {selectedApplication.notes}</p>
                )}
              </div>

              {selectedApplication.cropType && (
                <div className="review-section">
                  <h3>Crop Information</h3>
                  <p><strong>Crop Type:</strong> {selectedApplication.cropType?.cropName} ({selectedApplication.cropType?.category})</p>
                  <p><strong>Quantity:</strong> {selectedApplication.cropQuantityKg} {selectedApplication.cropType?.measurementUnit || 'KG'}</p>
                  <p><strong>Quality Grade:</strong> {selectedApplication.qualityGrade}</p>
                  {selectedApplication.expectedStorageDate && (
                    <p><strong>Expected Storage Date:</strong> {new Date(selectedApplication.expectedStorageDate).toLocaleDateString()}</p>
                  )}
                  {selectedApplication.expectedWithdrawalDate && (
                    <p><strong>Expected Withdrawal Date:</strong> {new Date(selectedApplication.expectedWithdrawalDate).toLocaleDateString()}</p>
                  )}
                  {selectedApplication.cropNotes && (
                    <p><strong>Crop Notes:</strong> {selectedApplication.cropNotes}</p>
                  )}

                  {selectedApplication.cropImageUrl && (
                    <div style={{ marginTop: '16px' }}>
                      <h4>Crop Image</h4>
                      <img
                        src={selectedApplication.cropImageUrl.startsWith('http')
                          ? selectedApplication.cropImageUrl
                          : `http://localhost:8080${selectedApplication.cropImageUrl}`}
                        alt="Crop"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '400px',
                          borderRadius: '8px',
                          border: '1px solid #ddd',
                          marginTop: '8px'
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="modal-actions" style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <Button variant="outline" onClick={() => setShowReviewModal(false)}>
                  Close
                </Button>
                <Button
                  variant="danger"
                  icon={XCircle}
                  onClick={() => {
                    handleRejectApplication(selectedApplication.id);
                    setShowReviewModal(false);
                  }}
                >
                  Reject
                </Button>
                <Button
                  variant="success"
                  icon={CheckCircle}
                  onClick={() => {
                    handleApproveApplication(selectedApplication.id);
                    setShowReviewModal(false);
                  }}
                >
                  Approve & Add to Warehouse
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Inventory Modal */}
      {showEditInventoryModal && selectedInventory && (
        <div className="modal-overlay" onClick={() => setShowEditInventoryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>Edit Inventory</h2>
              <Button variant="outline" size="small" className="modal-close" onClick={() => setShowEditInventoryModal(false)} icon={X} />
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '16px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                <p><strong>Crop:</strong> {selectedInventory.cropType?.cropName || 'Unknown'}</p>
                <p><strong>Inventory Code:</strong> {selectedInventory.inventoryCode}</p>
                <p><strong>Farmer:</strong> {selectedInventory.farmer?.firstName} {selectedInventory.farmer?.lastName}</p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const updateData = {};
                if (editCropImageUrl.trim()) updateData.cropImageUrl = editCropImageUrl.trim();
                if (editQuantityKg) updateData.quantityKg = parseFloat(editQuantityKg);
                if (editRemainingQuantityKg) updateData.remainingQuantityKg = parseFloat(editRemainingQuantityKg);
                if (editDesiredPricePerKg) updateData.desiredPricePerKg = parseFloat(editDesiredPricePerKg);

                if (Object.keys(updateData).length === 0) {
                  toast.error('Please enter at least one field to update');
                  return;
                }

                updateInventoryMutation.mutate(updateData);
              }}>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label htmlFor="editCropImageUrl">
                    <Image size={16} style={{ display: 'inline', marginRight: '4px' }} />
                    Crop Image URL
                  </label>
                  <input
                    type="text"
                    id="editCropImageUrl"
                    value={editCropImageUrl}
                    onChange={(e) => setEditCropImageUrl(e.target.value)}
                    placeholder="Enter image URL"
                  />
                  <small style={{ color: '#666', fontSize: '12px' }}>Leave empty to keep current image</small>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label htmlFor="editQuantityKg">Stock Quantity ({selectedInventory.cropType?.measurementUnit || 'KG'})</label>
                  <input
                    type="number"
                    id="editQuantityKg"
                    value={editQuantityKg}
                    onChange={(e) => setEditQuantityKg(e.target.value)}
                    placeholder="Enter new quantity"
                    min="0"
                    step="0.01"
                  />
                  <small style={{ color: '#666', fontSize: '12px' }}>Current: {selectedInventory.quantityKg} {selectedInventory.cropType?.measurementUnit || 'KG'}</small>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label htmlFor="editRemainingQuantityKg">Remaining Quantity ({selectedInventory.cropType?.measurementUnit || 'KG'})</label>
                  <input
                    type="number"
                    id="editRemainingQuantityKg"
                    value={editRemainingQuantityKg}
                    onChange={(e) => setEditRemainingQuantityKg(e.target.value)}
                    placeholder="Enter remaining quantity"
                    min="0"
                    step="0.01"
                  />
                  <small style={{ color: '#666', fontSize: '12px' }}>Current: {selectedInventory.remainingQuantityKg} {selectedInventory.cropType?.measurementUnit || 'KG'}</small>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label htmlFor="editDesiredPricePerKg">
                    <DollarSign size={16} style={{ display: 'inline', marginRight: '4px' }} />
                    Desired Price Per {selectedInventory.cropType?.measurementUnit || 'KG'} (RWF)
                  </label>
                  <input
                    type="number"
                    id="editDesiredPricePerKg"
                    value={editDesiredPricePerKg}
                    onChange={(e) => setEditDesiredPricePerKg(e.target.value)}
                    placeholder="Enter desired price"
                    min="0"
                    step="0.01"
                  />
                  <small style={{ color: '#666', fontSize: '12px' }}>Current: RWF {selectedInventory.cropType?.pricePerKg?.toLocaleString() || '0'}</small>
                </div>

                <div className="modal-actions" style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <Button
                    variant="outline"
                    icon={X}
                    onClick={() => {
                      setShowEditInventoryModal(false);
                      setSelectedInventory(null);
                    }}
                    disabled={updateInventoryMutation.isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    icon={Edit}
                    disabled={updateInventoryMutation.isLoading}
                  >
                    {updateInventoryMutation.isLoading ? 'Updating...' : 'Update Inventory'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StorekeeperDashboard;
