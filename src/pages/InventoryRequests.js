import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/dataService';
import Sidebar from '../components/layout/Sidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import DataTable from '../components/tables/DataTable';
import Button from '../components/common/Button';
import { Package, CheckCircle, XCircle, Clock, Eye, Pencil, LogOut, Trash2, Filter, Leaf, Send, X } from 'lucide-react';
import toast from 'react-hot-toast';
import './Page.css';
import './Dashboard.css';
import './InventoryRequests.css';

const InventoryRequests = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseData, setResponseData] = useState({
    approve: true,
    storekeeperResponse: ''
  });
  const [filterStatus, setFilterStatus] = useState('ALL');


  const { data: requests, isLoading, refetch } = useQuery(
    ['inventoryRequests', user?.id, filterStatus],
    async () => {
      if (!user?.id) return [];
      try {
        if (user.userType === 'FARMER') {
          const response = await dataService.getMyInventoryRequests();
          return response.data || [];
        } else if (user.userType === 'STOREKEEPER') {
          const response = filterStatus === 'PENDING'
            ? await dataService.getPendingInventoryRequests()
            : await dataService.getAllInventoryRequests();
          return response.data || [];
        }
        return [];
      } catch (error) {
        toast.error('Failed to load inventory requests');
        return [];
      }
    },
    { enabled: !!user?.id && (user?.userType === 'FARMER' || user?.userType === 'STOREKEEPER') }
  );

  const respondMutation = useMutation(
    ({ requestId, data }) => dataService.respondToInventoryRequest(requestId, data),
    {
      onSuccess: () => {
        toast.success('Request response submitted successfully!');
        queryClient.invalidateQueries('inventoryRequests');
        setShowResponseModal(false);
        setSelectedRequest(null);
        setResponseData({ approve: true, storekeeperResponse: '' });
      },
      onError: (error) => {
        const message = error.response?.data?.message || error.message || 'Failed to respond to request';
        toast.error(message);
      }
    }
  );

  const deleteMutation = useMutation(
    (requestId) => dataService.deleteInventoryRequest(requestId),
    {
      onSuccess: () => {
        toast.success('Request deleted successfully!');
        queryClient.invalidateQueries('inventoryRequests');
      },
      onError: (error) => {
        const message = error.response?.data?.message || error.message || 'Failed to delete request';
        toast.error(message);
      }
    }
  );

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const handleRespond = (request) => {
    setSelectedRequest(request);
    setShowResponseModal(true);
    setResponseData({ approve: true, storekeeperResponse: '' });
  };

  const handleSubmitResponse = () => {
    if (!selectedRequest) return;

    if (!responseData.storekeeperResponse.trim()) {
      toast.error('Please provide a response message');
      return;
    }

    respondMutation.mutate({
      requestId: selectedRequest.id,
      data: responseData
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { icon: Clock, color: '#ff9800', bg: '#fff3e0', text: 'Pending' },
      APPROVED: { icon: CheckCircle, color: '#4caf50', bg: '#e8f5e9', text: 'Approved' },
      REJECTED: { icon: XCircle, color: '#f44336', bg: '#ffebee', text: 'Rejected' },
      COMPLETED: { icon: CheckCircle, color: '#2196f3', bg: '#e3f2fd', text: 'Completed' },
    };
    const badge = badges[status] || badges.PENDING;
    const Icon = badge.icon;
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 12px',
        borderRadius: '12px',
        backgroundColor: badge.bg,
        color: badge.color,
        fontSize: '12px',
        fontWeight: '600'
      }}>
        <Icon size={14} />
        {badge.text}
      </span>
    );
  };

  const getRequestTypeBadge = (type) => {
    const isUpdate = type === 'UPDATE';
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 12px',
        borderRadius: '12px',
        backgroundColor: isUpdate ? '#e3f2fd' : '#fff3e0',
        color: isUpdate ? '#1976d2' : '#f57c00',
        fontSize: '12px',
        fontWeight: '600'
      }}>
        {isUpdate ? <Pencil size={14} /> : <LogOut size={14} />}
        {isUpdate ? 'Update' : 'Withdrawal'}
      </span>
    );
  };

  const columns = [
    {
      header: 'Request Code',
      accessor: 'requestCode',
      render: (row) => (
        <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>{row.requestCode}</span>
      )
    },
    {
      header: 'Type',
      accessor: 'requestType',
      render: (row) => getRequestTypeBadge(row.requestType)
    },
    {
      header: 'Inventory',
      accessor: 'inventory',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Leaf size={16} style={{ color: '#2ea359' }} />
          <div>
            <div style={{ fontWeight: '600' }}>{row.inventory?.inventoryCode || 'N/A'}</div>
            <small style={{ color: 'var(--text-light, #666)' }}>{row.inventory?.cropType?.cropName || 'Unknown Crop'}</small>
          </div>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => getStatusBadge(row.status)
    },
    {
      header: 'Submitted',
      accessor: 'createdAt',
      render: (row) => (
        <span>{new Date(row.createdAt).toLocaleDateString()}</span>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => handleViewDetails(row)}
            className="btn-icon"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          {user?.userType === 'STOREKEEPER' && row.status === 'PENDING' && (
            <Button
              variant="primary"
              size="small"
              onClick={() => handleRespond(row)}
              icon={<CheckCircle size={16} />}
            >
              Respond
            </Button>
          )}
          {user?.userType === 'FARMER' && row.status === 'PENDING' && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this request?')) {
                  deleteMutation.mutate(row.id);
                }
              }}
              className="btn-icon btn-danger"
              title="Delete Request"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )
    }
  ];

  const filteredRequests = requests?.filter(req => {
    if (filterStatus === 'ALL') return true;
    return req.status === filterStatus;
  }) || [];

  return (
    <div className="page-container">
      <Sidebar />
      <div className="page-content">
        <DashboardHeader />
        <div className="page-body">
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <Package size={28} />
                  Inventory Requests
                </h1>
                <p className="inventory-requests-header" style={{ fontSize: '14px' }}>
                  {user?.userType === 'FARMER'
                    ? 'View and track your inventory update/withdrawal requests'
                    : 'Manage inventory requests from farmers'}
                </p>
              </div>
              <div className="inventory-requests-filter" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Filter size={18} />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    minWidth: '150px'
                  }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>
          </div>

          <div className="stats-grid" style={{ marginBottom: '24px' }}>
            <div className="stat-card">
              <div className="stat-icon" style={{
                background: document.documentElement.classList.contains('dark-mode') ? 'rgba(255, 152, 0, 0.2)' : '#fff3e0'
              }}>
                <Clock size={24} color="#ff9800" />
              </div>
              <div className="stat-content">
                <div className="stat-value">
                  {requests?.filter(r => r.status === 'PENDING').length || 0}
                </div>
                <div className="stat-label">Pending</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{
                background: document.documentElement.classList.contains('dark-mode') ? 'rgba(76, 175, 80, 0.2)' : '#e8f5e9'
              }}>
                <CheckCircle size={24} color="#4caf50" />
              </div>
              <div className="stat-content">
                <div className="stat-value">
                  {requests?.filter(r => r.status === 'APPROVED' || r.status === 'COMPLETED').length || 0}
                </div>
                <div className="stat-label">Approved</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{
                background: document.documentElement.classList.contains('dark-mode') ? 'rgba(244, 67, 54, 0.2)' : '#ffebee'
              }}>
                <XCircle size={24} color="#f44336" />
              </div>
              <div className="stat-content">
                <div className="stat-value">
                  {requests?.filter(r => r.status === 'REJECTED').length || 0}
                </div>
                <div className="stat-label">Rejected</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{
                background: document.documentElement.classList.contains('dark-mode') ? 'rgba(33, 150, 243, 0.2)' : '#e3f2fd'
              }}>
                <Package size={24} color="#2196f3" />
              </div>
              <div className="stat-content">
                <div className="stat-value">{requests?.length || 0}</div>
                <div className="stat-label">Total Requests</div>
              </div>
            </div>
          </div>

          <DataTable
            data={filteredRequests}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No inventory requests found"
          />

          {showDetailModal && selectedRequest && (
            <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                  <h2>Request Details</h2>
                  <Button variant="outline" size="small" className="modal-close" onClick={() => setShowDetailModal(false)} icon={X} />
                </div>
                <div className="modal-body">
                  <div style={{ marginBottom: '20px', color: 'inherit' }}>
                    <strong>Request Code:</strong> {selectedRequest.requestCode}
                  </div>
                  <div style={{ marginBottom: '20px', color: 'inherit' }}>
                    <strong>Type:</strong> {getRequestTypeBadge(selectedRequest.requestType)}
                  </div>
                  <div style={{ marginBottom: '20px', color: 'inherit' }}>
                    <strong>Status:</strong> {getStatusBadge(selectedRequest.status)}
                  </div>
                  <div style={{ marginBottom: '20px', color: 'inherit' }}>
                    <strong>Inventory:</strong> {selectedRequest.inventory?.inventoryCode} - {selectedRequest.inventory?.cropType?.cropName}
                  </div>

                  {selectedRequest.requestType === 'UPDATE' && (
                    <>
                      {selectedRequest.newCropImageUrl && (
                        <div style={{ marginBottom: '20px' }}>
                          <strong>New Image:</strong>
                          <img
                            src={selectedRequest.newCropImageUrl}
                            alt="New crop"
                            style={{ maxWidth: '200px', marginTop: '8px', borderRadius: '8px' }}
                          />
                        </div>
                      )}
                      {selectedRequest.newPricePerKg && (
                        <div style={{ marginBottom: '20px', color: 'inherit' }}>
                          <strong>New Price:</strong> RWF {selectedRequest.newPricePerKg.toLocaleString()} per KG
                        </div>
                      )}
                      {selectedRequest.newNotes && (
                        <div style={{ marginBottom: '20px', color: 'inherit' }}>
                          <strong>New Notes:</strong> {selectedRequest.newNotes}
                        </div>
                      )}
                    </>
                  )}

                  {selectedRequest.requestType === 'WITHDRAWAL' && (
                    <>
                      <div style={{ marginBottom: '20px', color: 'inherit' }}>
                        <strong>Withdrawal Quantity:</strong> {selectedRequest.withdrawalQuantityKg} KG
                      </div>
                      {selectedRequest.withdrawalDate && (
                        <div style={{ marginBottom: '20px', color: 'inherit' }}>
                          <strong>Withdrawal Date:</strong> {new Date(selectedRequest.withdrawalDate).toLocaleDateString()}
                        </div>
                      )}
                    </>
                  )}

                  {selectedRequest.farmerNotes && (
                    <div style={{ marginBottom: '20px', color: 'inherit' }}>
                      <strong>Farmer Notes:</strong> {selectedRequest.farmerNotes}
                    </div>
                  )}

                  {selectedRequest.storekeeperResponse && (
                    <div style={{ marginBottom: '20px', color: 'inherit' }}>
                      <strong>Storekeeper Response:</strong> {selectedRequest.storekeeperResponse}
                    </div>
                  )}

                  <div style={{ marginBottom: '20px', color: 'inherit' }}>
                    <strong>Submitted:</strong> {new Date(selectedRequest.createdAt).toLocaleString()}
                  </div>

                  {selectedRequest.processedDate && (
                    <div style={{ marginBottom: '20px', color: 'inherit' }}>
                      <strong>Processed:</strong> {new Date(selectedRequest.processedDate).toLocaleString()}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}

          {showResponseModal && selectedRequest && (
            <div className="modal-overlay" onClick={() => setShowResponseModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                  <h2>Respond to Request</h2>
                  <Button variant="outline" size="small" className="modal-close" onClick={() => setShowResponseModal(false)} icon={X} />
                </div>
                <div className="modal-body">
                  <div style={{ marginBottom: '20px', color: 'inherit' }}>
                    <strong>Request:</strong> {selectedRequest.requestCode}
                  </div>
                  <div style={{ marginBottom: '20px', color: 'inherit' }}>
                    <strong>Type:</strong> {selectedRequest.requestType === 'UPDATE' ? 'Update' : 'Withdrawal'}
                  </div>

                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label style={{ color: 'inherit' }}>Decision *</label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <Button
                        variant={responseData.approve ? 'success' : 'outline'}
                        onClick={() => setResponseData(prev => ({ ...prev, approve: true }))}
                        className={`response-option ${responseData.approve ? 'selected approve' : ''}`}
                        style={{ flex: 1 }}
                        icon={CheckCircle}
                      >
                        Approve
                      </Button>
                      <Button
                        variant={!responseData.approve ? 'danger' : 'outline'}
                        onClick={() => setResponseData(prev => ({ ...prev, approve: false }))}
                        className={`response-option ${!responseData.approve ? 'selected reject' : ''}`}
                        style={{ flex: 1 }}
                        icon={XCircle}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="storekeeperResponse" style={{ color: 'inherit' }}>Your Response / Notes *</label>
                    <textarea
                      id="storekeeperResponse"
                      className="response-form"
                      value={responseData.storekeeperResponse}
                      onChange={(e) => setResponseData(prev => ({ ...prev, storekeeperResponse: e.target.value }))}
                      rows="4"
                      placeholder={`Explain why you're ${responseData.approve ? 'approving' : 'rejecting'} this request...`}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '6px',
                        border: '1px solid #ddd',
                        fontSize: '14px',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <Button
                    variant="secondary"
                    onClick={() => setShowResponseModal(false)}
                    disabled={respondMutation.isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSubmitResponse}
                    disabled={respondMutation.isLoading || !responseData.storekeeperResponse.trim()}
                    loading={respondMutation.isLoading}
                    icon={Send}
                  >
                    Submit Response
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryRequests;

