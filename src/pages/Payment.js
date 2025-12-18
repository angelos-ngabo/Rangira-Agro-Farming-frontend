import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/dataService';
import Sidebar from '../components/layout/Sidebar';

import Button from '../components/common/Button';
import { CreditCard, DollarSign, Package, CheckCircle, ArrowLeft, X, FileText, FileDown, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import './Dashboard.css';

const Payment = () => {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [paymentReference, setPaymentReference] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  

  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [cvc, setCvc] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingPostalCode, setBillingPostalCode] = useState('');

  const { data: transaction, isLoading, error } = useQuery(
    ['transaction', transactionId],
    async () => {
      if (!transactionId) return null;
      try {
        const response = await dataService.getTransactionById(transactionId);
        return response.data || response;
      } catch (error) {
        throw error;
      }
    },
    { enabled: !!transactionId }
  );

  const processPaymentMutation = useMutation(
    (data) => dataService.processPayment(data),
    {
      onSuccess: () => {
        toast.success('Payment processed successfully! Invoice has been sent to your email.');
        queryClient.invalidateQueries('buyerEnquiries');
        queryClient.invalidateQueries('availableItems');
        queryClient.invalidateQueries(['transaction', transactionId]);
        navigate('/receipts');
      },
      onError: (error) => {
        let errorMessage = 'Failed to process payment';
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.status === 409) {
          errorMessage = 'This payment has already been processed. Please check your receipts.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        toast.error(errorMessage);
        

        if (error.response?.status === 409) {
          setTimeout(() => navigate('/receipts'), 2000);
        }
      }
    }
  );

  const handleSubmitPayment = (e) => {
    e.preventDefault();

    if (!transaction) {
      toast.error('Transaction not found');
      return;
    }

    if (transaction.paymentStatus === 'PAID') {
      toast.error('This transaction has already been paid');
      navigate('/receipts');
      return;
    }

    

    if ((paymentMethod === 'MOBILE_MONEY' || paymentMethod === 'BANK_TRANSFER') && !paymentReference.trim()) {
      toast.error('Please enter payment reference');
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmPayment = () => {
    if (!paymentReference.trim()) {
      toast.error('Please enter Mobile Money transaction reference');
      return;
    }

    processPaymentMutation.mutate({
      transactionId: transaction.id,
      amount: transaction.totalAmount,
      paymentMethod: 'MOBILE_MONEY',
      paymentReference: paymentReference.trim(),
      notes: `Mobile Money payment for transaction ${transaction.transactionCode}`
    });
    setShowConfirmModal(false);
  };

  if (isLoading) {
    return (
      <div className="dashboard">
        <Sidebar />

        <div className="dashboard-container">
          <p>Loading transaction details...</p>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="dashboard">
        <Sidebar />

        <div className="dashboard-container">
          <div className="error-message">Transaction not found or access denied</div>
          <Button variant="outline" onClick={() => navigate('/buyer/dashboard')}>
            <ArrowLeft size={16} />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const handleViewReceipt = async () => {
    try {
      const response = await dataService.getReceiptByTransactionId(transaction.id);
      const blob = new Blob([response.data], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');
      if (!newWindow) {
        toast.error('Please allow popups to view receipt');
      }
    } catch (error) {
      toast.error('Failed to view receipt');
    }
  };

  const handleDownloadReceipt = async () => {
    try {
      const response = await dataService.downloadReceipt(transaction.id);
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
      toast.error('Failed to download receipt');
    }
  };

  if (transaction.paymentStatus === 'PAID') {
    return (
      <div className="dashboard">
        <Sidebar />

        <div className="dashboard-container">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <CheckCircle size={64} style={{ color: '#2ea359', marginBottom: '20px' }} />
            <h2>Payment Already Completed</h2>
            <p>This transaction has already been paid.</p>
            <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button variant="primary" icon={Eye} onClick={handleViewReceipt}>
                View Receipt
              </Button>
              <Button variant="outline" icon={FileDown} onClick={handleDownloadReceipt}>
                Download Receipt
              </Button>
              <Button variant="outline" onClick={() => navigate('/receipts')}>
                All Receipts
              </Button>
              <Button variant="outline" onClick={() => navigate('/buyer/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Sidebar />

      <div className="dashboard-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <Button variant="outline" icon={ArrowLeft} onClick={() => navigate('/buyer/dashboard')}>
            Back
          </Button>
          <h1 style={{ margin: 0 }}>Complete Payment</h1>
          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Transaction #{transaction.transactionCode}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginTop: '24px' }}>
          {}
          <div className="payment-summary-card">
            <h2 style={{ marginBottom: '20px', color: '#116530' }}>Transaction Summary</h2>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Package size={20} />
                <strong>{transaction.inventory?.cropType?.cropName || 'Unknown Crop'}</strong>
              </div>
              <p style={{ color: '#666', marginBottom: '8px' }}>
                Quantity: {transaction.quantityKg} {transaction.inventory?.cropType?.measurementUnit || 'KG'}
              </p>
              <p style={{ color: '#666', marginBottom: '8px' }}>
                Unit Price: RWF {transaction.unitPrice?.toLocaleString()} per {transaction.inventory?.cropType?.measurementUnit || 'KG'}
              </p>
              <p style={{ color: '#666' }}>
                Seller: {transaction.seller?.firstName} {transaction.seller?.lastName}
              </p>
            </div>

            <div style={{ borderTop: '2px solid #f0f0f0', paddingTop: '16px', marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Subtotal:</span>
                <span>RWF {transaction.totalAmount?.toLocaleString()}</span>
              </div>
              {transaction.storageFee && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#666' }}>
                  <span>Storage Fee:</span>
                  <span>RWF {transaction.storageFee.toLocaleString()}</span>
                </div>
              )}
              {transaction.transactionFee && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#666' }}>
                  <span>Transaction Fee:</span>
                  <span>RWF {transaction.transactionFee.toLocaleString()}</span>
                </div>
              )}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '2px solid #116530',
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#116530'
              }}>
                <span>Total Amount:</span>
                <span>RWF {transaction.totalAmount?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {}
          <div className="payment-form-card">
            <h2 style={{ marginBottom: '20px', color: '#116530' }}>Payment Details</h2>

            <form onSubmit={handleSubmitPayment}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label htmlFor="paymentReference">
                  <strong>Mobile Money Transaction Reference *</strong>
                </label>
                <input
                  type="text"
                  id="paymentReference"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  required
                  placeholder="Enter your Mobile Money transaction ID (e.g., MTN-123456789)"
                  style={{ fontSize: '16px', padding: '12px' }}
                />
                <small className="form-hint" style={{ display: 'block', marginTop: '8px', color: '#666' }}>
                  After making the Mobile Money payment, enter the transaction reference number you received
                </small>
              </div>

              <div style={{
                background: '#f9fafb',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '24px',
                border: '1px solid #e0e0e0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '16px', fontWeight: '600' }}>Amount to Pay:</span>
                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#116530' }}>
                    RWF {transaction.totalAmount?.toLocaleString()}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <Button
                  type="button"
                  variant="outline"
                  icon={X}
                  onClick={() => navigate('/buyer/dashboard')}
                  style={{ flex: 1 }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  icon={CreditCard}
                  disabled={processPaymentMutation.isLoading}
                  style={{ flex: 2 }}
                >
                  {processPaymentMutation.isLoading ? 'Processing...' : 'Complete Payment'}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {}
        {showConfirmModal && (
          <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
              <div className="modal-header">
                <h2>Confirm Payment</h2>
                <Button variant="outline" size="small" className="modal-close" onClick={() => setShowConfirmModal(false)} icon={X} />
              </div>
              <div className="modal-body">
                <p style={{ marginBottom: '16px' }}>
                  Are you sure you want to proceed with this payment?
                </p>
                <div className="confirm-payment-details" style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                  <p><strong>Amount:</strong> RWF {transaction.totalAmount?.toLocaleString()}</p>
                  <p><strong>Payment Method:</strong> Mobile Money</p>
                  {paymentReference && (
                    <p><strong>Transaction Reference:</strong> {paymentReference}</p>
                  )}
                </div>
                <div className="modal-actions">
                  <Button variant="outline" icon={X} onClick={() => setShowConfirmModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    icon={CheckCircle}
                    onClick={handleConfirmPayment}
                    disabled={processPaymentMutation.isLoading}
                  >
                    {processPaymentMutation.isLoading ? 'Processing...' : 'Confirm Payment'}
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

export default Payment;

