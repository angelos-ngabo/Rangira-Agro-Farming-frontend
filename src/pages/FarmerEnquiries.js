import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/dataService';
import Sidebar from '../components/layout/Sidebar';

import Button from '../components/common/Button';
import { MessageSquare, CheckCircle, XCircle, DollarSign, Package, X } from 'lucide-react';
import toast from 'react-hot-toast';
import './Dashboard.css';

const FarmerEnquiries = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [willAccept, setWillAccept] = useState(true);

  const { data: enquiries, isLoading, refetch } = useQuery(
    ['farmerEnquiries', user?.id],
    async () => {
      if (!user?.id) return [];
      try {
        const response = await dataService.getFarmerEnquiries();
        return response.data || [];
      } catch (error) {
        console.error('Error fetching enquiries:', error);
        return [];
      }
    },
    { enabled: !!user?.id }
  );

  const respondToEnquiryMutation = useMutation(
    ({ enquiryId, accept, message }) => dataService.respondToEnquiry(enquiryId, { accept, responseMessage: message }),
    {
      onSuccess: (data, variables) => {
        toast.success(variables.accept ? 'Enquiry accepted! Buyer has been notified.' : 'Enquiry rejected.');
        setShowResponseModal(false);
        setSelectedEnquiry(null);
        setResponseMessage('');
        queryClient.invalidateQueries('farmerEnquiries');
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to respond to enquiry';
        toast.error(errorMessage);
      }
    }
  );

  const handleRespond = (enquiry, accept) => {
    setSelectedEnquiry(enquiry);
    setWillAccept(accept);
    setResponseMessage(accept ? 'I accept your proposed price.' : '');
    setShowResponseModal(true);
  };

  const handleSubmitResponse = (e) => {
    e.preventDefault();
    if (!selectedEnquiry) return;

    respondToEnquiryMutation.mutate({
      enquiryId: selectedEnquiry.id,
      accept: willAccept,
      message: responseMessage || (willAccept ? 'I accept your proposed price.' : 'I cannot accept this price.')
    });
  };

  const pendingEnquiries = enquiries?.filter(e => e.status === 'PENDING') || [];
  const acceptedEnquiries = enquiries?.filter(e => e.status === 'ACCEPTED') || [];
  const rejectedEnquiries = enquiries?.filter(e => e.status === 'REJECTED') || [];

  if (isLoading) {
    return (
      <div className="dashboard">
        <Sidebar />
        <div className="dashboard-container">
          <p>Loading enquiries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboard-container">
        <div className="enquiries-sections">
          {pendingEnquiries.length > 0 && (
            <div className="enquiry-section">
              <h2>Pending Enquiries ({pendingEnquiries.length})</h2>
              <div className="enquiries-list">
                {pendingEnquiries.map((enquiry) => (
                  <div key={enquiry.id} className="enquiry-card pending">
                    <div className="enquiry-header">
                      <div className="enquiry-buyer">
                        <MessageSquare size={20} />
                        <div>
                          <strong>{enquiry.buyer?.firstName} {enquiry.buyer?.lastName}</strong>
                          <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0' }}>
                            {enquiry.buyer?.email}
                          </p>
                        </div>
                      </div>
                      <span className="badge badge-pending">PENDING</span>
                    </div>

                    <div className="enquiry-details">
                      <div className="enquiry-detail-row">
                        <Package size={16} />
                        <span>
                          <strong>Crop:</strong> {enquiry.inventory?.cropType?.cropName}
                        </span>
                      </div>
                      <div className="enquiry-detail-row">
                        <span>
                          <strong>Quantity:</strong> {enquiry.proposedQuantityKg} {enquiry.inventory?.cropType?.measurementUnit || 'KG'}
                        </span>
                      </div>
                      <div className="enquiry-detail-row">
                        <DollarSign size={16} />
                        <span>
                          <strong>Proposed Price:</strong> RWF {enquiry.proposedPricePerKg?.toLocaleString()} per {enquiry.inventory?.cropType?.measurementUnit || 'KG'}
                        </span>
                      </div>
                      <div className="enquiry-detail-row">
                        <span>
                          <strong>Current Price:</strong> RWF {enquiry.inventory?.cropType?.pricePerKg?.toLocaleString()} per {enquiry.inventory?.cropType?.measurementUnit || 'KG'}
                        </span>
                      </div>
                      <div className="enquiry-detail-row">
                        <span>
                          <strong>Total Amount:</strong> RWF {enquiry.proposedTotalAmount?.toLocaleString()}
                        </span>
                      </div>
                      {enquiry.message && (
                        <div className="enquiry-message">
                          <strong>Message:</strong> {enquiry.message}
                        </div>
                      )}
                    </div>

                    <div className="enquiry-actions">
                      <Button
                        variant="success"
                        icon={CheckCircle}
                        onClick={() => handleRespond(enquiry, true)}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="danger"
                        icon={XCircle}
                        onClick={() => handleRespond(enquiry, false)}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {acceptedEnquiries.length > 0 && (
            <div className="enquiry-section">
              <h2>Accepted Enquiries ({acceptedEnquiries.length})</h2>
              <div className="enquiries-list">
                {acceptedEnquiries.map((enquiry) => (
                  <div key={enquiry.id} className="enquiry-card accepted">
                    <div className="enquiry-header">
                      <div className="enquiry-buyer">
                        <MessageSquare size={20} />
                        <div>
                          <strong>{enquiry.buyer?.firstName} {enquiry.buyer?.lastName}</strong>
                        </div>
                      </div>
                      <span className="badge badge-accepted">ACCEPTED</span>
                    </div>
                    <div className="enquiry-details">
                      <p><strong>{enquiry.inventory?.cropType?.cropName}</strong> - {enquiry.proposedQuantityKg} KG</p>
                      <p>Price: RWF {enquiry.proposedPricePerKg?.toLocaleString()} per KG</p>
                      <p>Total: RWF {enquiry.proposedTotalAmount?.toLocaleString()}</p>
                      <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                        Waiting for buyer payment...
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {rejectedEnquiries.length > 0 && (
            <div className="enquiry-section">
              <h2>Rejected Enquiries ({rejectedEnquiries.length})</h2>
              <div className="enquiries-list">
                {rejectedEnquiries.map((enquiry) => (
                  <div key={enquiry.id} className="enquiry-card rejected">
                    <div className="enquiry-header">
                      <div className="enquiry-buyer">
                        <MessageSquare size={20} />
                        <div>
                          <strong>{enquiry.buyer?.firstName} {enquiry.buyer?.lastName}</strong>
                        </div>
                      </div>
                      <span className="badge badge-rejected">REJECTED</span>
                    </div>
                    <div className="enquiry-details">
                      <p><strong>{enquiry.inventory?.cropType?.cropName}</strong> - {enquiry.proposedQuantityKg} KG</p>
                      <p>Proposed Price: RWF {enquiry.proposedPricePerKg?.toLocaleString()} per KG</p>
                      {enquiry.responseMessage && (
                        <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                          <strong>Your Response:</strong> {enquiry.responseMessage}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {enquiries?.length === 0 && (
            <div className="empty-state">
              <MessageSquare size={64} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <h3>No Enquiries Yet</h3>
              <p>You haven't received any purchase enquiries yet. Buyers will send enquiries for your crops.</p>
            </div>
          )}
        </div>

        {/* Response Modal */}
        {showResponseModal && selectedEnquiry && (
          <div className="modal-overlay" onClick={() => setShowResponseModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
              <div className="modal-header" style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: '16px', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#116530' }}>
                    {willAccept ? 'Accept' : 'Reject'} Enquiry
                  </h2>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Package size={18} style={{ color: '#116530' }} />
                      <span style={{ fontWeight: '600', fontSize: '16px', color: '#116530' }}>
                        {selectedEnquiry.inventory?.cropType?.cropName || 'Unknown Crop'}
                      </span>
                    </div>
                    <div style={{ width: '1px', height: '20px', background: '#ddd' }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MessageSquare size={18} style={{ color: '#116530' }} />
                      <span style={{ fontWeight: '600', fontSize: '16px', color: '#116530' }}>
                        {selectedEnquiry.buyer?.firstName || 'N/A'} {selectedEnquiry.buyer?.lastName || ''}
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="small" className="modal-close" onClick={() => setShowResponseModal(false)} icon={X} />
              </div>
              <div className="modal-body">
                <div style={{
                  marginBottom: '24px',
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}><strong>Quantity:</strong></p>
                      <p style={{ margin: '4px 0', fontSize: '16px', fontWeight: '600' }}>
                        {selectedEnquiry.proposedQuantityKg} {selectedEnquiry.inventory?.cropType?.measurementUnit || 'KG'}
                      </p>
                    </div>
                    <div>
                      <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}><strong>Proposed Price:</strong></p>
                      <p style={{ margin: '4px 0', fontSize: '16px', fontWeight: '600', color: '#116530' }}>
                        RWF {selectedEnquiry.proposedPricePerKg?.toLocaleString()} per KG
                      </p>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}><strong>Total Amount:</strong></p>
                      <p style={{ margin: '4px 0', fontSize: '20px', fontWeight: '700', color: '#116530' }}>
                        RWF {selectedEnquiry.proposedTotalAmount?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmitResponse}>
                  <div className="form-group">
                    <label htmlFor="responseMessage">Response Message</label>
                    <textarea
                      id="responseMessage"
                      value={responseMessage}
                      onChange={(e) => setResponseMessage(e.target.value)}
                      rows="3"
                      placeholder={willAccept ? "Add a message to the buyer (optional)..." : "Explain why you're rejecting (optional)..."}
                    />
                  </div>

                  <div className="modal-actions">
                    <Button variant="outline" icon={X} onClick={() => setShowResponseModal(false)}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant={willAccept ? "success" : "danger"}
                      icon={willAccept ? CheckCircle : XCircle}
                      disabled={respondToEnquiryMutation.isLoading}
                    >
                      {respondToEnquiryMutation.isLoading
                        ? 'Processing...'
                        : willAccept
                          ? 'Accept Enquiry'
                          : 'Reject Enquiry'
                      }
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

export default FarmerEnquiries;

