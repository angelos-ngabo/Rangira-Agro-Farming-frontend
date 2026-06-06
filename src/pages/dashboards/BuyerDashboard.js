import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingState from '../../components/common/LoadingState';
import Button from '../../components/common/Button';
import RatingModal from '../../components/modals/RatingModal';
import {
  ShoppingCart,
  Package,
  DollarSign,
  CheckCircle,
  Clock,
  CreditCard,
  Truck,
  Eye,
  MessageSquare,
  PackageCheck,
  Star,
} from 'lucide-react';
import toast from 'react-hot-toast';
import '../Dashboard.css';
import './BuyerDashboard.css';

const BuyerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // 1. Enquiries query
  const { data: myEnquiries, isLoading: enquiriesLoading } = useQuery(
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

  // 2. Transactions query
  const { data: myTransactions, isLoading: transactionsLoading } = useQuery(
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

  const paidTransactions = useMemo(() => {
    return myTransactions?.filter(t => t.paymentStatus === 'PAID') || [];
  }, [myTransactions]);

  const deliveredTransactionIds = useMemo(() => {
    return paidTransactions
      .filter(t => t.deliveryStatus === 'DELIVERED')
      .map(t => t.id);
  }, [paidTransactions]);

  // 3. Ratings check
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

  // 4. Available Inventories query
  const { data: availableInventory, isLoading: inventoryLoading } = useQuery(
    ['availableInventory', user?.id],
    async () => {
      if (!user?.id) return [];
      try {
        const response = await dataService.getAvailableInventories();
        const allInventory = response.data || [];
        return allInventory
          .filter(inv => inv.remainingQuantityKg > 0 && (inv.status === 'STORED' || inv.status === 'PARTIALLY_SOLD'))
          .slice(0, 6);
      } catch (error) {
        console.error('Error fetching inventory:', error);
        try {
          const fallback = await dataService.getInventory({ page: 0, size: 6, status: 'STORED' });
          const inventory = fallback.data?.content || fallback.data || [];
          return inventory.filter(inv => inv.remainingQuantityKg > 0);
        } catch (fallbackError) {
          return [];
        }
      }
    },
    { enabled: !!user?.id, staleTime: 30000, refetchInterval: 60000 }
  );

  const confirmReceiptMutation = useMutation(
    (transactionId) => dataService.updateDeliveryStatus(transactionId, 'DELIVERED'),
    {
      onSuccess: (data, transactionId) => {
        toast.success('Order marked as delivered successfully!');
        queryClient.invalidateQueries(['buyerTransactions', user?.id]);
        
        setTimeout(() => {
          queryClient.invalidateQueries(['buyerTransactions', user?.id]);
          queryClient.refetchQueries(['buyerTransactions', user?.id]).then(() => {
            dataService.getRatingsByTransaction(transactionId)
              .then((ratingsResponse) => {
                const ratings = ratingsResponse?.data || [];
                const hasRating = ratings.some(r => r.rater?.id === user?.id);

                if (!hasRating) {
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

  const isPageLoading = enquiriesLoading || transactionsLoading || inventoryLoading;

  if (isPageLoading) {
    return (
      <DashboardLayout title="Buyer Dashboard" subtitle="Loading crop marketplace and orders...">
        <div style={{ padding: '24px 0' }}>
          <LoadingState type="skeleton-cards" cardsCount={3} />
          <div style={{ marginTop: '32px' }}>
            <LoadingState type="spinner" message="Syncing payment statuses and shipments..." />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Buyer Dashboard" subtitle="Track your purchases, payments, and deliveries">
      {/* Stat Grid */}
      <div className="stats-grid" style={{ marginBottom: '32px' }}>
        <StatCard
          title="Total Spent"
          value={`RWF ${totalSpent.toLocaleString()}`}
          icon={DollarSign}
          color="var(--primary-green)"
        />
        <StatCard
          title="Total Paid Orders"
          value={totalOrders.toString()}
          icon={ShoppingCart}
          color="#3b82f6"
        />
        <StatCard
          title="Completed Deliveries"
          value={completedOrders.toString()}
          icon={CheckCircle}
          color="#10b981"
        />
        <StatCard
          title="Pending Payments"
          value={pendingPayments.length.toString()}
          icon={Clock}
          color="#f59e0b"
          onClick={() => navigate('/enquiries')}
        />
      </div>

      {/* Available Crops */}
      {availableInventory && availableInventory.length > 0 && (
        <div className="dashboard-section" style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', margin: 0 }}>Available Crop Offers</h2>
            <Button
              variant="outline"
              size="small"
              icon={Eye}
              onClick={() => navigate('/browse-crops')}
            >
              Browse All
            </Button>
          </div>
          
          <div className="items-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {availableInventory.map((item) => {
              const imageUrl = item.cropImageUrl || item.cropType?.imageUrl;
              const price = item.cropType?.pricePerKg || 0;
              const hasPendingEnquiry = myEnquiries?.some(e => e.inventory?.id === item.id && e.status === 'PENDING');
              const hasAcceptedEnquiry = myEnquiries?.some(e => e.inventory?.id === item.id && e.status === 'ACCEPTED');
              
              return (
                <div key={item.id} className="item-card" style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                  <div className="item-image" style={{ height: '160px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--background-beige)' }}>
                    {imageUrl ? (
                      <img
                        src={imageUrl.startsWith('http') 
                          ? imageUrl 
                          : `${process.env.REACT_APP_API_URL ?? 'http://localhost:8081/api'}/files/crop-types/${imageUrl}`}
                        alt={item.cropType?.cropName || 'Crop'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextElementSibling) {
                            e.target.nextElementSibling.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div className="item-image-placeholder" style={{ display: imageUrl ? 'none' : 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)' }}>
                      <Package size={48} />
                    </div>
                  </div>
                  
                  <div className="item-content" style={{ padding: '16px' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: 'var(--text-dark)' }}>{item.cropType?.cropName || 'Unknown Crop'}</h3>
                    <div className="item-price" style={{ color: 'var(--primary-green)', fontWeight: '700', fontSize: '15px', marginBottom: '12px' }}>
                      RWF {price.toLocaleString()} / {item.cropType?.measurementUnit || 'KG'}
                    </div>
                    <div className="item-details" style={{ fontSize: '13px', color: 'var(--text-light)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span><strong>Stock:</strong> {parseFloat(item.remainingQuantityKg || 0).toFixed(2)} {item.cropType?.measurementUnit || 'KG'}</span>
                      <span><strong>Farmer:</strong> {item.farmer?.firstName || ''} {item.farmer?.lastName || ''}</span>
                      {item.warehouse?.warehouseName && (
                        <span><strong>Warehouse:</strong> {item.warehouse.warehouseName}</span>
                      )}
                      {item.qualityGrade && (
                        <span><strong>Grade:</strong> {item.qualityGrade}</span>
                      )}
                    </div>
                    
                    {hasPendingEnquiry ? (
                      <div style={{ padding: '10px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a', textAlign: 'center', fontSize: '13px', color: '#b45309', marginTop: '16px', fontWeight: '500' }}>
                        Enquiry Pending
                      </div>
                    ) : hasAcceptedEnquiry ? (
                      <Button
                        variant="success"
                        icon={CreditCard}
                        onClick={() => {
                          const acceptedEnquiry = myEnquiries.find(e => e.inventory?.id === item.id && e.status === 'ACCEPTED');
                          const transactionId = acceptedEnquiry?.transaction?.id || acceptedEnquiry?.transactionId;
                          if (transactionId) {
                            navigate(`/payment/${transactionId}`);
                          } else {
                            toast.error('Transaction not found for accepted enquiry');
                          }
                        }}
                        style={{ width: '100%', marginTop: '16px' }}
                      >
                        Proceed to Payment
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        icon={MessageSquare}
                        onClick={() => navigate(`/inventory?inventoryId=${item.id}&action=enquiry`)}
                        style={{ width: '100%', marginTop: '16px' }}
                      >
                        Send Enquiry
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pending Payments */}
      {pendingPayments.length > 0 && (
        <div className="dashboard-section" style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>Enquiries Awaiting Payment</h2>
          <div className="pending-payments-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {pendingPayments.map((enquiry) => (
              <div key={enquiry.id} className="payment-card" style={{ padding: '20px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
                <div className="payment-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>{enquiry.inventory?.cropType?.cropName || 'Unknown Crop'}</h3>
                    <p style={{ color: 'var(--text-light)', fontSize: '13px', margin: 0 }}>
                      Enquiry Code: {enquiry.enquiryCode}
                    </p>
                  </div>
                  <StatusBadge status="warning" />
                </div>
                <div className="payment-details">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <span style={{ color: 'var(--text-light)', fontSize: '12px' }}>Proposed Volume</span>
                      <p style={{ fontWeight: '600', margin: '4px 0 0 0' }}>
                        {enquiry.proposedQuantityKg} {enquiry.inventory?.cropType?.measurementUnit || 'KG'}
                      </p>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-light)', fontSize: '12px' }}>Agreed Price</span>
                      <p style={{ fontWeight: '600', margin: '4px 0 0 0' }}>
                        RWF {enquiry.proposedPricePerKg?.toLocaleString()} / KG
                      </p>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-light)', fontSize: '12px' }}>Total Invoice</span>
                      <p style={{ fontWeight: '700', fontSize: '18px', color: 'var(--primary-green)', margin: '4px 0 0 0' }}>
                        RWF {enquiry.proposedTotalAmount?.toLocaleString()}
                      </p>
                    </div>
                  </div>
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
                    Pay Invoice
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shipment Tracking */}
      {paidTransactions.filter(t => t.deliveryStatus === 'SHIPPED' || t.deliveryStatus === 'PROCESSING').length > 0 && (
        <div className="dashboard-section" style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', marginBottom: '32px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', marginBottom: '20px' }}>
            <Truck size={20} />
            Shipment Tracking & Transit
          </h2>
          <div className="transactions-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {paidTransactions
              .filter(t => t.deliveryStatus === 'SHIPPED' || t.deliveryStatus === 'PROCESSING')
              .map((transaction) => (
                <div key={transaction.id} className="transaction-card" style={{ padding: '20px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
                  <div className="transaction-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>{transaction.inventory?.cropType?.cropName || 'Unknown Crop'}</h3>
                      <p style={{ color: 'var(--text-light)', fontSize: '13px', margin: 0 }}>
                        Code: {transaction.transactionCode}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <StatusBadge status={transaction.paymentStatus} />
                      <StatusBadge status={transaction.deliveryStatus} />
                    </div>
                  </div>
                  
                  <div className="transaction-details">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <span style={{ color: 'var(--text-light)', fontSize: '12px' }}>Quantity</span>
                        <p style={{ fontWeight: '600', margin: '4px 0 0 0' }}>
                          {transaction.quantityKg} {transaction.inventory?.cropType?.measurementUnit || 'KG'}
                        </p>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-light)', fontSize: '12px' }}>Amount paid</span>
                        <p style={{ fontWeight: '600', margin: '4px 0 0 0' }}>
                          RWF {transaction.totalAmount?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-light)', fontSize: '12px' }}>Storage Warehouse</span>
                        <p style={{ fontWeight: '600', margin: '4px 0 0 0' }}>
                          {transaction.inventory?.warehouse?.warehouseName || 'Assigned Warehouse'}
                        </p>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '12px' }}>
                      {transaction.deliveryStatus === 'SHIPPED' ? (
                        <>
                          <Button
                            variant="success"
                            size="small"
                            icon={PackageCheck}
                            onClick={() => handleConfirmReceipt(transaction.id)}
                            disabled={confirmReceiptMutation.isLoading}
                          >
                            {confirmReceiptMutation.isLoading ? 'Confirming...' : 'Confirm Delivery Received'}
                          </Button>
                        </>
                      ) : (
                        <p style={{ color: 'var(--text-light)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                          <Clock size={16} />
                          Storekeeper is preparing this order for dispatch
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Order Tracking Stats and list */}
      <div className="dashboard-section" style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', marginBottom: '24px' }}>
          <Truck size={20} />
          Complete Order History & Receipts
        </h2>

        {/* Small inner grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <div style={{ padding: '16px', background: 'var(--primary-green-light)', border: '1px solid var(--primary-green-medium)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '12px', color: 'var(--primary-green-dark)', textTransform: 'uppercase', fontWeight: '600' }}>Pending Delivery</span>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '8px 0 0 0', color: 'var(--primary-green-dark)' }}>{pendingDelivery}</p>
          </div>
          <div style={{ padding: '16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '12px', color: '#1e40af', textTransform: 'uppercase', fontWeight: '600' }}>Processing</span>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '8px 0 0 0', color: '#1e40af' }}>{processingOrders}</p>
          </div>
          <div style={{ padding: '16px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '12px', color: '#065f46', textTransform: 'uppercase', fontWeight: '600' }}>Transit/Shipped</span>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '8px 0 0 0', color: '#065f46' }}>{shippedOrders}</p>
          </div>
          <div style={{ padding: '16px', background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '12px', color: '#5b21b6', textTransform: 'uppercase', fontWeight: '600' }}>Delivered Total</span>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '8px 0 0 0', color: '#5b21b6' }}>{completedOrders}</p>
          </div>
        </div>

        {paidTransactions.length > 0 ? (
          <div className="transactions-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {paidTransactions
              .slice()
              .sort((a, b) => new Date(b.transactionDate || b.paymentDate) - new Date(a.transactionDate || a.paymentDate))
              .map((transaction) => (
                <div key={transaction.id} className="transaction-card" style={{ padding: '20px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
                  <div className="transaction-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>{transaction.inventory?.cropType?.cropName || 'Unknown Crop'}</h3>
                      <p style={{ color: 'var(--text-light)', fontSize: '12px', margin: 0 }}>
                        Invoice ID: {transaction.transactionCode} | Date: {new Date(transaction.paymentDate || transaction.transactionDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <StatusBadge status={transaction.paymentStatus} />
                      <StatusBadge status={transaction.deliveryStatus} />
                    </div>
                  </div>
                  
                  <div className="transaction-details" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-gray)' }}>
                      <span>Purchased: <strong>{transaction.quantityKg} KG</strong> for <strong>RWF {transaction.totalAmount?.toLocaleString()}</strong></span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <Button
                        variant="outline"
                        size="small"
                        icon={Eye}
                        onClick={() => navigate(`/receipts`)}
                      >
                        Download Receipt
                      </Button>
                      
                      {transaction.deliveryStatus === 'DELIVERED' && (
                        <>
                          {!transactionRatings?.[transaction.id] ? (
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
                          ) : (
                            <span style={{ fontSize: '12px', color: '#8b5cf6', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Star size={14} fill="#8b5cf6" /> Rated
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-light)', fontStyle: 'italic', textAlign: 'center', padding: '24px' }}>No orders found.</p>
        )}
      </div>

      <RatingModal
        isOpen={ratingModalOpen}
        onClose={() => {
          setRatingModalOpen(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
      />
    </DashboardLayout>
  );
};

export default BuyerDashboard;
