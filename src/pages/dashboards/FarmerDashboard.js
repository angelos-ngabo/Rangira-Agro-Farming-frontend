import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/common/Button';
import NotificationBell from '../../components/dashboard/NotificationBell';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import { Warehouse, Package, FileText, CheckCircle, Clock, XCircle, Pencil, X, Lock, Plus, Eye, Leaf, Bell, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import '../Dashboard.css';

const FarmerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);

  

  const { data: myApplications, refetch: refetchApplications } = useQuery(
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

  const { data: myInventory } = useQuery(
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

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboard-container">
        <DashboardHeader />

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#2ea35920' }}>
              <Leaf size={24} style={{ color: '#2ea359' }} />
            </div>
            <div className="stat-content">
              <h3>Total Stored</h3>
              <p className="stat-value">{totalStorage.toFixed(2)} KG</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#3b82f620' }}>
              <Package size={24} style={{ color: '#3b82f6' }} />
            </div>
            <div className="stat-content">
              <h3>Available</h3>
              <p className="stat-value">{totalRemaining.toFixed(2)} KG</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#f59e0b20' }}>
              <Warehouse size={24} style={{ color: '#f59e0b' }} />
            </div>
            <div className="stat-content">
              <h3>Approved Warehouses</h3>
              <p className="stat-value">{approvedAccesses.length}</p>
            </div>
          </div>
        </div>

        <div className="dashboard-actions" style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link to="/warehouse-access/apply" className="btn-primary">
            <FileText size={20} />
            Apply for Warehouse Access
          </Link>
          <Link to="/inventory-requests/create" className="btn-primary" style={{ background: '#3b82f6' }}>
            <Pencil size={20} />
            Request Inventory Update/Withdrawal
          </Link>
          <Link to="/inventory-requests" className="btn-primary" style={{ background: '#8b5cf6' }}>
            <FileText size={20} />
            View My Requests
          </Link>
        </div>

        {}
        {
          requestsWithResponses.length > 0 && (
            <div className="dashboard-section" style={{ marginBottom: '32px', borderLeft: '4px solid #116530' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <Bell size={24} style={{ color: '#116530' }} />
                <h2 style={{ margin: 0 }}>Inventory Request Updates</h2>
                <span style={{
                  backgroundColor: '#116530',
                  color: 'white',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {requestsWithResponses.length}
                </span>
              </div>
              <div className="requests-notifications-list">
                {requestsWithResponses.slice(0, 5).map((request) => (
                  <div key={request.id} className="request-notification-card" style={{
                    background: request.status === 'APPROVED' || request.status === 'COMPLETED'
                      ? 'rgba(76, 175, 80, 0.1)'
                      : 'rgba(244, 67, 54, 0.1)',
                    borderLeft: `4px solid ${request.status === 'APPROVED' || request.status === 'COMPLETED' ? '#4caf50' : '#f44336'}`,
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '16px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        {request.status === 'APPROVED' || request.status === 'COMPLETED' ? (
                          <CheckCircle size={20} color="#4caf50" />
                        ) : (
                          <XCircle size={20} color="#f44336" />
                        )}
                        <strong style={{ fontSize: '16px' }}>
                          Request {request.requestCode} - {request.status}
                        </strong>
                      </div>
                      <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
                        <strong>Type:</strong> {request.requestType === 'UPDATE' ? 'Update' : 'Withdrawal'}
                      </p>
                      {request.storekeeperResponse && (
                        <p style={{ margin: '8px 0', padding: '12px', background: 'rgba(255, 255, 255, 0.7)', borderRadius: '6px', fontSize: '14px' }}>
                          <strong>Storekeeper Response:</strong> {request.storekeeperResponse}
                        </p>
                      )}
                      <p style={{ margin: '4px 0', fontSize: '12px', color: '#999' }}>
                        {request.processedDate
                          ? `Processed: ${new Date(request.processedDate).toLocaleString()}`
                          : `Updated: ${new Date(request.updatedAt || request.createdAt).toLocaleString()}`
                        }
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button
                        variant="outline"
                        size="small"
                        icon={Eye}
                        onClick={() => navigate('/inventory-requests')}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
                {requestsWithResponses.length > 5 && (
                  <div style={{ textAlign: 'center', marginTop: '12px' }}>
                    <Button
                      variant="outline"
                      onClick={() => navigate('/inventory-requests')}
                    >
                      View All {requestsWithResponses.length} Updates
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )
        }

        <div className="dashboard-sections">
          <div className="dashboard-section">
            <h2>Warehouse Access Applications</h2>
            {myApplications && myApplications.length > 0 ? (
              <div className="applications-list">
                {myApplications.map((app) => (
                  <div key={app.id} className="application-card">
                    <div className="application-info">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <h4>{app.warehouse?.warehouseName}</h4>
                        {app.status === 'PENDING' && (
                          <Button
                            variant="outline"
                            size="small"
                            icon={Pencil}
                            onClick={() => {
                              setSelectedApplication(app);
                              setShowEditModal(true);
                            }}
                          >
                            Edit
                          </Button>
                        )}
                      </div>
                      <p>Requested: {app.requestedCapacityKg} KG</p>
                      <p>Status:
                        <span className={`status-badge status-${app.status?.toLowerCase()}`}>
                          {app.status}
                        </span>
                      </p>
                      {app.cropType && (
                        <div className="crop-info-section" style={{ marginTop: '12px', padding: '12px', borderRadius: '8px' }}>
                          <p><strong>Crop:</strong> {app.cropType?.cropName}</p>
                          <p><strong>Quantity:</strong> {app.cropQuantityKg} KG</p>
                          {app.cropImageUrl && (
                            <div className="crop-image-container">
                              <img
                                src={app.cropImageUrl.startsWith('http') ? app.cropImageUrl : `http://localhost:8080${app.cropImageUrl}`}
                                alt="Crop"
                                style={{ maxWidth: '150px', maxHeight: '150px', borderRadius: '8px', marginTop: '8px' }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                      {app.notes && <p>Notes: {app.notes}</p>}
                    </div>
                    <div className="application-icon">
                      {app.status === 'APPROVED' || app.status === 'ACTIVE' ? (
                        <CheckCircle size={32} color="#2ea359" />
                      ) : app.status === 'PENDING' ? (
                        <Clock size={32} color="#f59e0b" />
                      ) : (
                        <XCircle size={32} color="#ef4444" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No applications yet. <Link to="/warehouse-access/apply">Apply for warehouse access</Link></p>
            )}
          </div>

          <div className="dashboard-section">
            <h2>My Crops in Warehouses</h2>
            {myInventory && myInventory.length > 0 ? (
              <div className="inventory-list">
                {myInventory.map((item) => (
                  <div key={item.id} className="inventory-item">
                    <div>
                      <h4>{item.cropType?.cropName}</h4>
                      <p>Warehouse: {item.warehouse?.warehouseName}</p>
                      <p>Total: {item.quantityKg} {item.cropType?.measurementUnit || 'KG'}</p>
                      <p>Remaining: {item.remainingQuantityKg} {item.cropType?.measurementUnit || 'KG'}</p>
                      <p>Quality Grade: {item.qualityGrade}</p>
                      <p>Storage Date: {new Date(item.storageDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No crops stored in warehouses yet.</p>
            )}
          </div>
        </div>
      </div>

      {}
      {
        showEditModal && selectedApplication && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Edit Warehouse Access Request</h2>
                <Button variant="outline" size="small" className="modal-close" onClick={() => setShowEditModal(false)} icon={X} />
              </div>
              <div className="modal-body">
                <p style={{ marginBottom: '20px', color: '#666' }}>
                  You can only edit requests that are still pending. Once approved or rejected, you'll need to create a new request.
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
                    Continue to Edit Form
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div>
  );
};

export default FarmerDashboard;

