import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../services/dataService';
import Sidebar from '../components/layout/Sidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import DataTable from '../components/tables/DataTable';
import Button from '../components/common/Button';
import { Plus, Pencil, Trash2, FileDown, User, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { exportToPDF } from '../utils/pdfExport';
import './Page.css';

const Users = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const queryClient = useQueryClient();

  

  const { data: allUsersData } = useQuery(
    'users-all-for-search',
    () => dataService.getUsers({ page: 0, size: 10000, sort: 'firstName,asc' }),
    { staleTime: 30000 }
  );

  

  const { data, isLoading, error } = useQuery(
    ['users', page, size],
    () => dataService.getUsers({ page, size, sort: 'firstName,asc' }),
    {
      keepPreviousData: true
    }
  );

  

  

  const usersForTable =
    allUsersData?.data?.content ||
    (Array.isArray(allUsersData?.data) ? allUsersData.data : []) ||
    data?.data?.content ||
    (Array.isArray(data?.data) ? data.data : []) ||
    [];

  const deleteMutation = useMutation(
    (id) => dataService.deleteUser(id),
    {
      onSuccess: () => {
        toast.success('User deleted successfully');
        queryClient.invalidateQueries('users');
      },
      onError: () => {
        toast.error('Failed to delete user');
      },
    }
  );

  const handleDelete = async (id, userName) => {
    if (window.confirm(`Are you sure you want to delete "${userName}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleExportPDF = () => {
    const exportColumns = columns.filter(col => col.accessor !== 'actions'); 

    const exportData = usersForTable;
    exportToPDF(exportData, exportColumns, 'Users Report', `users-report-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF report generated successfully!');
  };

  const columns = [
    {
      header: 'User Code',
      accessor: 'userCode',
      sortable: true,
    },
    {
      header: 'Name',
      accessor: 'firstName',
      render: (row) => `${row.firstName} ${row.lastName}`,
      sortable: true,
    },
    {
      header: 'Email',
      accessor: 'email',
      sortable: true,
    },
    {
      header: 'Phone',
      accessor: 'phoneNumber',
    },
    {
      header: 'Type',
      accessor: 'userType',
      render: (row) => (
        <span className={`badge badge-${row.userType.toLowerCase()}`}>
          {row.userType}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className={`badge badge-${row.status.toLowerCase()}`}>
          {row.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/users/edit/${row.id}`);
            }}
            className="btn-icon"
            title="Edit"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.id, `${row.firstName} ${row.lastName}`);
            }}
            className="btn-icon btn-danger"
            title="Delete"
            disabled={deleteMutation.isLoading}
          >
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <div>
        <Sidebar />
        <div className="page-container">
          <div className="error-message">Error loading users</div>
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
          <Button
            icon={Plus}
            iconPosition="left"
            onClick={() => navigate('/users/register-storekeeper')}
          >
            Add User (Farmer/Storekeeper)
          </Button>
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
          data={usersForTable}
          columns={columns}
          loading={isLoading}
          pagination={!!allUsersData?.data}
          pageSize={size}
          columnSearchable={true}
        />

        {!allUsersData?.data && (data?.data?.totalPages || 0) > 1 && (
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

export default Users;




