import React, { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingState from '../../components/common/LoadingState';
import Button from '../../components/common/Button';
import {
  Warehouse as WarehouseIcon,
  Package,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Pencil,
  X,
  Plus,
  Eye,
  Leaf,
  Bell,
  Wallet,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import '../Dashboard.css';

const FarmerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);

  // 1. Applications query
  const { data: myApplications, isLoading: appsLoading } = useQuery(
    ['myApplications', user?.id],
    async () => {
      if (!user?.id) return [];
      try {
        const response = await dataService.getWarehouseAccesses({ userId: user.id });
        return response.data || [];
      } catch (error) {
        console.error('Error fetching applications:', error);
        return [];
      }
    },
    { enabled: !!user?.id }
  );

  const approvedAccesses = myApplications?.filter(app =>
    app.status === 'APPROVED' || app.status === 'ACTIVE'
  ) || [];

  // 2. Inventory query
  const { data: myInventory, isLoading: inventoryLoading } = useQuery(
    ['myInventory', user?.id],
    async () => {
      if (!user?.id) return [];
      try {
        const response = await dataService.getInventories({
          farmerId: user.id,
          page: 0,
          size: 100
        });
        return response.data?.content || [];
      } catch (error) {
        console.error('Error fetching inventory:', error);
        return [];
      }
    },
    { enabled: !!user?.id }
  );

  const totalStorage = myInventory?.reduce((sum, item) =>
    sum + parseFloat(item.quantityKg || 0), 0
  ) || 0;

  const totalRemaining = myInventory?.reduce((sum, item) =>
    sum + parseFloat(item.remainingQuantityKg || 0), 0
  ) || 0;

  // 3. Inventory requests query
  const { data: myInventoryRequests } = useQuery(
    ['myInventoryRequests', user?.id],
    async () => {
      if (!user?.id) return [];
      try {
        const response = await dataService.getMyInventoryRequests();
        return response.data || [];
      } catch (error) {
        console.error('Error fetching inventory requests:', error);
        return [];
      }
    },
    { enabled: !!user?.id, refetchInterval: 30000 }
  );

  const requestsWithResponses = myInventoryRequests?.filter(req =>
    req.status !== 'PENDING' && req.storekeeperResponse
  ) || [];

  // 4. Wallet query
  const { data: wallet, isLoading: walletLoading } = useQuery(
    ['wallet', user?.id],
    async () => {
      try {
        const response = await dataService.getWallet();
        return response.data || response || null;
      } catch (error) {
        console.error('Error fetching wallet:', error);
        return null;
      }
    },
    { enabled: !!user?.id }
  );

  // 5. Withdrawals query
  const { data: withdrawals = [] } = useQuery(
    ['withdrawals', user?.id],
    async () => {
      try {
        const response = await dataService.getWithdrawals();
        return response.data || response || [];
      } catch (error) {
        console.error('Error fetching withdrawals:', error);
        return [];
      }
    },
    { enabled: !!user?.id }
  );

  const isPageLoading = appsLoading || inventoryLoading || walletLoading;

  if (isPageLoading) {
    return (
      <DashboardLayout title="Farmer Dashboard" subtitle="Loading crop storage and wallet metrics...">
        <div style={{ padding: '24px 0' }}>
          <LoadingState type="skeleton-cards" cardsCount={3} />
          <div style={{ marginTop: '32px' }}>
            <LoadingState type="spinner" message="Syncing warehouse allocations..." />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Farmer Dashboard" subtitle={`Welcome back, Farmer ${user?.firstName || ''}!`}>
      {/* Stat Grid */}
      <div className="stats-grid" style={{ marginBottom: '32px' }}>
        <StatCard
          title="Total Stored Crop"
          value={`${totalStorage.toFixed(2)} KG`}
          icon={Leaf}
          color="var(--primary-green)"
        />
        <StatCard
          title="Available Inventory"
          value={`${totalRemaining.toFixed(2)} KG`}
          icon={Package}
          color="#3b82f6"
        />
        <StatCard
          title="Approved Allocations"
          value={approvedAccesses.length.toString()}
          icon={WarehouseIcon}
          color="#f59e0b"
          onClick={() => navigate('/warehouse-access/apply')}
        />
        <StatCard
          title="Wallet Balance"
          value={`RWF ${wallet?.balance ? wallet.balance.toLocaleString() : '0'}`}
          icon={Wallet}
          color="#10b981"
          onClick={() => navigate('/wallet')}
        />
      </div>

      {/* Main Dash Actions */}
      <div className="dashboard-actions" style={{ marginBottom: '32px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/warehouse-access/apply')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} />
          Apply for Warehouse Access
        </button>
        <button onClick={() => navigate('/inventory-requests/create')} className="btn-primary" style={{ background: '#3b82f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Pencil size={18} />
          Request Stock Update/Withdrawal
        </button>
        <button onClick={() => navigate('/inventory-requests')} className="btn-primary" style={{ background: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} />
          View Stock Requests
        </button>
        <button onClick={() => navigate('/wallet')} className="btn-primary" style={{ background: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Wallet size={18} />
          Manage Wallet
        </button>
      </div>

      {/* Columns for lists and wallet widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'flex-start' }}>
        
        {/* Left Side: Notifications and Applications */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Notifications / Responses */}
          {requestsWithResponses.length > 0 && (
            <div className="dashboard-section" style={{ borderLeft: '4px solid var(--primary-green)', margin: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <Bell size={20} style={{ color: 'var(--primary-green)' }} />
                <h2 style={{ margin: 0, fontSize: '18px' }}>Stock Updates</h2>
                <span style={{
                  backgroundColor: 'var(--primary-green)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '22px',
                  height: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}>
                  {requestsWithResponses.length}
                </span>
              </div>
              <div className="requests-notifications-list">
                {requestsWithResponses.slice(0, 3).map((request) => (
                  <div key={request.id} className="request-notification-card" style={{
                    background: request.status === 'APPROVED' || request.status === 'COMPLETED'
                      ? 'rgba(16, 185, 129, 0.06)'
                      : 'rgba(239, 68, 68, 0.06)',
                    borderLeft: `4px solid ${request.status === 'APPROVED' || request.status === 'COMPLETED' ? 'var(--success)' : 'var(--error)'}`,
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    boxSizing: 'border-box'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {request.status === 'APPROVED' || request.status === 'COMPLETED' ? (
                          <CheckCircle size={16} color="var(--success)" />
                        ) : (
                          <XCircle size={16} color="var(--error)" />
                        )}
                        <strong style={{ fontSize: '14px' }}>Request {request.requestCode}</strong>
                      </div>
                      <StatusBadge status={request.status} />
                    </div>
                    <p style={{ margin: '4px 0', color: 'var(--text-light)', fontSize: '13px' }}>
                      <strong>Type:</strong> {request.requestType === 'UPDATE' ? 'Update quantity' : 'Withdrawal'}
                    </p>
                    {request.storekeeperResponse && (
                      <p style={{ margin: '8px 0', padding: '10px', background: 'var(--card-bg)', border: '1px solid var(--border-light)', borderRadius: '6px', fontSize: '13px', color: 'var(--text-gray)' }}>
                        <strong>Response:</strong> {request.storekeeperResponse}
                      </p>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                        {request.processedDate
                          ? `Processed: ${new Date(request.processedDate).toLocaleDateString()}`
                          : `Updated: ${new Date(request.updatedAt || request.createdAt).toLocaleDateString()}`
                        }
                      </span>
                      <button 
                        onClick={() => navigate('/inventory-requests')}
                        style={{ border: 'none', background: 'none', color: 'var(--primary-green)', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        Details <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Access Applications */}
          <div className="dashboard-section" style={{ margin: 0 }}>
            <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>Warehouse Access Requests</h2>
            {myApplications && myApplications.length > 0 ? (
              <div className="applications-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {myApplications.map((app) => (
                  <div key={app.id} className="application-card" style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', boxSizing: 'border-box' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--text-dark)' }}>{app.warehouse?.warehouseName}</h4>
                        {app.status === 'PENDING' && (
                          <button
                            onClick={() => {
                              setSelectedApplication(app);
                              setShowEditModal(true);
                            }}
                            style={{ background: 'none', border: '1px solid var(--border-light)', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-gray)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                          >
                            <Pencil size={12} /> Edit
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: 'var(--text-light)' }}>
                        <span>Capacity Requested: <strong>{app.requestedCapacityKg} KG</strong></span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                          <span>Status:</span>
                          <StatusBadge status={app.status} />
                        </div>
                      </div>
                      
                      {app.cropType && (
                        <div style={{ marginTop: '12px', padding: '12px', background: 'var(--primary-green-light)', borderRadius: '8px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                          <div style={{ flex: 1, fontSize: '13px' }}>
                            <p style={{ margin: '0 0 4px 0' }}><strong>Crop:</strong> {app.cropType?.cropName}</p>
                            <p style={{ margin: 0 }}><strong>Quantity:</strong> {app.cropQuantityKg} KG</p>
                          </div>
                          {app.cropImageUrl && (
                            <img
                              src={app.cropImageUrl.startsWith('http') 
                                ? app.cropImageUrl 
                                : app.cropImageUrl.startsWith('/api/')
                                  ? `${process.env.REACT_APP_BACKEND_URL ?? 'http://localhost:8081'}${app.cropImageUrl}`
                                  : `${process.env.REACT_APP_API_URL ?? 'http://localhost:8081/api'}/files/warehouse-access-images/${app.cropImageUrl}`}
                              alt="Crop image"
                              style={{ width: '48px', height: '48px', borderRadius: '4px', objectFit: 'cover' }}
                            />
                          )}
                        </div>
                      )}
                      {app.notes && <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'var(--text-light)', fontStyle: 'italic' }}>Notes: {app.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-light)', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
                <p style={{ margin: '0 0 12px 0' }}>No warehouse applications found.</p>
                <Link to="/warehouse-access/apply" className="view-all-link">Request storage space now</Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Wallet info and Crop Stock List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Wallet Summary */}
          <div className="dashboard-section" style={{ margin: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <Wallet size={20} style={{ color: 'var(--primary-green)' }} />
              <h2 style={{ margin: 0, fontSize: '18px' }}>Wallet & Withdrawals</h2>
            </div>
            
            <div style={{ padding: '16px', background: 'linear-gradient(135deg, var(--primary-green-dark) 0%, var(--primary-green) 100%)', color: 'white', borderRadius: 'var(--radius-lg)', marginBottom: '24px' }}>
              <span style={{ fontSize: '12px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Cash Balance</span>
              <h3 style={{ fontSize: '28px', fontWeight: 'bold', margin: '4px 0 12px 0' }}>RWF {wallet?.balance ? wallet.balance.toLocaleString() : '0'}</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '12px', fontSize: '13px' }}>
                <span>Unpaid Commission: RWF {wallet?.commissionEarned ? wallet.commissionEarned.toLocaleString() : '0'}</span>
                <Link to="/wallet" style={{ color: 'white', textDecoration: 'none', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Withdraw <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            <h3 style={{ fontSize: '14px', color: 'var(--text-dark)', margin: '0 0 12px 0' }}>Recent Withdrawals</h3>
            {withdrawals.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {withdrawals.slice(0, 3).map((w) => (
                  <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-dark)' }}>RWF {w.amount.toLocaleString()}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>{w.withdrawalMethod?.replace(/_/g, ' ') || 'Bank Transfer'}</span>
                    </div>
                    <StatusBadge status={w.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-light)', fontStyle: 'italic' }}>No withdrawals requested yet.</p>
            )}
          </div>

          {/* Crops in Warehouses */}
          <div className="dashboard-section" style={{ margin: 0 }}>
            <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>Stored Stock List</h2>
            {myInventory && myInventory.length > 0 ? (
              <div className="inventory-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {myInventory.map((item) => (
                  <div key={item.id} className="inventory-item" style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '16px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', boxSizing: 'border-box' }}>
                    {(() => {
                      const imageUrl = item.cropImageUrl || item.cropType?.imageUrl;
                      if (!imageUrl) return <div style={{ width: '48px', height: '48px', background: 'var(--primary-green-light)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Package size={20} color="var(--primary-green)" /></div>;
                      
                      const imageSrc = imageUrl.startsWith('http') 
                        ? imageUrl 
                        : imageUrl.startsWith('/api/')
                          ? `${process.env.REACT_APP_BACKEND_URL ?? 'http://localhost:8081'}${imageUrl}`
                          : `${process.env.REACT_APP_API_URL ?? 'http://localhost:8081/api'}${item.cropImageUrl ? '/files/warehouse-access-images/' : '/files/crop-images/'}${imageUrl}`;
                          
                      return (
                        <img 
                          src={imageSrc} 
                          alt={item.cropType?.cropName} 
                          style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
                        />
                      );
                    })()}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--text-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.cropType?.cropName}</h4>
                      <p style={{ margin: '0 0 2px 0', fontSize: '12px', color: 'var(--text-light)' }}>Warehouse: {item.warehouse?.warehouseName}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-gray)' }}>
                        Qty: <strong>{item.remainingQuantityKg}/{item.quantityKg}</strong> {item.cropType?.measurementUnit || 'KG'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-light)', fontStyle: 'italic' }}>No crops stored in warehouses yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal (Pending request edit) */}
      {showEditModal && selectedApplication && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Warehouse Access Request</h2>
              <Button variant="outline" size="small" className="modal-close" onClick={() => setShowEditModal(false)} icon={X} />
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '20px', color: 'var(--text-light)', fontSize: '14px', lineHeight: 1.5 }}>
                You can only edit requests that are still pending. Once approved or processed by a storekeeper, changes are locked.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <Button variant="outline" icon={X} onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  icon={Pencil}
                  onClick={() => {
                    navigate(`/warehouse-access/edit/${selectedApplication.id}`);
                    setShowEditModal(false);
                  }}
                >
                  Edit Request Form
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default FarmerDashboard;
