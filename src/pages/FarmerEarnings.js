import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/dataService';
import Sidebar from '../components/layout/Sidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';

import Button from '../components/common/Button';
import { DollarSign, Wallet, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, X, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import './Dashboard.css';

const FarmerEarnings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [pendingWithdrawal, setPendingWithdrawal] = useState(null);
  const [withdrawalData, setWithdrawalData] = useState({
    amount: '',
    withdrawalMethod: 'MOBILE_MONEY',
    accountNumber: '',
    accountName: '',
    bankName: ''
  });
  const [otpCode, setOtpCode] = useState('');

  

  const { data: wallet, isLoading: walletLoading } = useQuery(
    ['wallet', user?.id],
    async () => {
      if (!user?.id) return null;
      try {
        const response = await dataService.getWallet();
        return response.data || response;
      } catch (error) {
        return null;
      }
    },
    { enabled: !!user?.id, refetchInterval: 30000 }
  );

  

  const { data: transactions, isLoading: transactionsLoading } = useQuery(
    ['sellerTransactions', user?.id],
    async () => {
      if (!user?.id) return [];
      try {
        const response = await dataService.getSellerTransactions(user.id);
        return response.data || [];
      } catch (error) {
        return [];
      }
    },
    { enabled: !!user?.id }
  );

  

  const { data: withdrawals } = useQuery(
    ['withdrawals', user?.id],
    async () => {
      if (!user?.id) return [];
      try {
        const response = await dataService.getWithdrawals();
        return response.data || [];
      } catch (error) {
        return [];
      }
    },
    { enabled: !!user?.id }
  );

  

  const paidTransactions = transactions?.filter(t => t.paymentStatus === 'PAID') || [];
  const totalEarned = wallet?.totalEarned || 0;
  const availableBalance = wallet?.balance || 0;
  const totalWithdrawn = wallet?.totalWithdrawn || 0;

  

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisYear = new Date(now.getFullYear(), 0, 1);

  const dailyEarnings = paidTransactions
    .filter(t => new Date(t.paymentDate || t.transactionDate) >= today)
    .reduce((sum, t) => sum + parseFloat(t.netAmount || 0), 0);

  const monthlyEarnings = paidTransactions
    .filter(t => new Date(t.paymentDate || t.transactionDate) >= thisMonth)
    .reduce((sum, t) => sum + parseFloat(t.netAmount || 0), 0);

  const yearlyEarnings = paidTransactions
    .filter(t => new Date(t.paymentDate || t.transactionDate) >= thisYear)
    .reduce((sum, t) => sum + parseFloat(t.netAmount || 0), 0);

  

  const requestWithdrawalMutation = useMutation(
    (data) => dataService.requestWithdrawal(data),
    {
      onSuccess: (response) => {
        const withdrawal = response.data || response;
        setPendingWithdrawal(withdrawal);
        setShowWithdrawalModal(false);
        setShowOtpModal(true);
        toast.success('OTP sent to your email. Please check and enter the code to complete withdrawal.');
        queryClient.invalidateQueries(['wallet', user?.id]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to request withdrawal');
      }
    }
  );

  

  const verifyOtpMutation = useMutation(
    ({ withdrawalId, otpCode }) => dataService.verifyWithdrawalOtp(withdrawalId, otpCode),
    {
      onSuccess: () => {
        toast.success('Withdrawal completed successfully!');
        setShowOtpModal(false);
        setPendingWithdrawal(null);
        setOtpCode('');
        setWithdrawalData({
          amount: '',
          withdrawalMethod: 'MOBILE_MONEY',
          accountNumber: '',
          accountName: '',
          bankName: ''
        });
        queryClient.invalidateQueries(['wallet', user?.id]);
        queryClient.invalidateQueries(['withdrawals', user?.id]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Invalid OTP code');
      }
    }
  );

  const handleRequestWithdrawal = (e) => {
    e.preventDefault();
    if (parseFloat(withdrawalData.amount) > availableBalance) {
      toast.error('Insufficient balance');
      return;
    }
    requestWithdrawalMutation.mutate(withdrawalData);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (!pendingWithdrawal) return;
    verifyOtpMutation.mutate({
      withdrawalId: pendingWithdrawal.id,
      otpCode: otpCode
    });
  };

  if (walletLoading) {
    return (
      <div className="dashboard">
        <Sidebar />
        <div className="dashboard-container">
          <p>Loading earnings data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboard-container">
        <DashboardHeader />
        {}
        <div className="stats-grid" style={{ marginBottom: '32px' }}>
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #2ea359 0%, #059669 100%)', color: 'white' }}>
            <div className="stat-icon" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <Wallet size={24} style={{ color: 'white' }} />
            </div>
            <div className="stat-content">
              <h3 style={{ color: 'rgba(255,255,255,0.9)' }}>Available Balance</h3>
              <p className="stat-value" style={{ color: 'white', fontSize: '32px' }}>
                RWF {availableBalance.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white' }}>
            <div className="stat-icon" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <TrendingUp size={24} style={{ color: 'white' }} />
            </div>
            <div className="stat-content">
              <h3 style={{ color: 'rgba(255,255,255,0.9)' }}>Total Earned</h3>
              <p className="stat-value" style={{ color: 'white', fontSize: '32px' }}>
                RWF {totalEarned.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white' }}>
            <div className="stat-icon" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <TrendingDown size={24} style={{ color: 'white' }} />
            </div>
            <div className="stat-content">
              <h3 style={{ color: 'rgba(255,255,255,0.9)' }}>Total Withdrawn</h3>
              <p className="stat-value" style={{ color: 'white', fontSize: '32px' }}>
                RWF {totalWithdrawn.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {}
        <div className="stats-grid" style={{ marginBottom: '32px' }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#2ea35920' }}>
              <DollarSign size={24} style={{ color: '#2ea359' }} />
            </div>
            <div className="stat-content">
              <h3>Today's Earnings</h3>
              <p className="stat-value">RWF {dailyEarnings.toLocaleString()}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#3b82f620' }}>
              <DollarSign size={24} style={{ color: '#3b82f6' }} />
            </div>
            <div className="stat-content">
              <h3>This Month</h3>
              <p className="stat-value">RWF {monthlyEarnings.toLocaleString()}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#f59e0b20' }}>
              <DollarSign size={24} style={{ color: '#f59e0b' }} />
            </div>
            <div className="stat-content">
              <h3>This Year</h3>
              <p className="stat-value">RWF {yearlyEarnings.toLocaleString()}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#8b5cf620' }}>
              <CheckCircle size={24} style={{ color: '#8b5cf6' }} />
            </div>
            <div className="stat-content">
              <h3>Total Sales</h3>
              <p className="stat-value">{paidTransactions.length}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ marginBottom: '32px', display: 'flex', gap: '12px' }}>
          <Button
            variant="primary"
            icon={Wallet}
            onClick={() => setShowWithdrawalModal(true)}
            disabled={availableBalance <= 0}
          >
            Request Withdrawal
          </Button>
        </div>

        {/* Transaction History */}
        <div className="dashboard-section">
          <h2>Transaction History</h2>
          {transactionsLoading ? (
            <p>Loading transactions...</p>
          ) : paidTransactions.length > 0 ? (
            <div className="transactions-list">
              {paidTransactions.map((transaction) => (
                <div key={transaction.id} className="transaction-card">
                  <div className="transaction-header">
                    <div>
                      <h3>{transaction.inventory?.cropType?.cropName || 'Unknown Crop'}</h3>
                      <p style={{ color: '#666', fontSize: '14px' }}>
                        Transaction: {transaction.transactionCode}
                      </p>
                    </div>
                    <span className={`badge badge-${transaction.paymentStatus?.toLowerCase()}`}>
                      {transaction.paymentStatus}
                    </span>
                  </div>
                  <div className="transaction-details">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div>
                        <p style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>Quantity</p>
                        <p style={{ fontWeight: '600' }}>
                          {transaction.quantityKg} {transaction.inventory?.cropType?.measurementUnit || 'KG'}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>Gross Amount</p>
                        <p style={{ fontWeight: '600' }}>RWF {transaction.totalAmount?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>Service Fee (5%)</p>
                        <p style={{ fontWeight: '600', color: '#ef4444' }}>
                          RWF {transaction.commission?.toLocaleString()}
                        </p>
                      </div>
                      <div style={{ gridColumn: '1 / -1', paddingTop: '12px', borderTop: '2px solid #f0f0f0' }}>
                        <p style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>Net Earnings</p>
                        <p style={{ fontWeight: '700', fontSize: '20px', color: '#2ea359' }}>
                          RWF {transaction.netAmount?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <p style={{ fontSize: '12px', color: '#999', marginTop: '12px' }}>
                      Date: {new Date(transaction.paymentDate || transaction.transactionDate).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No transactions yet</p>
          )}
        </div>

        {/* Withdrawal History */}
        {withdrawals && withdrawals.length > 0 && (
          <div className="dashboard-section">
            <h2>Withdrawal History</h2>
            <div className="withdrawals-list">
              {withdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="transaction-card">
                  <div className="transaction-header">
                    <div>
                      <h3>Withdrawal {withdrawal.withdrawalCode}</h3>
                      <p style={{ color: '#666', fontSize: '14px' }}>
                        {withdrawal.withdrawalMethod} - {withdrawal.accountNumber}
                      </p>
                    </div>
                    <span className={`badge badge-${withdrawal.status?.toLowerCase()}`}>
                      {withdrawal.status}
                    </span>
                  </div>
                  <div className="transaction-details">
                    <p><strong>Amount:</strong> RWF {withdrawal.amount?.toLocaleString()}</p>
                    <p><strong>Date:</strong> {new Date(withdrawal.requestDate).toLocaleString()}</p>
                    {withdrawal.processedDate && (
                      <p><strong>Processed:</strong> {new Date(withdrawal.processedDate).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Withdrawal Modal */}
        {showWithdrawalModal && (
          <div className="modal-overlay" onClick={() => setShowWithdrawalModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
              <div className="modal-header">
                <h2>Request Withdrawal</h2>
                <Button variant="outline" size="small" className="modal-close" onClick={() => setShowWithdrawalModal(false)} icon={X} />
              </div>
              <div className="modal-body">
                <div style={{ marginBottom: '20px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                  <p><strong>Available Balance:</strong> RWF {availableBalance.toLocaleString()}</p>
                </div>
                <form onSubmit={handleRequestWithdrawal}>
                  <div className="form-group">
                    <label htmlFor="amount">Withdrawal Amount (RWF) *</label>
                    <input
                      type="number"
                      id="amount"
                      value={withdrawalData.amount}
                      onChange={(e) => setWithdrawalData({ ...withdrawalData, amount: e.target.value })}
                      required
                      min="0.01"
                      max={availableBalance}
                      step="0.01"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="withdrawalMethod">Withdrawal Method *</label>
                    <select
                      id="withdrawalMethod"
                      value={withdrawalData.withdrawalMethod}
                      onChange={(e) => setWithdrawalData({ ...withdrawalData, withdrawalMethod: e.target.value })}
                      required
                    >
                      <option value="MOBILE_MONEY">MTN Mobile Money</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="accountNumber">
                      {withdrawalData.withdrawalMethod === 'MOBILE_MONEY' ? 'Mobile Money Number *' : 'Account Number *'}
                    </label>
                    <input
                      type="text"
                      id="accountNumber"
                      value={withdrawalData.accountNumber}
                      onChange={(e) => setWithdrawalData({ ...withdrawalData, accountNumber: e.target.value })}
                      required
                      placeholder={withdrawalData.withdrawalMethod === 'MOBILE_MONEY' ? '+250788123456' : 'Account number'}
                    />
                  </div>

                  {withdrawalData.withdrawalMethod === 'BANK_TRANSFER' && (
                    <>
                      <div className="form-group">
                        <label htmlFor="accountName">Account Name *</label>
                        <input
                          type="text"
                          id="accountName"
                          value={withdrawalData.accountName}
                          onChange={(e) => setWithdrawalData({ ...withdrawalData, accountName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="bankName">Bank Name *</label>
                        <input
                          type="text"
                          id="bankName"
                          value={withdrawalData.bankName}
                          onChange={(e) => setWithdrawalData({ ...withdrawalData, bankName: e.target.value })}
                          required
                        />
                      </div>
                    </>
                  )}

                  <div className="modal-actions">
                    <Button variant="outline" icon={X} onClick={() => setShowWithdrawalModal(false)}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      icon={Wallet}
                      disabled={requestWithdrawalMutation.isLoading}
                    >
                      {requestWithdrawalMutation.isLoading ? 'Processing...' : 'Request Withdrawal'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* OTP Verification Modal */}
        {showOtpModal && pendingWithdrawal && (
          <div className="modal-overlay" onClick={() => setShowOtpModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
              <div className="modal-header">
                <h2>Verify OTP</h2>
                <Button variant="outline" size="small" className="modal-close" onClick={() => setShowOtpModal(false)} icon={X} />
              </div>
              <div className="modal-body">
                <p style={{ marginBottom: '20px' }}>
                  An OTP has been sent to your registered email address. Please enter the code to complete your withdrawal.
                </p>
                <form onSubmit={handleVerifyOtp}>
                  <div className="form-group">
                    <label htmlFor="otpCode">OTP Code (6 digits) *</label>
                    <input
                      type="text"
                      id="otpCode"
                      value={otpCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setOtpCode(value);
                      }}
                      required
                      maxLength={6}
                      placeholder="000000"
                      style={{ fontSize: '24px', letterSpacing: '8px', textAlign: 'center', fontFamily: 'monospace' }}
                    />
                  </div>
                  <div style={{ marginBottom: '20px', padding: '12px', background: '#fff3cd', borderRadius: '8px', fontSize: '14px' }}>
                    <p><strong>Withdrawal Details:</strong></p>
                    <p>Amount: RWF {pendingWithdrawal.amount?.toLocaleString()}</p>
                    <p>Method: {pendingWithdrawal.withdrawalMethod}</p>
                    <p>Account: {pendingWithdrawal.accountNumber}</p>
                  </div>
                  <div className="modal-actions">
                    <Button variant="outline" icon={X} onClick={() => setShowOtpModal(false)}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      icon={ShieldCheck}
                      disabled={verifyOtpMutation.isLoading || otpCode.length !== 6}
                    >
                      {verifyOtpMutation.isLoading ? 'Verifying...' : 'Verify & Complete'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmerEarnings;

