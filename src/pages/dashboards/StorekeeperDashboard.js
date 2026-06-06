import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingState from '../../components/common/LoadingState';
import Button from '../../components/common/Button';
import {
  Warehouse as WarehouseIcon,
  Package,
  Eye,
  Pencil,
  X,
  XCircle,
  CheckCircle,
  Image as ImageIcon,
  DollarSign,
  Mail,
  Edit,
  FileDown,
  CreditCard,
  Clock,
} from 'lucide-react';
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

  // 1. Warehouse query
  const { data: warehouseData, isLoading: warehouseLoading } = useQuery({
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

  // Keep track of assignments
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

  // 2. Applications query
  const { data: applicationsData, isLoading: applicationsLoading } = useQuery({
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

  const pendingApplications = applicationsData?.filter(app => app.status === 'PENDING') || [];

  // 3. Inventory query
  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
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

  // 4. Transactions query
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

  // Mutations
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
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
      toast.error(`Failed to approve application: ${errorMessage}`);
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

  const isPageLoading = warehouseLoading;

  if (isPageLoading) {
    return (
      <DashboardLayout title="Storekeeper Dashboard" subtitle="Loading warehouse details...">
        <div style={{ padding: '24px 0' }}>
          <LoadingState type="skeleton-cards" cardsCount={3} />
          <div style={{ marginTop: '32px' }}>
            <LoadingState type="spinner" message="Syncing storage records..." />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Storekeeper Dashboard" subtitle={`Welcome back, Storekeeper ${user?.firstName || ''}!`}>
      {selectedWarehouse ? (
        <>
          {/* Warehouse Header Banner */}
          <div style={{
            background: 'linear-gradient(135deg, var(--primary-green-dark) 0%, var(--primary-green) 100%)',
            color: 'white',
            padding: '24px',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            boxShadow: 'var(--card-shadow)'
          }}>
            <WarehouseIcon size={40} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '12px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assigned Storage Facility</span>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '4px 0 0 0' }}>{selectedWarehouse.warehouseName}</h2>
              {selectedWarehouse.location && (
                <p style={{ fontSize: '13px', opacity: 0.9, margin: '6px 0 0 0' }}>Location: {selectedWarehouse.location.name}</p>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid" style={{ marginBottom: '32px' }}>
            <StatCard
              title="Total Capacity"
              value={`${(selectedWarehouse.totalCapacityKg || 0).toLocaleString()} KG`}
              icon={WarehouseIcon}
              color="var(--primary-green)"
            />
            <StatCard
              title="Available Capacity"
              value={`${(selectedWarehouse.availableCapacityKg || 0).toLocaleString()} KG`}
              icon={Package}
              color="#3b82f6"
            />
            <StatCard
              title="Capacity Used"
              value={`${selectedWarehouse.totalCapacityKg && selectedWarehouse.availableCapacityKg
                ? (((selectedWarehouse.totalCapacityKg - selectedWarehouse.availableCapacityKg) / selectedWarehouse.totalCapacityKg) * 100).toFixed(1)
                : 0}%`}
              icon={Package}
              color="#f59e0b"
            />
            <StatCard
              title="Active Inventory Lots"
              value={warehouseInventory.length.toString()}
              icon={Package}
              color="#10b981"
            />
            <StatCard
              title="Pending Storage Requests"
              value={pendingApplications.length.toString()}
              icon={Mail}
              color="#ef4444"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'flex-start' }}>
            
            {/* Left Side: Pending Access Requests */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div className="dashboard-section" style={{ margin: 0 }}>
                <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>Pending Crop Storage Requests</h2>
                
                {applicationsLoading ? (
                  <LoadingState type="spinner" message="Fetching pending items..." />
                ) : pendingApplications.length > 0 ? (
                  <div className="applications-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {pendingApplications.map((app) => (
                      <div key={app.id} className="application-card" style={{ padding: '20px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
                        <div className="application-info">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <h4 style={{ margin: 0, fontSize: '15px' }}>{app.user?.firstName} {app.user?.lastName}</h4>
                            <Button
                              variant="outline"
                              size="small"
                              icon={Eye}
                              onClick={() => {
                                setSelectedApplication(app);
                                setShowReviewModal(true);
                              }}
                            >
                              Review
                            </Button>
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--text-light)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span><strong>Crop:</strong> {app.cropType?.cropName}</span>
                            <span><strong>Quantity:</strong> {app.cropQuantityKg} KG</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                              <span>Status:</span>
                              <StatusBadge status={app.status} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-light)', fontStyle: 'italic' }}>No pending applications</p>
                )}
              </div>
            </div>

            {/* Right Side: Warehouse Inventory */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div className="dashboard-section" style={{ margin: 0 }}>
                <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>Stored Crop Inventory</h2>
                
                {inventoryLoading ? (
                  <LoadingState type="spinner" message="Reading stock levels..." />
                ) : warehouseInventory.length > 0 ? (
                  <div className="inventory-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {warehouseInventory.map((item) => (
                      <div key={item.id} className="inventory-item" style={{ padding: '20px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '12px' }}>
                          {item.cropImageUrl ? (
                            <img
                              src={item.cropImageUrl.startsWith('http') ? item.cropImageUrl : `${process.env.REACT_APP_BACKEND_URL ?? 'http://localhost:8081'}${item.cropImageUrl}`}
                              alt={item.cropType?.cropName || 'Crop'}
                              style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
                            />
                          ) : (
                            <div style={{ width: '48px', height: '48px', background: 'var(--primary-green-light)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Package size={20} color="var(--primary-green)" />
                            </div>
                          )}
                          <div>
                            <h4 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>{item.cropType?.cropName || 'Unknown Crop'}</h4>
                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-light)' }}>Code: {item.inventoryCode}</p>
                          </div>
                        </div>
                        
                        <div style={{ fontSize: '13px', color: 'var(--text-gray)', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                          <span><strong>Farmer:</strong> {item.farmer?.firstName} {item.farmer?.lastName}</span>
                          <span><strong>Quantity:</strong> {item.quantityKg} KG | <strong>Remaining:</strong> {item.remainingQuantityKg} KG</span>
                          <span><strong>Grade:</strong> {item.qualityGrade}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                            <span>Status:</span>
                            <StatusBadge status={item.status} />
                          </div>
                        </div>
                        
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
                          Edit Lot Specs
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-light)', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
                    <Package size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
                    <p style={{ margin: 0 }}>No stored lots in this warehouse.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="dashboard-section" style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', marginTop: '32px' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>Active Transactions & Releases</h2>
            
            {transactionsLoading ? (
              <LoadingState type="spinner" message="Syncing ledger..." />
            ) : warehouseTransactions && warehouseTransactions.length > 0 ? (
              <div className="transactions-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {warehouseTransactions.map((transaction) => (
                  <div key={transaction.id} className="transaction-card" style={{ padding: '20px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
                    <div className="transaction-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '15px' }}>Transaction {transaction.transactionCode}</h4>
                        <p style={{ color: 'var(--text-light)', fontSize: '12px', margin: '4px 0 0 0' }}>
                          {transaction.inventory?.cropType?.cropName} - {transaction.quantityKg} KG
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <StatusBadge status={transaction.paymentStatus} />
                        {transaction.deliveryStatus && (
                          <StatusBadge status={transaction.deliveryStatus} />
                        )}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                      <div style={{ fontSize: '13px', color: 'var(--text-gray)' }}>
                        <span>Buyer: <strong>{transaction.buyer?.firstName} {transaction.buyer?.lastName}</strong> | Amount: <strong>RWF {transaction.totalAmount?.toLocaleString()}</strong></span>
                      </div>
                      
                      {transaction.paymentStatus === 'PAID' && (
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
                              toast.success('Receipt exported successfully!');
                            } catch (error) {
                              console.error('Error downloading receipt:', error);
                              toast.error('Failed to export receipt');
                            }
                          }}
                        >
                          Export Release Receipt
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-light)', fontStyle: 'italic', textAlign: 'center', padding: '24px' }}>No transactions found for stored crops</p>
            )}
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px 24px', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
          <WarehouseIcon size={48} style={{ color: 'var(--text-light)', marginBottom: '16px' }} />
          <h3>No assigned warehouse</h3>
          <p style={{ color: 'var(--text-light)', maxWidth: '400px', margin: '8px auto 0 auto' }}>You are registered as a storekeeper, but have not yet been assigned to manage a warehouse facility. Please contact a system administrator.</p>
        </div>
      )}

      {/* Review Access Application Modal */}
      {showReviewModal && selectedApplication && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Review Warehouse Access Request</h2>
              <Button variant="outline" size="small" className="modal-close" onClick={() => setShowReviewModal(false)} icon={X} />
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ padding: '16px', background: 'var(--background-beige)', borderRadius: '8px', fontSize: '13px' }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Farmer Details</h3>
                  <p style={{ margin: '0 0 4px 0' }}><strong>Name:</strong> {selectedApplication.user?.firstName} {selectedApplication.user?.lastName}</p>
                  <p style={{ margin: '0 0 4px 0' }}><strong>Email:</strong> {selectedApplication.user?.email}</p>
                  <p style={{ margin: 0 }}><strong>Phone:</strong> {selectedApplication.user?.phoneNumber || 'N/A'}</p>
                </div>

                <div style={{ padding: '16px', background: 'var(--background-beige)', borderRadius: '8px', fontSize: '13px' }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Request Details</h3>
                  <p style={{ margin: '0 0 4px 0' }}><strong>Requested Capacity:</strong> {selectedApplication.requestedCapacityKg} KG</p>
                  <p style={{ margin: '0 0 4px 0' }}><strong>Available Warehouse Capacity:</strong> {selectedWarehouse?.availableCapacityKg} KG</p>
                  {selectedApplication.notes && (
                    <p style={{ margin: 0 }}><strong>Notes:</strong> {selectedApplication.notes}</p>
                  )}
                </div>

                {selectedApplication.cropType && (
                  <div style={{ padding: '16px', background: 'var(--background-beige)', borderRadius: '8px', fontSize: '13px' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Crop Details</h3>
                    <p style={{ margin: '0 0 4px 0' }}><strong>Crop:</strong> {selectedApplication.cropType?.cropName}</p>
                    <p style={{ margin: '0 0 4px 0' }}><strong>Quantity:</strong> {selectedApplication.cropQuantityKg} KG</p>
                    <p style={{ margin: '0 0 4px 0' }}><strong>Quality Grade:</strong> {selectedApplication.qualityGrade}</p>
                    {selectedApplication.cropImageUrl && (
                      <div style={{ marginTop: '12px' }}>
                        <img
                          src={selectedApplication.cropImageUrl.startsWith('http')
                            ? selectedApplication.cropImageUrl
                            : `${process.env.REACT_APP_BACKEND_URL ?? 'http://localhost:8081'}${selectedApplication.cropImageUrl}`}
                          alt="Crop lot"
                          style={{ maxWidth: '100%', maxHeight: '240px', borderRadius: '8px', objectFit: 'cover' }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
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
                  Reject Request
                </Button>
                <Button
                  variant="success"
                  icon={CheckCircle}
                  onClick={() => {
                    handleApproveApplication(selectedApplication.id);
                    setShowReviewModal(false);
                  }}
                >
                  Approve & Release Space
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Inventory Modal */}
      {showEditInventoryModal && selectedInventory && (
        <div className="modal-overlay" onClick={() => setShowEditInventoryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h2>Modify Crop Lot Specifications</h2>
              <Button variant="outline" size="small" className="modal-close" onClick={() => setShowEditInventoryModal(false)} icon={X} />
            </div>
            <div className="modal-body">
              <div style={{ padding: '16px', background: 'var(--background-beige)', borderRadius: '8px', fontSize: '13px', marginBottom: '20px' }}>
                <p style={{ margin: '0 0 4px 0' }}><strong>Crop:</strong> {selectedInventory.cropType?.cropName}</p>
                <p style={{ margin: '0 0 4px 0' }}><strong>Code:</strong> {selectedInventory.inventoryCode}</p>
                <p style={{ margin: 0 }}><strong>Farmer:</strong> {selectedInventory.farmer?.firstName} {selectedInventory.farmer?.lastName}</p>
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
                  toast.error('No changes detected');
                  return;
                }

                updateInventoryMutation.mutate(updateData);
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Crop Image Upload</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error('File size must be less than 5MB');
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
                    {cropImagePreview && (
                      <div style={{ marginTop: '10px' }}>
                        <img
                          src={cropImagePreview}
                          alt="Crop preview"
                          style={{ maxWidth: '120px', maxHeight: '120px', borderRadius: '8px', objectFit: 'cover' }}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="editCropImageUrl" style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Crop Image URL (Optional)</label>
                    <input
                      type="text"
                      id="editCropImageUrl"
                      value={editCropImageUrl}
                      onChange={(e) => setEditCropImageUrl(e.target.value)}
                      placeholder="Enter image link"
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                    />
                  </div>

                  <div>
                    <label htmlFor="editQuantityKg" style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Total Stock Weight (KG)</label>
                    <input
                      type="number"
                      id="editQuantityKg"
                      value={editQuantityKg}
                      onChange={(e) => setEditQuantityKg(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                    />
                  </div>

                  <div>
                    <label htmlFor="editRemainingQuantityKg" style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Remaining Stock Weight (KG)</label>
                    <input
                      type="number"
                      id="editRemainingQuantityKg"
                      value={editRemainingQuantityKg}
                      onChange={(e) => setEditRemainingQuantityKg(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                    />
                  </div>

                  <div>
                    <label htmlFor="editDesiredPricePerKg" style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Desired Sale Price per KG (RWF)</label>
                    <input
                      type="number"
                      id="editDesiredPricePerKg"
                      value={editDesiredPricePerKg}
                      onChange={(e) => setEditDesiredPricePerKg(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
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
                    {updateInventoryMutation.isLoading ? 'Updating...' : 'Save Lot Changes'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default StorekeeperDashboard;
