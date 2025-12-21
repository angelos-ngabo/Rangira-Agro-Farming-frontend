import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/dataService';
import Sidebar from '../components/layout/Sidebar';
import Button from '../components/common/Button';
import DataTable from '../components/tables/DataTable';
import { FileDown, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import './Page.css';

const Transactions = () => {
  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const [size] = useState(10);

  // If user is a farmer, fetch only their transactions (as seller)
  // Otherwise, fetch all transactions (for admin)
  const { data, isLoading, error } = useQuery(
    ['transactions', page, size, user?.id, user?.userType],
    () => {
      if (user?.userType === 'FARMER' && user?.id) {
        // Fetch only farmer's transactions as seller using secure endpoint
        return dataService.getMyTransactions();
      } else {
        // Admin or other users see all transactions
        return dataService.getTransactions({ page, size, sort: 'transactionDate,desc' });
      }
    },
    {
      keepPreviousData: true,
      refetchInterval: 30000,
      enabled: !!user
    }
  );

  const columns = [
    {
      header: 'Code',
      accessor: 'transactionCode',
      sortable: true,
    },
    {
      header: 'Crop',
      accessor: 'crop',
      render: (row) => row.inventory?.cropType?.cropName || 'N/A',
    },
    {
      header: 'Buyer Name',
      accessor: 'buyer',
      render: (row) => row.buyer ? `${row.buyer.firstName || ''} ${row.buyer.lastName || ''}`.trim() || 'N/A' : 'N/A',
    },
    {
      header: 'Seller Name',
      accessor: 'seller',
      render: (row) => row.seller ? `${row.seller.firstName || ''} ${row.seller.lastName || ''}`.trim() || 'N/A' : 'N/A',
    },
    {
      header: 'Quantity',
      accessor: 'quantity',
      render: (row) => `${row.quantityKg || 0} ${row.inventory?.cropType?.measurementUnit || 'KG'}`,
    },
    {
      header: 'Amount',
      accessor: 'totalAmount',
      render: (row) => `RWF ${row.totalAmount?.toLocaleString() || '0'}`,
    },
    {
      header: 'Payment Status',
      accessor: 'paymentStatus',
      render: (row) => (
        <span className={`badge badge-${row.paymentStatus?.toLowerCase() || 'secondary'}`}>
          {row.paymentStatus || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Delivery Status',
      accessor: 'deliveryStatus',
      render: (row) => (
        <span className={`badge badge-${row.deliveryStatus?.toLowerCase() || 'secondary'}`}>
          {row.deliveryStatus || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Date',
      accessor: 'transactionDate',
      render: (row) => row.transactionDate ? new Date(row.transactionDate).toLocaleDateString() : 'N/A',
    },
  ];

  // Add actions column for admin
  if (user?.userType === 'ADMIN') {
    columns.push({
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <Button
          variant="primary"
          size="small"
          onClick={() => handlePrintReceipt(row.id)}
          title="Print Receipt"
          icon={FileDown}
        >
          Export PDF
        </Button>
      ),
    });
  }

  const handlePrintReceipt = async (transactionId) => {
    try {
      const response = await dataService.downloadReceiptAdmin(transactionId);

      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);

      // Download the file
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt_${transactionId}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Also open in new window for printing
      const printWindow = window.open();
      if (printWindow) {
        // Read blob as text
        const reader = new FileReader();
        reader.onload = () => {
          printWindow.document.write(reader.result);
          printWindow.document.close();
          printWindow.focus();
          // Auto-print after a short delay
          setTimeout(() => {
            printWindow.print();
          }, 500);
        };
        reader.readAsText(blob);
      }

      window.URL.revokeObjectURL(url);
      toast.success('Receipt downloaded! Print window opened.');
    } catch (error) {
      console.error('Error printing receipt:', error);
      toast.error('Failed to print receipt');
    }
  };

  if (error) {
    return (
      <div>
        <Sidebar />
        <div className="page-container">
          <div className="error-message">Error loading transactions</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <Sidebar />
      <div className="page-container">
        <DataTable
          data={user?.userType === 'FARMER'
            ? (Array.isArray(data?.data) ? data.data : [])
            : (data?.data?.content || [])}
          columns={columns}
          loading={isLoading}
          pagination={false}
          columnSearchable={true}
        />

        {user?.userType !== 'FARMER' && data?.data?.totalPages > 1 && (
          <div className="pagination-controls">
            <Button
              variant="secondary"
              size="small"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <span>
              Page {page + 1} of {data?.data?.totalPages || 1}
            </span>
            <Button
              variant="secondary"
              size="small"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= (data?.data?.totalPages || 1) - 1}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;




