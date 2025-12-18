import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/common/Button';
import NotificationBell from '../../components/dashboard/NotificationBell';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import { Warehouse, Package, Eye, Pencil, X, XCircle, CheckCircle, Image, DollarSign, Mail, Edit, FileDown, CreditCard, Clock } from 'lucide-react';
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
  const [replyToNote, setReplyToNote] = useState(null); 


  

  const { data: warehouseData, isLoading: warehouseLoading, error: warehouseError } = useQuery({
    queryKey: ['storekeeperWarehouse', user?.id],
    queryFn: async () => {
      const response = await api.getWarehouses({ storekeeperId: user?.id });
      return response.data?.content || response.data || [];
    },
    enabled: !!user?.id,
    refetchInterval: 10000, 

    refetchOnWindowFocus: true,
    staleTime: 5000, 

    onSuccess: (data) => {
      if (data && data.length > 0) {
        const newWarehouse = data[0];
        

        if (!selectedWarehouse || selectedWarehouse.id !== newWarehouse.id) {
          setSelectedWarehouse(newWarehouse);
          

          queryClient.invalidateQueries(['pendingApplications']);
          queryClient.invalidateQueries(['warehouseInventory']);
        }
      } else if (selectedWarehouse) {
        

        setSelectedWarehouse(null);
        queryClient.invalidateQueries(['pendingApplications']);
        queryClient.invalidateQueries(['warehouseInventory']);
      }
    },
    onError: (err) => {
      console.error("Error fetching storekeeper's warehouse:", err);
      toast.error("Failed to load warehouse data.");
    }
  });

  

  useEffect(() => {
    const handleWarehouseAssignmentChange = () => {
      queryClient.invalidateQueries(['storekeeperWarehouse', user?.id]);
    };

    window.addEventListener('warehouse-assignment-changed', handleWarehouseAssignmentChange);
    
    

    const checkInterval = setInterval(() => {
      const lastUpdate = localStorage.getItem('warehouse-assignment-last-update');
      if (lastUpdate) {
        const updateTime = parseInt(lastUpdate);
        const now = Date.now();
        

        if (now - updateTime < 30000) {
          queryClient.invalidateQueries(['storekeeperWarehouse', user?.id]);
        }
      }
    }, 5000);

    return () => {
      window.removeEventListener('warehouse-assignment-changed', handleWarehouseAssignmentChange);
      clearInterval(checkInterval);
    };
  }, [queryClient, user?.id]);

  useEffect(() => {
    if (warehouseData && warehouseData.length > 0) {
      const newWarehouse = warehouseData[0];
      

      if (!selectedWarehouse || selectedWarehouse.id !== newWarehouse.id) {
        setSelectedWarehouse(newWarehouse);
      }
    } else if (warehouseData && warehouseData.length === 0 && selectedWarehouse) {
      

      setSelectedWarehouse(null);
    }
  }, [warehouseData]);

  

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

  

  const warehouseInventory = inventoryData?.filter(inv => {
    const hasRemaining = parseFloat(inv.remainingQuantityKg || 0) > 0;
    const isStoredOrPartiallySold = inv.status === 'STORED' || inv.status === 'PARTIALLY_SOLD';
    return hasRemaining && isStoredOrPartiallySold;
  }) || [];

  

  const { data: warehouseTransactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['warehouseTransactions', selectedWarehouse?.id, warehouseInventory.length],
    queryFn: async () => {
      if (!selectedWarehouse?.id || !inventoryData || inventoryData.length === 0) return [];
      try {
        

        const response = await api.getTransactions({ page: 0, size: 100 });
        const allTransactions = response.data?.content || response.data || [];
        

        const warehouseInventoryIds = inventoryData.map(inv => inv.id);
        return allTransactions.filter(t => 
          t.inventory && warehouseInventoryIds.includes(t.inventory.id)
        );
      } catch (error) {
        console.error('Error fetching transactions:', error);
        return [];
      }
    },
    enabled: !!selectedWarehouse?.id && !!inventoryData && inventoryData.length > 0,
    refetchInterval: 30000
  });

  

  const approveApplicationMutation = useMutation({
    mutationFn: async ({ applicationId }) => {
      const response = await api.updateWarehouseAccessStatus(applicationId, 'APPROVED');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pendingApplications', selectedWarehouse?.id]);
      queryClient.invalidateQueries(['warehouseInventory', selectedWarehouse?.id]);
      queryClient.invalidateQueries(['storekeeperWarehouse', user?.id]); 

      toast.success('Application approved and inventory added!');
    },
    onError: (error) => {
      console.error('Error approving application:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
      toast.error(`Failed to approve application: ${errorMessage}`);
      
      

      if (error.response?.status === 403) {
        console.error('Authorization failed. Storekeeper may not be properly assigned to warehouse.');
        console.error('Error details:', error.response?.data);
      }
    }
  });

  const handleApproveApplication = (applicationId) => {
    approveApplicationMutation.mutate({ applicationId });
  };

  

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

  const [uploadingImage, setUploadingImage] = useState(false);
  const [cropImageFile, setCropImageFile] = useState(null);
  const [cropImagePreview, setCropImagePreview] = useState('');

  const uploadImageMutation = useMutation({
    mutationFn: async (file) => {
      const response = await api.uploadWarehouseAccessImage(file);
      return response.data?.imageUrl || response.data;
    },
    onSuccess: (imageUrl) => {
      setEditCropImageUrl(imageUrl);
      setUploadingImage(false);
      toast.success('Image uploaded successfully!');
    },
    onError: (error) => {
      console.error('Error uploading image:', error);
      toast.error(`Failed to upload image: ${error.response?.data?.error || error.response?.data?.message || error.message}`);
      setUploadingImage(false);
    }
  });

  const updateInventoryMutation = useMutation({
    mutationFn: async (updateData) => {
      const response = await api.updateInventoryByStorekeeper(selectedInventory.id, updateData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['warehouseInventory', selectedWarehouse?.id]);
      toast.success('Inventory updated successfully!');
      setShowEditInventoryModal(false);
      setSelectedInventory(null);
      setEditCropImageUrl('');
      setEditQuantityKg('');
      setEditRemainingQuantityKg('');
      setEditDesiredPricePerKg('');
      setCropImageFile(null);
      setCropImagePreview('');
    },
    onError: (error) => {
      console.error('Error updating inventory:', error);
      toast.error(`Failed to update inventory: ${error.response?.data?.message || error.message}`);
    }
  });

  

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
          <DashboardHeader />

          {warehouseLoading ? (
            <div className="loading-state">
              <div className="loader"></div>
              <p>Loading warehouse data...</p>
            </div>
          ) : selectedWarehouse ? (
            <>
              {}
              <div style={{
                background: 'linear-gradient(135deg, #116530 0%, #2ea359 100%)',
                color: 'white',
                padding: '20px 24px',
                borderRadius: '12px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: '0 4px 12px rgba(17, 101, 48, 0.3)'
              }}>
                <Warehouse size={32} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '4px' }}>
                    Assigned Warehouse
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700' }}>
                    {selectedWarehouse.warehouseName}
                  </div>
                  {selectedWarehouse.location && (
                    <div style={{ fontSize: '14px', opacity: 0.9, marginTop: '4px' }}>
                      {selectedWarehouse.location.name}
                    </div>
                  )}
                </div>
              </div>

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
                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: '#f59e0b20' }}>
                    <Package size={24} style={{ color: '#f59e0b' }} />
                  </div>
                  <div className="stat-content">
                    <h3>Used Capacity</h3>
                    <p className="stat-value">
                      {selectedWarehouse.totalCapacityKg && selectedWarehouse.availableCapacityKg
                        ? (((selectedWarehouse.totalCapacityKg - selectedWarehouse.availableCapacityKg) / selectedWarehouse.totalCapacityKg) * 100).toFixed(1)
                        : 0}%
                    </p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: '#ef444420' }}>
                    <Package size={24} style={{ color: '#ef4444' }} />
                  </div>
                  <div className="stat-content">
                    <h3>Inventory Items</h3>
                    <p className="stat-value">{warehouseInventory?.length || 0}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: '#8b5cf620' }}>
                    <Package size={24} style={{ color: '#8b5cf6' }} />
                  </div>
                  <div className="stat-content">
                    <h3>Total Inventory</h3>
                    <p className="stat-value">
                      {warehouseInventory?.reduce((sum, item) => sum + parseFloat(item.quantityKg || 0), 0).toLocaleString() || 0} KG
                    </p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: '#06b6d420' }}>
                    <Mail size={24} style={{ color: '#06b6d4' }} />
                  </div>
                  <div className="stat-content">
                    <h3>Pending Requests</h3>
                    <p className="stat-value">{pendingApplications?.length || 0}</p>
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
                                  setEditQuantityKg(item.quantityKg?.toString() || '');
                                  setEditRemainingQuantityKg(item.remainingQuantityKg?.toString() || '');
                                  setEditDesiredPricePerKg(item.cropType?.pricePerKg?.toString() || '');
                                  setCropImageFile(null);
                                  setCropImagePreview(item.cropImageUrl || '');
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

                {}
                <div className="dashboard-section">
                  <h2>Transactions & Receipts</h2>
                  {transactionsLoading ? (
                    <p>Loading transactions...</p>
                  ) : warehouseTransactions && warehouseTransactions.length > 0 ? (
                    <div className="transactions-list">
                      {warehouseTransactions.map((transaction) => (
                        <div key={transaction.id} className="transaction-card">
                          <div className="transaction-header">
                            <div>
                              <h4 style={{ margin: 0 }}>Transaction {transaction.transactionCode}</h4>
                              <p className="transaction-subtitle">
                                {transaction.inventory?.cropType?.cropName} - {transaction.quantityKg} {transaction.inventory?.cropType?.measurementUnit || 'KG'}
                              </p>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span className={`badge badge-${transaction.paymentStatus?.toLowerCase()}`}>
                                {transaction.paymentStatus}
                              </span>
                              {transaction.deliveryStatus && (
                                <span className={`badge badge-${transaction.deliveryStatus?.toLowerCase()}`}>
                                  {transaction.deliveryStatus}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="transaction-details">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '16px' }}>
                              <div>
                                <p className="transaction-detail-label">Buyer</p>
                                <p className="transaction-detail-value">
                                  {transaction.buyer?.firstName} {transaction.buyer?.lastName}
                                </p>
                              </div>
                              <div>
                                <p className="transaction-detail-label">Amount</p>
                                <p className="transaction-detail-value">
                                  RWF {transaction.totalAmount?.toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="transaction-detail-label">Payment Status</p>
                                <p className="transaction-detail-value">
                                  <span className={`badge badge-${transaction.paymentStatus?.toLowerCase() || 'secondary'}`}>
                                    {transaction.paymentStatus || 'N/A'}
                                  </span>
                                </p>
                              </div>
                              <div>
                                <p className="transaction-detail-label">Delivery Status</p>
                                <p className="transaction-detail-value">
                                  <span className={`badge badge-${transaction.deliveryStatus?.toLowerCase() || 'secondary'}`}>
                                    {transaction.deliveryStatus || 'N/A'}
                                  </span>
                                </p>
                              </div>
                              <div>
                                <p className="transaction-detail-label">Date</p>
                                <p className="transaction-detail-value">
                                  {new Date(transaction.transactionDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            {transaction.inventory && (
                              <div className="transaction-remaining-box">
                                <p className="transaction-remaining-label">Remaining Quantity:</p>
                                <p className="transaction-remaining-value">
                                  {transaction.inventory.remainingQuantityKg} {transaction.inventory.cropType?.measurementUnit || 'KG'}
                                </p>
                              </div>
                            )}
                            {transaction.paymentStatus === 'PAID' && (
                              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                                <Button
                                  variant="outline"
                                  size="small"
                                  icon={FileDown}
                                  onClick={async () => {
                                    try {
                                      const response = await api.downloadReceiptAdmin(transaction.id);
                                      const blob = new Blob([response.data], { type: 'text/html' });
                                      const url = window.URL.createObjectURL(blob);
                                      const link = document.createElement('a');
                                      link.href = url;
                                      link.download = `receipt_${transaction.transactionCode}.html`;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                      window.URL.revokeObjectURL(url);
                                      toast.success('Receipt downloaded successfully!');
                                    } catch (error) {
                                      console.error('Error downloading receipt:', error);
                                      toast.error('Failed to download receipt');
                                    }
                                  }}
                                >
                                  Export Receipt
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-transactions">
                      <CreditCard size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                      <p>No transactions found for this warehouse</p>
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

      {}
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

      {}
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

      {}
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

              <form onSubmit={async (e) => {
                e.preventDefault();
                const updateData = {};
                
                if (cropImageFile) {
                  setUploadingImage(true);
                  try {
                    const imageUrl = await uploadImageMutation.mutateAsync(cropImageFile);
                    updateData.cropImageUrl = imageUrl;
                  } catch (error) {
                    setUploadingImage(false);
                    return;
                  }
                } else if (editCropImageUrl.trim()) {
                  updateData.cropImageUrl = editCropImageUrl.trim();
                }
                
                if (editQuantityKg) {
                  const quantity = parseFloat(editQuantityKg);
                  if (!isNaN(quantity) && quantity > 0) {
                    updateData.quantityKg = quantity;
                  }
                }
                if (editRemainingQuantityKg) {
                  const remaining = parseFloat(editRemainingQuantityKg);
                  if (!isNaN(remaining) && remaining >= 0) {
                    updateData.remainingQuantityKg = remaining;
                  }
                }
                if (editDesiredPricePerKg) {
                  const price = parseFloat(editDesiredPricePerKg);
                  if (!isNaN(price) && price > 0) {
                    updateData.desiredPricePerKg = price;
                  }
                }

                if (Object.keys(updateData).length === 0) {
                  toast.error('Please enter at least one field to update');
                  return;
                }

                updateInventoryMutation.mutate(updateData);
              }}>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label htmlFor="cropImageUpload">
                    <Image size={16} style={{ display: 'inline', marginRight: '4px' }} />
                    Crop Image
                  </label>
                  <input
                    type="file"
                    id="cropImageUpload"
                    accept="image/*"
                    onChange={(e) => {
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
                        setCropImageFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setCropImagePreview(reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    disabled={uploadingImage}
                  />
                  {uploadingImage && <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '5px' }}>Uploading image...</small>}
                  {cropImagePreview && (
                    <div style={{ marginTop: '10px' }}>
                      <img
                        src={cropImagePreview}
                        alt="Crop preview"
                        style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '8px', border: '1px solid #ddd' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setCropImageFile(null);
                          setCropImagePreview(editCropImageUrl || '');
                        }}
                        style={{ marginLeft: '10px', padding: '5px 10px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '5px' }}>
                    Upload a new image or enter image URL below (max 5MB)
                  </small>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label htmlFor="editCropImageUrl">
                    Crop Image URL (Alternative)
                  </label>
                  <input
                    type="text"
                    id="editCropImageUrl"
                    value={editCropImageUrl}
                    onChange={(e) => {
                      setEditCropImageUrl(e.target.value);
                      if (!cropImageFile) {
                        setCropImagePreview(e.target.value);
                      }
                    }}
                    placeholder="Enter image URL"
                    disabled={!!cropImageFile}
                  />
                  <small style={{ color: '#666', fontSize: '12px' }}>Leave empty to keep current image. Disabled when file is selected.</small>
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
