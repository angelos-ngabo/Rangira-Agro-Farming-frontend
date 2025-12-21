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

  // Card payment fields
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
        console.error('Error fetching transaction:', error);
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
        const errorMessage = error.response?.data?.message || error.message || 'Failed to process payment';
        toast.error(errorMessage);
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

    // Only require payment reference for MOBILE_MONEY and BANK_TRANSFER
    if ((paymentMethod === 'MOBILE_MONEY' || paymentMethod === 'BANK_TRANSFER') && !paymentReference.trim()) {
      toast.error('Please enter payment reference');
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmPayment = () => {
    let paymentRef = null;

    // Only set payment reference for MOBILE_MONEY and BANK_TRANSFER
    if (paymentMethod === 'MOBILE_MONEY' || paymentMethod === 'BANK_TRANSFER') {
      paymentRef = paymentReference.trim() || null;
    }
    // For CARD payments, don't use reference at all

    processPaymentMutation.mutate({
      transactionId: transaction.id,
      amount: transaction.totalAmount,
      paymentMethod: paymentMethod,
      paymentReference: paymentRef,
      notes: paymentMethod === 'CARD'
        ? `Card payment - ${cardholderName}, Billing: ${billingAddress}, ${billingCity} ${billingPostalCode}`
        : `Payment for transaction ${transaction.transactionCode}`
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
      console.error('Error viewing receipt:', error);
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
      console.error('Error downloading receipt:', error);
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
          {/* Transaction Summary */}
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

          {/* Payment Form */}
          <div className="payment-form-card">
            <h2 style={{ marginBottom: '20px', color: '#116530' }}>Payment Details</h2>

            <form onSubmit={handleSubmitPayment}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label htmlFor="paymentMethod">Payment Method *</label>
                <select
                  id="paymentMethod"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  required
                >
                  <option value="CARD">Credit/Debit Card</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>

              {paymentMethod === 'CARD' && (
                <>
                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label htmlFor="cardNumber">Card Number *</label>
                    <input
                      type="text"
                      id="cardNumber"
                      value={cardNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
                        const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                        setCardNumber(formatted);
                      }}
                      maxLength={19}
                      placeholder="1234 5678 9012 3456"
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label htmlFor="cardholderName">Cardholder Name *</label>
                    <input
                      type="text"
                      id="cardholderName"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                    <div className="form-group">
                      <label htmlFor="expiryMonth">Expiry Month *</label>
                      <select
                        id="expiryMonth"
                        value={expiryMonth}
                        onChange={(e) => setExpiryMonth(e.target.value)}
                        required
                      >
                        <option value="">MM</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                          <option key={month} value={String(month).padStart(2, '0')}>
                            {String(month).padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="expiryYear">Expiry Year *</label>
                      <select
                        id="expiryYear"
                        value={expiryYear}
                        onChange={(e) => setExpiryYear(e.target.value)}
                        required
                      >
                        <option value="">YYYY</option>
                        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="cvc">CVC *</label>
                      <input
                        type="text"
                        id="cvc"
                        value={cvc}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          setCvc(value.slice(0, 4));
                        }}
                        maxLength={4}
                        placeholder="123"
                        required
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                    <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#116530' }}>Billing Details</h3>
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label htmlFor="billingAddress">Billing Address *</label>
                      <input
                        type="text"
                        id="billingAddress"
                        value={billingAddress}
                        onChange={(e) => setBillingAddress(e.target.value)}
                        placeholder="Street address"
                        required
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label htmlFor="billingCity">City *</label>
                        <input
                          type="text"
                          id="billingCity"
                          value={billingCity}
                          onChange={(e) => setBillingCity(e.target.value)}
                          placeholder="City"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="billingPostalCode">Postal Code *</label>
                        <input
                          type="text"
                          id="billingPostalCode"
                          value={billingPostalCode}
                          onChange={(e) => setBillingPostalCode(e.target.value)}
                          placeholder="00000"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {paymentMethod === 'MOBILE_MONEY' && (
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label htmlFor="paymentReference">Mobile Money Reference/Transaction ID *</label>
                  <input
                    type="text"
                    id="paymentReference"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    required
                    placeholder="Enter transaction ID"
                  />
                </div>
              )}

              {paymentMethod === 'BANK_TRANSFER' && (
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label htmlFor="paymentReference">Bank Transfer Reference *</label>
                  <input
                    type="text"
                    id="paymentReference"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    required
                    placeholder="Enter transfer reference"
                  />
                </div>
              )}

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

        {/* Confirmation Modal */}
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
                <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                  <p><strong>Amount:</strong> RWF {transaction.totalAmount?.toLocaleString()}</p>
                  <p><strong>Payment Method:</strong> {paymentMethod.replace('_', ' ')}</p>
                  {/* Only show reference for MOBILE_MONEY and BANK_TRANSFER */}
                  {(paymentMethod === 'MOBILE_MONEY' || paymentMethod === 'BANK_TRANSFER') && paymentReference && (
                    <p><strong>Reference:</strong> {paymentReference}</p>
                  )}
                  {paymentMethod === 'CARD' && (
                    <p><strong>Card:</strong> **** **** **** {cardNumber.replace(/\s/g, '').slice(-4)}</p>
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

