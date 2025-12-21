import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/dataService';
import Sidebar from '../components/layout/Sidebar';

import Button from '../components/common/Button';
import { Package, Truck, CheckCircle, Clock, MapPin, User, DollarSign, X, PackageCheck, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import './Dashboard.css';

const StorekeeperShipments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  // Fetch paid transactions awaiting delivery
  const { data: transactions, isLoading, refetch } = useQuery(
    ['shipmentTransactions', user?.id],
    async () => {
      if (!user?.id) return [];
      try {
        // Get all paid transactions using the payment status endpoint
        const response = await dataService.getTransactionsByPaymentStatus('PAID');

        // Handle response - should be a list
        let allPaid = [];
        if (Array.isArray(response.data)) {
          // List response
          allPaid = response.data;
        } else if (Array.isArray(response)) {
          // Direct array response
          allPaid = response;
        } else if (response.data?.content) {
          // Paginated response (fallback)
          allPaid = response.data.content;
        }

        // Filter for transactions that need shipment (PENDING, PROCESSING, SHIPPED, or DELIVERED for viewing)
        // Storekeeper should see transactions for their assigned warehouses
        // Include DELIVERED so storekeepers can see when buyers have confirmed delivery
        return allPaid.filter(t =>
          t.deliveryStatus === 'PENDING' ||
          t.deliveryStatus === 'PROCESSING' ||
          t.deliveryStatus === 'SHIPPED' ||
          t.deliveryStatus === 'DELIVERED'
        );
      } catch (error) {
        console.error('Error fetching shipment transactions:', error);
        return [];
      }
    },
    {
      enabled: !!user?.id,
      refetchInterval: 30000 // Refresh every 30 seconds
    }
  );

  // Update delivery status mutation
  const updateStatusMutation = useMutation(
    ({ transactionId, status }) => dataService.updateDeliveryStatus(transactionId, status),
    {
      onSuccess: (response) => {
        const transaction = response.data || response;
        toast.success(`Delivery status updated to ${transaction.deliveryStatus}`);
        setShowStatusModal(false);
        setSelectedTransaction(null);
        setNewStatus('');
        queryClient.invalidateQueries(['shipmentTransactions', user?.id]);
        refetch();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update delivery status');
      }
    }
  );

  const handleUpdateStatus = (transaction, status) => {
    setSelectedTransaction(transaction);
    setNewStatus(status);
    setShowStatusModal(true);
  };

  const confirmStatusUpdate = () => {
    if (!selectedTransaction) return;
    updateStatusMutation.mutate({
      transactionId: selectedTransaction.id,
      status: newStatus
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING':
        return 'badge-warning';
      case 'PROCESSING':
        return 'badge-info';
      case 'SHIPPED':
        return 'badge-success';
      case 'DELIVERED':
        return 'badge-success';
      case 'CANCELLED':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  const getNextStatusOptions = (currentStatus) => {
    switch (currentStatus) {
      case 'PENDING':
        return [
          { value: 'PROCESSING', label: 'Confirm Pickup (Processing)' },
          { value: 'CANCELLED', label: 'Cancel' }
        ];
      case 'PROCESSING':
        return [
          { value: 'SHIPPED', label: 'Initiate Shipment (Shipped)' },
          { value: 'CANCELLED', label: 'Cancel' }
        ];
      case 'SHIPPED':
        // Storekeepers cannot mark as DELIVERED - only buyers can confirm delivery
        return [];
      case 'DELIVERED':
        // DELIVERED is final - no further actions
        return [];
      default:
        return [];
    }
  };

  const pendingShipments = transactions?.filter(t => t.deliveryStatus === 'PENDING') || [];
  const processingShipments = transactions?.filter(t => t.deliveryStatus === 'PROCESSING') || [];
  const shippedShipments = transactions?.filter(t => t.deliveryStatus === 'SHIPPED') || [];
  const deliveredShipments = transactions?.filter(t => t.deliveryStatus === 'DELIVERED') || [];

  if (isLoading) {
    return (
      <div className="dashboard">
        <Sidebar />

        <div className="dashboard-container">
          <p>Loading shipments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboard-container">
        {/* Statistics */}
        <div className="stats-grid" style={{ marginBottom: '32px' }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#f59e0b20' }}>
              <Clock size={24} style={{ color: '#f59e0b' }} />
            </div>
            <div className="stat-content">
              <h3>Pending Pickup</h3>
              <p className="stat-value">{pendingShipments.length}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#3b82f620' }}>
              <Package size={24} style={{ color: '#3b82f6' }} />
            </div>
            <div className="stat-content">
              <h3>Processing</h3>
              <p className="stat-value">{processingShipments.length}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#2ea35920' }}>
              <Truck size={24} style={{ color: '#2ea359' }} />
            </div>
            <div className="stat-content">
              <h3>Shipped</h3>
              <p className="stat-value">{shippedShipments.length}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#2ea35920' }}>
              <CheckCircle size={24} style={{ color: '#2ea359' }} />
            </div>
            <div className="stat-content">
              <h3>Delivered</h3>
              <p className="stat-value">{deliveredShipments.length}</p>
            </div>
          </div>
        </div>

        {/* Pending Shipments */}
        {pendingShipments.length > 0 && (
          <div className="dashboard-section" style={{ marginBottom: '32px' }}>
            <h2>Pending Pickup ({pendingShipments.length})</h2>
            <div className="shipments-list">
              {pendingShipments.map((transaction) => (
                <div key={transaction.id} className="shipment-card">
                  <div className="shipment-header">
                    <div>
                      <h3>{transaction.inventory?.cropType?.cropName || 'Unknown Crop'}</h3>
                      <p style={{ color: '#666', fontSize: '14px' }}>
                        Transaction: {transaction.transactionCode}
                      </p>
                    </div>
                    <span className={`badge ${getStatusBadgeClass(transaction.deliveryStatus)}`}>
                      {transaction.deliveryStatus}
                    </span>
                  </div>

                  <div className="shipment-details">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <p style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>
                          <Package size={14} style={{ display: 'inline', marginRight: '4px' }} />
                          Quantity
                        </p>
                        <p style={{ fontWeight: '600' }}>
                          {transaction.quantityKg} {transaction.inventory?.cropType?.measurementUnit || 'KG'}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>
                          <DollarSign size={14} style={{ display: 'inline', marginRight: '4px' }} />
                          Amount
                        </p>
                        <p style={{ fontWeight: '600' }}>
                          RWF {transaction.totalAmount?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>
                          <User size={14} style={{ display: 'inline', marginRight: '4px' }} />
                          Buyer
                        </p>
                        <p style={{ fontWeight: '600' }}>
                          {transaction.buyer?.firstName} {transaction.buyer?.lastName}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>
                          <MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} />
                          Warehouse
                        </p>
                        <p style={{ fontWeight: '600' }}>
                          {transaction.inventory?.warehouse?.warehouseName || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {transaction.buyer?.address && (
                      <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', marginBottom: '16px' }}>
                        <p style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>Delivery Address:</p>
                        <p style={{ fontWeight: '600' }}>{transaction.buyer.address}</p>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {getNextStatusOptions(transaction.deliveryStatus).map((option) => {
                        let icon;
                        if (option.value === 'PROCESSING') icon = PackageCheck;
                        else if (option.value === 'SHIPPED') icon = Truck;
                        else if (option.value === 'DELIVERED') icon = CheckCircle2;
                        else if (option.value === 'CANCELLED') icon = XCircle;
                        else icon = Package;

                        return (
                          <Button
                            key={option.value}
                            variant={option.value === 'CANCELLED' ? 'danger' : 'primary'}
                            icon={icon}
                            onClick={() => handleUpdateStatus(transaction, option.value)}
                            disabled={updateStatusMutation.isLoading}
                          >
                            {option.label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Processing Shipments */}
        {processingShipments.length > 0 && (
          <div className="dashboard-section" style={{ marginBottom: '32px' }}>
            <h2>Processing ({processingShipments.length})</h2>
            <div className="shipments-list">
              {processingShipments.map((transaction) => (
                <div key={transaction.id} className="shipment-card">
                  <div className="shipment-header">
                    <div>
                      <h3>{transaction.inventory?.cropType?.cropName || 'Unknown Crop'}</h3>
                      <p style={{ color: '#666', fontSize: '14px' }}>
                        Transaction: {transaction.transactionCode}
                      </p>
                    </div>
                    <span className={`badge ${getStatusBadgeClass(transaction.deliveryStatus)}`}>
                      {transaction.deliveryStatus}
                    </span>
                  </div>

                  <div className="shipment-details">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <p style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>Quantity</p>
                        <p style={{ fontWeight: '600' }}>
                          {transaction.quantityKg} {transaction.inventory?.cropType?.measurementUnit || 'KG'}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>Buyer</p>
                        <p style={{ fontWeight: '600' }}>
                          {transaction.buyer?.firstName} {transaction.buyer?.lastName}
                        </p>
                      </div>
                    </div>

                    {transaction.buyer?.address && (
                      <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', marginBottom: '16px' }}>
                        <p style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>Delivery Address:</p>
                        <p style={{ fontWeight: '600' }}>{transaction.buyer.address}</p>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {getNextStatusOptions(transaction.deliveryStatus).map((option) => {
                        let icon;
                        if (option.value === 'SHIPPED') icon = Truck;
                        else if (option.value === 'CANCELLED') icon = XCircle;
                        else icon = Package;

                        return (
                          <Button
                            key={option.value}
                            variant="primary"
                            icon={icon}
                            onClick={() => handleUpdateStatus(transaction, option.value)}
                            disabled={updateStatusMutation.isLoading}
                          >
                            {option.label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shipped Shipments */}
        {shippedShipments.length > 0 && (
          <div className="dashboard-section" style={{ marginBottom: '32px' }}>
            <h2>Shipped ({shippedShipments.length})</h2>
            <div className="shipments-list">
              {shippedShipments.map((transaction) => (
                <div key={transaction.id} className="shipment-card">
                  <div className="shipment-header">
                    <div>
                      <h3>{transaction.inventory?.cropType?.cropName || 'Unknown Crop'}</h3>
                      <p style={{ color: '#666', fontSize: '14px' }}>
                        Transaction: {transaction.transactionCode}
                      </p>
                    </div>
                    <span className={`badge ${getStatusBadgeClass(transaction.deliveryStatus)}`}>
                      {transaction.deliveryStatus}
                    </span>
                  </div>

                  <div className="shipment-details">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                      <div>
                        <p style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>Quantity</p>
                        <p style={{ fontWeight: '600' }}>
                          {transaction.quantityKg} {transaction.inventory?.cropType?.measurementUnit || 'KG'}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>Buyer</p>
                        <p style={{ fontWeight: '600' }}>
                          {transaction.buyer?.firstName} {transaction.buyer?.lastName}
                        </p>
                      </div>
                    </div>

                    {transaction.buyer?.address && (
                      <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', marginTop: '16px' }}>
                        <p style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>Delivery Address:</p>
                        <p style={{ fontWeight: '600' }}>{transaction.buyer.address}</p>
                      </div>
                    )}

                    <div style={{ marginTop: '16px', padding: '12px', background: '#e0f2fe', borderRadius: '8px', border: '1px solid #0ea5e9' }}>
                      <p style={{ color: '#0c4a6e', fontSize: '13px', margin: 0 }}>
                        <strong>ℹ️ Note:</strong> This order has been shipped. The buyer will confirm delivery and rate the purchase.
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delivered Shipments (Read-only) */}
        {deliveredShipments.length > 0 && (
          <div className="dashboard-section">
            <h2>Delivered ({deliveredShipments.length})</h2>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
              Orders confirmed as delivered by buyers. Buyers can rate these purchases.
            </p>
            <div className="shipments-list">
              {deliveredShipments.map((transaction) => (
                <div key={transaction.id} className="shipment-card" style={{ opacity: 0.9 }}>
                  <div className="shipment-header">
                    <div>
                      <h3>{transaction.inventory?.cropType?.cropName || 'Unknown Crop'}</h3>
                      <p style={{ color: '#666', fontSize: '14px' }}>
                        Transaction: {transaction.transactionCode}
                      </p>
                    </div>
                    <span className={`badge ${getStatusBadgeClass(transaction.deliveryStatus)}`}>
                      {transaction.deliveryStatus}
                    </span>
                  </div>

                  <div className="shipment-details">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <p style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>Quantity</p>
                        <p style={{ fontWeight: '600' }}>
                          {transaction.quantityKg} {transaction.inventory?.cropType?.measurementUnit || 'KG'}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>Buyer</p>
                        <p style={{ fontWeight: '600' }}>
                          {transaction.buyer?.firstName} {transaction.buyer?.lastName}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>Amount</p>
                        <p style={{ fontWeight: '600', color: '#2ea359' }}>
                          RWF {transaction.totalAmount?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>Delivery Date</p>
                        <p style={{ fontWeight: '600' }}>
                          {transaction.updatedAt ? new Date(transaction.updatedAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div style={{ padding: '12px', background: '#d1fae5', borderRadius: '8px', border: '1px solid #2ea359' }}>
                      <p style={{ color: '#065f46', fontSize: '13px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle size={16} />
                        <strong>Confirmed by Buyer:</strong> This order has been confirmed as delivered by the buyer.
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(!transactions || transactions.length === 0) && (
          <div className="empty-state">
            <Package size={64} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <h3>No Shipments Pending</h3>
            <p>There are no paid orders awaiting delivery at this time.</p>
          </div>
        )}

        {/* Status Update Confirmation Modal */}
        {showStatusModal && selectedTransaction && (
          <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
              <div className="modal-header">
                <h2>Update Delivery Status</h2>
                <button className="modal-close" onClick={() => setShowStatusModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                <p style={{ marginBottom: '16px' }}>
                  Are you sure you want to update the delivery status for this order?
                </p>
                <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                  <p><strong>Crop:</strong> {selectedTransaction.inventory?.cropType?.cropName}</p>
                  <p><strong>Transaction:</strong> {selectedTransaction.transactionCode}</p>
                  <p><strong>Current Status:</strong> {selectedTransaction.deliveryStatus}</p>
                  <p><strong>New Status:</strong> {newStatus}</p>
                  {newStatus === 'SHIPPED' && (
                    <p style={{ color: '#2ea359', marginTop: '8px', fontSize: '14px' }}>
                      ✓ Buyer will be notified via email when shipment is initiated.
                    </p>
                  )}
                </div>
                <div className="modal-actions">
                  <Button variant="outline" icon={X} onClick={() => setShowStatusModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    icon={CheckCircle}
                    onClick={confirmStatusUpdate}
                    disabled={updateStatusMutation.isLoading}
                  >
                    {updateStatusMutation.isLoading ? 'Updating...' : 'Confirm Update'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StorekeeperShipments;

