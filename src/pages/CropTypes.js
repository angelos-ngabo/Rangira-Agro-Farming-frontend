import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/dataService';
import Sidebar from '../components/layout/Sidebar';

import DashboardHeader from '../components/dashboard/DashboardHeader';
import DataTable from '../components/tables/DataTable';
import Button from '../components/common/Button';
import { Plus, Pencil, Trash2, FileDown, Sprout, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { exportToPDF } from '../utils/pdfExport';
import './Page.css';

const CropTypes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [size] = useState(10);

  

  const { data: allCropTypesData } = useQuery(
    'cropTypes-all-for-search',
    () => dataService.getCropTypes({ page: 0, size: 10000, sort: 'cropName,asc' }),
    { staleTime: 30000 }
  );

  

  const { data, isLoading, error } = useQuery(
    ['cropTypes', page, size],
    () => dataService.getCropTypes({ page, size, sort: 'cropName,asc' }),
    { keepPreviousData: true }
  );

  

  

  const cropTypesForTable =
    allCropTypesData?.data?.content ||
    (Array.isArray(allCropTypesData?.data) ? allCropTypesData.data : []) ||
    data?.data?.content ||
    (Array.isArray(data?.data) ? data.data : []) ||
    [];

  const deleteMutation = useMutation(
    (id) => dataService.deleteCropType(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['cropTypes']);
        toast.success('Crop type deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete crop type');
      },
    }
  );

  const handleDelete = async (id, cropName) => {
    if (window.confirm(`Are you sure you want to delete "${cropName}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleExportPDF = () => {
    const exportColumns = columns.filter(col => col.accessor !== 'actions');
    const cropTypesForTable = allCropTypesData?.data?.content || data?.data?.content || [];
    exportToPDF(cropTypesForTable, exportColumns, 'Crop Types Report', `crop-types-report-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF report generated successfully!');
  };

  const columns = [
    {
      header: 'Code',
      accessor: 'cropCode',
      sortable: true,
    },
    {
      header: 'Name',
      accessor: 'cropName',
      sortable: true,
    },
    {
      header: 'Category',
      accessor: 'category',
      render: (row) => (
        <span className="badge">{row.category}</span>
      ),
    },
    {
      header: 'Unit',
      accessor: 'measurementUnit',
    },
    {
      header: 'Price/Kg',
      accessor: 'pricePerKg',
      render: (row) => row.pricePerKg ? `RWF ${row.pricePerKg.toLocaleString()}` : 'N/A',
    },
    ...(user?.userType === 'ADMIN' ? [{
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => navigate(`/crop-types/${row.id}`)}
            className="btn-icon"
            title="View Details"
            style={{ color: '#3b82f6' }}
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => navigate(`/crop-types/edit/${row.id}`)}
            className="btn-icon"
            title="Edit Crop Type"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => handleDelete(row.id, row.cropName)}
            className="btn-icon btn-danger"
            title="Delete Crop Type"
            disabled={deleteMutation.isLoading}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    }] : []),
  ];

  if (error) {
    return (
      <div>
        <Sidebar />
        <div className="page-container">
          <div className="error-message">Error loading crop types</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <Sidebar />
      <div className="page-container">
        <DashboardHeader />
        <div className="page-actions" style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
          {user?.userType === 'ADMIN' && (
            <Button
              icon={Plus}
              iconPosition="left"
              onClick={() => navigate('/crop-types/add')}
            >
              Add Crop Type
            </Button>
          )}
          <Button
            icon={FileDown}
            iconPosition="left"
            onClick={handleExportPDF}
            variant="secondary"
          >
            Export PDF
          </Button>
        </div>

        <DataTable
          data={cropTypesForTable}
          columns={columns}
          loading={isLoading}
          pagination={!!allCropTypesData?.data}
          pageSize={size}
          columnSearchable={true}
        />

        {!allCropTypesData?.data && data?.data?.totalPages > 1 && (
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

export default CropTypes;




