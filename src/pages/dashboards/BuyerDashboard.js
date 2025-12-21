import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/common/Button';
import NotificationBell from '../../components/dashboard/NotificationBell';
import RatingModal from '../../components/modals/RatingModal';
import { ShoppingCart, Package, DollarSign, CheckCircle, Clock, CreditCard, Truck, Eye, MessageSquare, MapPin, TrendingUp, PackageCheck, Star, Lock, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import '../Dashboard.css';

const BuyerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Fetch buyer's enquiries
  const { data: myEnquiries } = useQuery(
    ['buyerEnquiries', user?.id],
    async () => {
      if (!user?.id) return [];
      try {
        const response = await dataService.getBuyerEnquiries();
        return response.data || [];
      } catch (error) {
        console.error('Error fetching enquiries:', error);
        return [];
      }
    },
    { enabled: !!user?.id }
  );

  // Fetch buyer's transactions
  const { data: myTransactions } = useQuery(
    ['buyerTransactions', user?.id],
    async () => {
      if (!user?.id) return [];
      try {
        const response = await dataService.getTransactions({ buyerId: user.id });
        return response.data || [];
      } catch (error) {
        console.error('Error fetching transactions:', error);
        return [];
      }
    },
    { enabled: !!user?.id, refetchInterval: 30000 }
  );

  // Calculate statistics - use useMemo to compute paidTransactions
  const paidTransactions = useMemo(() => {
    return myTransactions?.filter(t => t.paymentStatus === 'PAID') || [];
  }, [myTransactions]);

  // Get delivered transaction IDs for query key
  const deliveredTransactionIds = useMemo(() => {
    return paidTransactions
      .filter(t => t.deliveryStatus === 'DELIVERED')
      .map(t => t.id);
  }, [paidTransactions]);

  // Fetch ratings for delivered transactions to check which ones have been rated
  const { data: transactionRatings } = useQuery(
    ['transactionRatings', user?.id, deliveredTransactionIds],
    async () => {
      if (!user?.id || !deliveredTransactionIds?.length) return {};
      try {
        const ratingsMap = {};
        await Promise.all(
          deliveredTransactionIds.map(async (transactionId) => {
            try {
              const response = await dataService.getRatingsByTransaction(transactionId);
              const ratings = response?.data || [];
              ratingsMap[transactionId] = ratings.some(r => r.rater?.id === user?.id);
            } catch (error) {
              ratingsMap[transactionId] = false;
            }
          })
        );
        return ratingsMap;
      } catch (error) {
        console.error('Error fetching transaction ratings:', error);
        return {};
      }
    },
    { enabled: !!user?.id && !!deliveredTransactionIds?.length }
  );
  const pendingTransactions = myTransactions?.filter(t => t.paymentStatus === 'PENDING') || [];
  const totalSpent = paidTransactions.reduce((sum, t) => sum + parseFloat(t.totalAmount || 0), 0);
  const totalOrders = paidTransactions.length;
  const completedOrders = paidTransactions.filter(t => t.deliveryStatus === 'DELIVERED').length;
  const pendingPayments = myEnquiries?.filter(e => e.status === 'ACCEPTED' && (!e.transaction || e.transaction.paymentStatus === 'PENDING')) || [];
  const shippedOrders = paidTransactions.filter(t => t.deliveryStatus === 'SHIPPED').length;
  const processingOrders = paidTransactions.filter(t => t.deliveryStatus === 'PROCESSING').length;
  const pendingDelivery = paidTransactions.filter(t => t.deliveryStatus === 'PENDING' && t.paymentStatus === 'PAID').length;

  // Confirm receipt mutation
  const confirmReceiptMutation = useMutation(
    (transactionId) => dataService.updateDeliveryStatus(transactionId, 'DELIVERED'),
    {
      onSuccess: (data, transactionId) => {
        toast.success('Order marked as delivered successfully!');
        queryClient.invalidateQueries(['buyerTransactions', user?.id]);

        // Find the transaction and show rating modal
        setTimeout(() => {
          queryClient.invalidateQueries(['buyerTransactions', user?.id]);
          queryClient.refetchQueries(['buyerTransactions', user?.id]).then(() => {
            // Check if rating already exists
            dataService.getRatingsByTransaction(transactionId)
              .then((ratingsResponse) => {
                const ratings = ratingsResponse?.data || [];
                const hasRating = ratings.some(r => r.rater?.id === user?.id);

                if (!hasRating) {
                  // Get fresh transaction data
                  const freshTransactions = queryClient.getQueryData(['buyerTransactions', user?.id]);
                  const transaction = freshTransactions?.data?.find(t => t.id === transactionId) ||
                    paidTransactions.find(t => t.id === transactionId);
                  if (transaction) {
                    setSelectedTransaction(transaction);
                    setRatingModalOpen(true);
                  }
                } else {
                  toast('You have already rated this transaction', { icon: 'ℹ️' });
                }
              })
              .catch(() => {
                // If check fails, still show rating modal
                const transaction = paidTransactions.find(t => t.id === transactionId);
                if (transaction) {
                  setSelectedTransaction(transaction);
                  setRatingModalOpen(true);
                }
              });
          });
        }, 500);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to confirm receipt');
      }
    }
  );

  const handleConfirmReceipt = (transactionId) => {
    if (window.confirm('Have you received this order? This will mark it as delivered and you will be asked to rate your purchase.')) {
      confirmReceiptMutation.mutate(transactionId);
    }
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="header-left">
            <h1>Buyer Dashboard</h1>
            <p>Welcome back, {user?.firstName}!</p>
          </div>
          <div className="header-right">
            <NotificationBell />
            <Link to="/inventory" className="btn-primary">
              <ShoppingCart size={20} />
              Browse Marketplace
            </Link>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white' }}>
            <div className="stat-icon" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <DollarSign size={24} style={{ color: 'white' }} />
            </div>
            <div className="stat-content">
              <h3 style={{ color: 'rgba(255,255,255,0.9)' }}>Total Spent</h3>
              <p className="stat-value" style={{ color: 'white', fontSize: '32px' }}>
                RWF {totalSpent.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #2ea359 0%, #059669 100%)', color: 'white' }}>
            <div className="stat-icon" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <ShoppingCart size={24} style={{ color: 'white' }} />
            </div>
            <div className="stat-content">
              <h3 style={{ color: 'rgba(255,255,255,0.9)' }}>Total Orders</h3>
              <p className="stat-value" style={{ color: 'white', fontSize: '32px' }}>
                {totalOrders}
              </p>
            </div>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: 'white' }}>
            <div className="stat-icon" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <CheckCircle size={24} style={{ color: 'white' }} />
            </div>
            <div className="stat-content">
              <h3 style={{ color: 'rgba(255,255,255,0.9)' }}>Completed</h3>
              <p className="stat-value" style={{ color: 'white', fontSize: '32px' }}>
                {completedOrders}
              </p>
            </div>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white' }}>
            <div className="stat-icon" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <Clock size={24} style={{ color: 'white' }} />
            </div>
            <div className="stat-content">
              <h3 style={{ color: 'rgba(255,255,255,0.9)' }}>Pending Payments</h3>
              <p className="stat-value" style={{ color: 'white', fontSize: '32px' }}>
                {pendingPayments.length}
              </p>
            </div>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', color: 'white' }}>
            <div className="stat-icon" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <Truck size={24} style={{ color: 'white' }} />
            </div>
            <div className="stat-content">
              <h3 style={{ color: 'rgba(255,255,255,0.9)' }}>Shipped</h3>
              <p className="stat-value" style={{ color: 'white', fontSize: '32px' }}>
                {shippedOrders}
              </p>
            </div>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)', color: 'white' }}>
            <div className="stat-icon" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <Package size={24} style={{ color: 'white' }} />
            </div>
            <div className="stat-content">
              <h3 style={{ color: 'rgba(255,255,255,0.9)' }}>Processing</h3>
              <p className="stat-value" style={{ color: 'white', fontSize: '32px' }}>
                {processingOrders}
              </p>
            </div>
          </div>
        </div >

        {/* Pending Payments Section */}
        {
          pendingPayments.length > 0 && (
            <div className="dashboard-section" style={{ marginBottom: '32px' }}>
              <h2>Pending Payments ({pendingPayments.length})</h2>
              <div className="pending-payments-list">
                {pendingPayments.map((enquiry) => (
                  <div key={enquiry.id} className="payment-card">
                    <div className="payment-header">
                      <div>
                        <h3>{enquiry.inventory?.cropType?.cropName || 'Unknown Crop'}</h3>
                        <p style={{ color: '#666', fontSize: '14px' }}>
                          Enquiry: {enquiry.enquiryCode}
                        </p>
                      </div>
                      <span className="badge badge-warning">Payment Required</span>
                    </div>
                    <div className="payment-details">
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                        <div>
                          <p style={{ color: '#666', fontSize: '12px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Package size={14} />
                            Quantity
                          </p>
                          <p style={{ fontWeight: '600' }}>
                            {enquiry.proposedQuantityKg} {enquiry.inventory?.cropType?.measurementUnit || 'KG'}
                          </p>
                        </div>
                        <div>
                          <p style={{ color: '#666', fontSize: '12px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <DollarSign size={14} />
                            Price per KG
                          </p>
                          <p style={{ fontWeight: '600' }}>
                            RWF {enquiry.proposedPricePerKg?.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p style={{ color: '#666', fontSize: '12px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <DollarSign size={14} />
                            Total Amount
                          </p>
                          <p style={{ fontWeight: '700', fontSize: '18px', color: '#116530' }}>
                            RWF {enquiry.proposedTotalAmount?.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button
                          variant="primary"
                          icon={CreditCard}
                          onClick={() => {
                            const transactionId = enquiry.transaction?.id || enquiry.transactionId;
                            if (transactionId) {
                              navigate(`/payment/${transactionId}`);
                            } else {
                              toast.error('Transaction not found. Please contact support.');
                            }
                          }}
                        >
                          Pay Now
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        }

        {/* Shipment Status Tracking Section */}
        {
          paidTransactions.filter(t => t.deliveryStatus === 'SHIPPED' || t.deliveryStatus === 'PROCESSING').length > 0 && (
            <div className="dashboard-section" style={{ marginBottom: '32px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Truck size={24} />
                Shipment Tracking ({paidTransactions.filter(t => t.deliveryStatus === 'SHIPPED' || t.deliveryStatus === 'PROCESSING').length})
              </h2>
              <div className="transactions-list">
                {paidTransactions
                  .filter(t => t.deliveryStatus === 'SHIPPED' || t.deliveryStatus === 'PROCESSING')
                  .map((transaction) => (
                    <div key={transaction.id} className="transaction-card">
                      <div className="transaction-header">
                        <div>
                          <h3>{transaction.inventory?.cropType?.cropName || 'Unknown Crop'}</h3>
                          <p style={{ color: '#666', fontSize: '14px' }}>
                            Transaction: {transaction.transactionCode}
                          </p>
                        </div>
                        <span className={`badge badge-${transaction.deliveryStatus?.toLowerCase()}`}>
                          {transaction.deliveryStatus}
                        </span>
                      </div>
                      <div className="transaction-details">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                          <div>
                            <p style={{ color: '#666', fontSize: '12px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Package size={14} />
                              Quantity
                            </p>
                            <p style={{ fontWeight: '600' }}>
                              {transaction.quantityKg} {transaction.inventory?.cropType?.measurementUnit || 'KG'}
                            </p>
                          </div>
                          <div>
                            <p style={{ color: '#666', fontSize: '12px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <MapPin size={14} />
                              Status
                            </p>
                            <p style={{ fontWeight: '600' }}>
                              {transaction.deliveryStatus === 'SHIPPED' ? 'On the Way' : 'Processing'}
                            </p>
                          </div>
                          <div>
                            <p style={{ color: '#666', fontSize: '12px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={14} />
                              Payment Date
                            </p>
                            <p style={{ fontWeight: '600' }}>
                              {new Date(transaction.paymentDate || transaction.transactionDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                          {transaction.deliveryStatus === 'SHIPPED' && (
                            <>
                              <Button
                                variant="outline"
                                size="small"
                                icon={Truck}
                                onClick={() => {
                                  toast('Your order is on the way! Expected delivery soon.', { icon: 'ℹ️' });
                                }}
                              >
                                Track Shipment
                              </Button>
                              <Button
                                variant="success"
                                size="small"
                                icon={PackageCheck}
                                onClick={() => handleConfirmReceipt(transaction.id)}
                                disabled={confirmReceiptMutation.isLoading}
                              >
                                {confirmReceiptMutation.isLoading ? 'Confirming...' : 'Confirm Received'}
                              </Button>
                            </>
                          )}
                          {transaction.deliveryStatus === 'PROCESSING' && (
                            <p style={{ color: '#666', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Clock size={16} />
                              Your order is being prepared for shipment
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )
        }

        {/* Active Transactions */}
        {
          paidTransactions.filter(t => t.deliveryStatus === 'PENDING' && t.paymentStatus === 'PAID').length > 0 && (
            <div className="dashboard-section" style={{ marginBottom: '32px' }}>
              <h2>Active Orders ({paidTransactions.filter(t => t.deliveryStatus === 'PENDING' && t.paymentStatus === 'PAID').length})</h2>
              <div className="transactions-list">
                {paidTransactions
                  .filter(t => t.deliveryStatus === 'PENDING' && t.paymentStatus === 'PAID')
                  .map((transaction) => (
                    <div key={transaction.id} className="transaction-card">
                      <div className="transaction-header">
                        <div>
                          <h3>{transaction.inventory?.cropType?.cropName || 'Unknown Crop'}</h3>
                          <p style={{ color: '#666', fontSize: '14px' }}>
                            Transaction: {transaction.transactionCode}
                          </p>
                        </div>
                        <span className={`badge badge-${transaction.deliveryStatus?.toLowerCase()}`}>
                          {transaction.deliveryStatus}
                        </span>
                      </div>
                      <div className="transaction-details">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                          <div>
                            <p style={{ color: '#666', fontSize: '12px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Package size={14} />
                              Quantity
                            </p>
                            <p style={{ fontWeight: '600' }}>
                              {transaction.quantityKg} {transaction.inventory?.cropType?.measurementUnit || 'KG'}
                            </p>
                          </div>
                          <div>
                            <p style={{ color: '#666', fontSize: '12px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <DollarSign size={14} />
                              Amount Paid
                            </p>
                            <p style={{ fontWeight: '600' }}>
                              RWF {transaction.totalAmount?.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p style={{ color: '#666', fontSize: '12px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={14} />
                              Date
                            </p>
                            <p style={{ fontWeight: '600' }}>
                              {new Date(transaction.paymentDate || transaction.transactionDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                          <Button
                            variant="outline"
                            size="small"
                            icon={Eye}
                            onClick={() => navigate(`/receipts`)}
                          >
                            View Receipt
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )
        }

        {/* Shipment Tracking & Statistics Section */}
        <div className="dashboard-section" style={{ marginBottom: '32px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <Truck size={24} />
            Order Tracking & Statistics
          </h2>

          {/* Delivery Status Statistics */}
          <div className="stats-grid" style={{ marginBottom: '32px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white' }}>
              <div className="stat-icon" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <Clock size={20} style={{ color: 'white' }} />
              </div>
              <div className="stat-content">
                <h4 style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', margin: 0 }}>Pending Delivery</h4>
                <p className="stat-value" style={{ color: 'white', fontSize: '24px', margin: '8px 0 0 0' }}>
                  {pendingDelivery}
                </p>
              </div>
            </div>

            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)', color: 'white' }}>
              <div className="stat-icon" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <Package size={20} style={{ color: 'white' }} />
              </div>
              <div className="stat-content">
                <h4 style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', margin: 0 }}>Processing</h4>
                <p className="stat-value" style={{ color: 'white', fontSize: '24px', margin: '8px 0 0 0' }}>
                  {processingOrders}
                </p>
              </div>
            </div>

            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', color: 'white' }}>
              <div className="stat-icon" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <Truck size={20} style={{ color: 'white' }} />
              </div>
              <div className="stat-content">
                <h4 style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', margin: 0 }}>Shipped</h4>
                <p className="stat-value" style={{ color: 'white', fontSize: '24px', margin: '8px 0 0 0' }}>
                  {shippedOrders}
                </p>
              </div>
            </div>

            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: 'white' }}>
              <div className="stat-icon" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <CheckCircle size={20} style={{ color: 'white' }} />
              </div>
              <div className="stat-content">
                <h4 style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', margin: 0 }}>Delivered</h4>
                <p className="stat-value" style={{ color: 'white', fontSize: '24px', margin: '8px 0 0 0' }}>
                  {completedOrders}
                </p>
              </div>
            </div>
          </div>

          {/* All Transactions with Delivery Status */}
          {paidTransactions.length > 0 && (
            <div>
              <h3 style={{ marginBottom: '16px', color: '#333' }}>All Your Orders</h3>
              <div className="transactions-list">
                {paidTransactions
                  .sort((a, b) => new Date(b.transactionDate || b.paymentDate) - new Date(a.transactionDate || a.paymentDate))
                  .map((transaction) => (
                    <div key={transaction.id} className="transaction-card">
                      <div className="transaction-header">
                        <div>
                          <h3>{transaction.inventory?.cropType?.cropName || 'Unknown Crop'}</h3>
                          <p style={{ color: '#666', fontSize: '14px' }}>
                            Transaction: {transaction.transactionCode}
                          </p>
                        </div>
                        <span className={`badge badge-${transaction.deliveryStatus?.toLowerCase()}`}>
                          {transaction.deliveryStatus}
                        </span>
                      </div>
                      <div className="transaction-details">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
                          <div>
                            <p style={{ color: '#666', fontSize: '12px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Package size={14} />
                              Quantity
                            </p>
                            <p style={{ fontWeight: '600' }}>
                              {transaction.quantityKg} {transaction.inventory?.cropType?.measurementUnit || 'KG'}
                            </p>
                          </div>
                          <div>
                            <p style={{ color: '#666', fontSize: '12px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <DollarSign size={14} />
                              Amount
                            </p>
                            <p style={{ fontWeight: '600' }}>
                              RWF {transaction.totalAmount?.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p style={{ color: '#666', fontSize: '12px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Truck size={14} />
                              Status
                            </p>
                            <p style={{ fontWeight: '600' }}>
                              {transaction.deliveryStatus === 'PENDING' ? 'Pending' :
                                transaction.deliveryStatus === 'PROCESSING' ? 'Processing' :
                                  transaction.deliveryStatus === 'SHIPPED' ? 'Shipped' :
                                    transaction.deliveryStatus === 'DELIVERED' ? 'Delivered' :
                                      transaction.deliveryStatus}
                            </p>
                          </div>
                          <div>
                            <p style={{ color: '#666', fontSize: '12px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={14} />
                              Date
                            </p>
                            <p style={{ fontWeight: '600' }}>
                              {new Date(transaction.paymentDate || transaction.transactionDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                          <Button
                            variant="outline"
                            size="small"
                            icon={Eye}
                            onClick={() => navigate(`/receipts`)}
                          >
                            View Receipt
                          </Button>
                          {transaction.deliveryStatus === 'SHIPPED' && (
                            <>
                              <Button
                                variant="outline"
                                size="small"
                                icon={Truck}
                                onClick={() => {
                                  toast('Your order is on the way! Expected delivery soon.', { icon: 'ℹ️' });
                                }}
                              >
                                Track Shipment
                              </Button>
                              <Button
                                variant="success"
                                size="small"
                                icon={PackageCheck}
                                onClick={() => handleConfirmReceipt(transaction.id)}
                                disabled={confirmReceiptMutation.isLoading}
                              >
                                {confirmReceiptMutation.isLoading ? 'Confirming...' : 'Confirm Received'}
                              </Button>
                            </>
                          )}
                          {transaction.deliveryStatus === 'PROCESSING' && (
                            <p style={{ color: '#666', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                              <Clock size={16} />
                              Being prepared for shipment
                            </p>
                          )}
                          {transaction.deliveryStatus === 'PENDING' && (
                            <p style={{ color: '#666', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                              <Clock size={16} />
                              Awaiting shipment
                            </p>
                          )}
                          {transaction.deliveryStatus === 'DELIVERED' && (
                            <>
                              <p style={{ color: '#2ea359', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontWeight: '600' }}>
                                <CheckCircle size={16} />
                                Order delivered successfully
                              </p>
                              {!transactionRatings?.[transaction.id] && (
                                <Button
                                  variant="primary"
                                  size="small"
                                  icon={Star}
                                  onClick={() => {
                                    setSelectedTransaction(transaction);
                                    setRatingModalOpen(true);
                                  }}
                                >
                                  Rate Purchase
                                </Button>
                              )}
                              {transactionRatings?.[transaction.id] && (
                                <p style={{ color: '#8b5cf6', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontWeight: '600' }}>
                                  <Star size={16} fill="#8b5cf6" />
                                  You have rated this purchase
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rating Modal */}
      <RatingModal
        isOpen={ratingModalOpen}
        onClose={() => {
          setRatingModalOpen(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
      />
    </div>
  );
};

export default BuyerDashboard;

