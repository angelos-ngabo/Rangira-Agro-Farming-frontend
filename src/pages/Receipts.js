import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/dataService';
import Sidebar from '../components/layout/Sidebar';

import Button from '../components/common/Button';
import { FileText, FileDown, Calendar, CreditCard, Package, Eye, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import './Dashboard.css';

const Receipts = () => {
  const { user } = useAuth();
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const { data: receipts, isLoading, error } = useQuery(
    ['buyerReceipts', user?.id],
    async () => {
      if (!user?.id) return [];
      try {
        const response = await dataService.getBuyerReceipts();
        return response.data || [];
      } catch (error) {
        console.error('Error fetching receipts:', error);
        return [];
      }
    },
    { enabled: !!user?.id }
  );

  const handleDownloadReceipt = async (transactionId) => {
    try {
      const response = await dataService.downloadReceipt(transactionId);

      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt_${transactionId}.html`;
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

  const handleViewReceipt = async (transactionId) => {
    try {
      const response = await dataService.downloadReceipt(transactionId);

      // Get HTML from response
      const reader = new FileReader();
      reader.onload = () => {
        const html = reader.result;
        const newWindow = window.open();
        newWindow.document.write(html);
        newWindow.document.close();
      };
      reader.readAsText(response.data);
    } catch (error) {
      console.error('Error viewing receipt:', error);
      toast.error('Failed to view receipt');
    }
  };

  if (isLoading) {
    return (
      <div className="dashboard">
        <Sidebar />

        <div className="dashboard-container">
          <p>Loading receipts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <Sidebar />

        <div className="dashboard-container">
          <div className="error-message">Error loading receipts</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboard-container">

        {receipts && receipts.length > 0 ? (
          <div className="receipts-list">
            {receipts.map((receipt) => (
              <div key={receipt.id} className="receipt-card">
                <div className="receipt-header">
                  <div className="receipt-icon">
                    <FileText size={24} />
                  </div>
                  <div className="receipt-info">
                    <h3>Receipt #{receipt.transactionCode}</h3>
                    <p className="receipt-date">
                      <Calendar size={16} />
                      {receipt.paymentDate
                        ? new Date(receipt.paymentDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                        : new Date(receipt.transactionDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      }
                    </p>
                  </div>
                </div>

                <div className="receipt-details">
                  <div className="receipt-detail-item">
                    <Package size={16} />
                    <span>
                      <strong>{receipt.inventory?.cropType?.cropName || 'N/A'}</strong>
                      {' - '}
                      {receipt.quantityKg} {receipt.inventory?.cropType?.measurementUnit || 'KG'}
                    </span>
                  </div>
                  <div className="receipt-detail-item">
                    <DollarSign size={16} />
                    <span>
                      <strong>Total Paid:</strong> RWF {receipt.totalAmount?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="receipt-detail-item">
                    <span>
                      <strong>Seller:</strong> {receipt.seller?.firstName} {receipt.seller?.lastName}
                    </span>
                  </div>
                  <div className="receipt-detail-item">
                    <span>
                      <strong>Payment Status:</strong>{' '}
                      <span className={`badge badge-${receipt.paymentStatus?.toLowerCase()}`}>
                        {receipt.paymentStatus}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="receipt-actions">
                  <Button
                    variant="outline"
                    icon={Eye}
                    onClick={() => handleViewReceipt(receipt.id)}
                  >
                    View
                  </Button>
                  <Button
                    variant="primary"
                    icon={FileDown}
                    onClick={() => handleDownloadReceipt(receipt.id)}
                  >
                    Download PDF
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <FileText size={64} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <h3>No Receipts Yet</h3>
            <p>You haven't made any purchases yet. Your receipts will appear here after you complete a transaction.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Receipts;
