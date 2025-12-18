import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../services/dataService';
import Sidebar from '../components/layout/Sidebar';

import DashboardHeader from '../components/dashboard/DashboardHeader';
import DataTable from '../components/tables/DataTable';
import Button from '../components/common/Button';
import { Plus } from 'lucide-react';
import './Page.css';

const Ratings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [size] = useState(10);

  

  

  const { data, isLoading, error } = useQuery(
    ['ratings', page, size, user?.userType],
    () => {
      if (user?.userType === 'ADMIN') {
        

        return dataService.getRatings({ page, size, sort: 'createdAt,desc' });
      } else if (user?.userType === 'STOREKEEPER') {
        

        return dataService.getRatings({ page, size, sort: 'createdAt,desc', raterId: user.id });
      }
      return dataService.getRatings({ page, size, sort: 'createdAt,desc' });
    },
    { keepPreviousData: true, enabled: !!user }
  );

  const columns = [
    {
      header: 'Buyer (Rater)',
      accessor: 'rater',
      render: (row) => row.rater ? (
        <div>
          <div style={{ fontWeight: '600' }}>
            {row.rater.firstName || ''} {row.rater.lastName || ''}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {row.rater.email || 'N/A'}
          </div>
        </div>
      ) : (
        <span style={{ color: '#999', fontStyle: 'italic' }}>N/A</span>
      ),
    },
    {
      header: 'Seller (Rated)',
      accessor: 'ratedUser',
      render: (row) => row.ratedUser ? (
        <div>
          <div style={{ fontWeight: '600' }}>
            {row.ratedUser.firstName || ''} {row.ratedUser.lastName || ''}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {row.ratedUser.email || 'N/A'}
          </div>
        </div>
      ) : (
        <span style={{ color: '#999', fontStyle: 'italic' }}>N/A</span>
      ),
    },
    {
      header: 'Transaction',
      accessor: 'transaction',
      render: (row) => row.transaction ? (
        <div>
          <div style={{ fontWeight: '600', fontSize: '12px', color: '#116530' }}>
            {row.transaction.transactionCode || row.transaction.id || 'N/A'}
          </div>
          {row.transaction.buyer && (
            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
              <strong>Buyer:</strong> {row.transaction.buyer.firstName} {row.transaction.buyer.lastName}
            </div>
          )}
          {row.transaction.seller && (
            <div style={{ fontSize: '11px', color: '#666' }}>
              <strong>Seller:</strong> {row.transaction.seller.firstName} {row.transaction.seller.lastName}
            </div>
          )}
          {row.transaction.inventory?.cropType && (
            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
              <strong>Crop:</strong> {row.transaction.inventory.cropType.cropName || 'N/A'}
            </div>
          )}
          {row.transaction.quantityKg && (
            <div style={{ fontSize: '11px', color: '#666' }}>
              <strong>Qty:</strong> {row.transaction.quantityKg} {row.transaction.inventory?.cropType?.measurementUnit || 'KG'}
            </div>
          )}
          {row.transaction.totalAmount && (
            <div style={{ fontSize: '11px', color: '#116530', fontWeight: '600', marginTop: '4px' }}>
              RWF {parseFloat(row.transaction.totalAmount).toLocaleString() || '0'}
            </div>
          )}
        </div>
      ) : (
        <span style={{ color: '#999', fontStyle: 'italic' }}>N/A</span>
      ),
    },
    {
      header: 'Rating',
      accessor: 'ratingScore',
      render: (row) => (
        <div>
          <div style={{ fontSize: '20px', marginBottom: '4px' }}>
            {'⭐'.repeat(row.ratingScore)}{'☆'.repeat(5 - row.ratingScore)}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {row.ratingScore}/5 - {row.ratingType}
          </div>
        </div>
      ),
    },
    {
      header: 'Comment',
      accessor: 'comment',
      render: (row) => row.comment ? (
        <div style={{ maxWidth: '200px' }}>
          {row.comment.length > 100 ? (
            <span title={row.comment}>
              {row.comment.substring(0, 100)}...
            </span>
          ) : row.comment}
        </div>
      ) : <span style={{ color: '#999', fontStyle: 'italic' }}>No comment</span>,
    },
    {
      header: 'Date',
      accessor: 'createdAt',
      render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A',
    },
  ];

  if (error) {
    return (
      <div>
        <Sidebar />
        <div className="page-container">
          <div className="error-message">Error loading ratings</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <Sidebar />
      <div className="page-container">
        <DashboardHeader />
        {user?.userType === 'STOREKEEPER' && (
          <div className="page-actions" style={{ marginBottom: '24px' }}>
            <Button
              icon={Plus}
              iconPosition="left"
              onClick={() => navigate('/ratings/add')}
            >
              Rate Crop
            </Button>
          </div>
        )}

        <DataTable
          data={data?.data?.content || []}
          columns={columns}
          loading={isLoading}
          pagination={false}
          columnSearchable={true}
        />

        {data?.data?.totalPages > 1 && (
          <div className="pagination-controls">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="pagination-btn"
            >
              Previous
            </button>
            <span>
              Page {page + 1} of {data?.data?.totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= (data?.data?.totalPages || 1) - 1}
              className="pagination-btn"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ratings;




