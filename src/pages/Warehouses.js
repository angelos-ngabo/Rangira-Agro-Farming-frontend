import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/dataService';
import Sidebar from '../components/layout/Sidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import DataTable from '../components/tables/DataTable';
import Button from '../components/common/Button';
import { Plus, Pencil, Trash2, FileDown, Building2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { exportToPDF } from '../utils/pdfExport';
import './Page.css';

const Warehouses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [size] = useState(10);

  

  const { data: allWarehousesData } = useQuery(
    'warehouses-all-for-search',
    () => dataService.getWarehouses({ page: 0, size: 10000, sort: 'warehouseName,asc' }),
    {
      staleTime: 30000,
      enabled: true
    }
  );

  

  const { data, isLoading, error } = useQuery(
    ['warehouses', page, size],
    () => dataService.getWarehouses({ page, size, sort: 'warehouseName,asc' }),
    { keepPreviousData: true }
  );

  

  

  const warehousesForTable =
    allWarehousesData?.data?.content ||
    (Array.isArray(allWarehousesData?.data) ? allWarehousesData.data : []) ||
    data?.data?.content ||
    (Array.isArray(data?.data) ? data.data : []) ||
    [];

  

  const { data: warehouseAccessesData } = useQuery(
    'warehouse-accesses-for-storekeepers',
    () => dataService.getWarehouseAccesses({}),
    {
      enabled: !!data,
      staleTime: 30000,
    }
  );

  

  const warehouseStorekeeperMap = useMemo(() => {
    const map = new Map();
    if (warehouseAccessesData?.data) {
      const accesses = Array.isArray(warehouseAccessesData.data)
        ? warehouseAccessesData.data
        : warehouseAccessesData.data.content || [];

      accesses.forEach(access => {

        const isManager = access.accessLevel === 'MANAGER' || access.accessLevel === 'Manager';
        const isActive = access.isActive === true || access.isActive === 'true';
        const isStorekeeper = access.user?.userType === 'STOREKEEPER' || access.user?.userType === 'Storekeeper';
        const warehouseId = access.warehouse?.id || access.warehouseId;

        if (isManager && isActive && isStorekeeper && warehouseId) {
          const firstName = access.user?.firstName || '';
          const lastName = access.user?.lastName || '';
          const fullName = `${firstName} ${lastName}`.trim() || access.user?.email || 'Unknown';

          map.set(warehouseId, {
            id: access.user?.id || access.userId,
            name: fullName,
            email: access.user?.email
          });
        }
      });
    }
    return map;
  }, [warehouseAccessesData]);

  const deleteMutation = useMutation(
    (id) => dataService.deleteWarehouse(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['warehouses']);
        toast.success('Warehouse deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete warehouse');
      },
    }
  );

  const handleDelete = async (id, warehouseName) => {
    if (window.confirm(`Are you sure you want to delete "${warehouseName}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleExportPDF = () => {
    const exportColumns = columns.filter(col => col.accessor !== 'actions');
    const exportData = warehousesForTable.map(warehouse => {
      const storekeeper = warehouseStorekeeperMap.get(warehouse.id);
      return {
        ...warehouse,
        storekeeper: storekeeper ? storekeeper.name : 'No Storekeeper Assigned'
      };
    });
    exportToPDF(exportData, exportColumns, 'Warehouses Report', `warehouses-report-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF report generated successfully!');
  };

  const columns = [
    {
      header: 'Code',
      accessor: 'warehouseCode',
      sortable: true,
    },
    {
      header: 'Name',
      accessor: 'warehouseName',
      sortable: true,
    },
    {
      header: 'Type',
      accessor: 'warehouseType',
      render: (row) => (
        <span className="badge">{row.warehouseType}</span>
      ),
    },
    {
      header: 'Capacity',
      accessor: 'totalCapacityKg',
      render: (row) => `${row.totalCapacityKg} kg`,
    },
    {
      header: 'Available',
      accessor: 'availableCapacityKg',
      render: (row) => `${row.availableCapacityKg} kg`,
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
      header: 'Storekeeper',
      accessor: 'storekeeper',
      render: (row) => {
        const storekeeper = warehouseStorekeeperMap.get(row.id);
        return storekeeper ? (
          <span>{storekeeper.name}</span>
        ) : (
          <span style={{ color: '#999', fontStyle: 'italic' }}>No Storekeeper Assigned</span>
        );
      },
    },
    ...(user?.userType === 'ADMIN' ? [{
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => navigate(`/warehouses/${row.id}`)}
            className="btn-icon"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => navigate(`/warehouses/edit/${row.id}`)}
            className="btn-icon"
            title="Edit Warehouse"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => handleDelete(row.id, row.warehouseName)}
            className="btn-icon btn-danger"
            title="Delete Warehouse"
            disabled={deleteMutation.isLoading}
          >
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
          <div className="error-message">Error loading warehouses</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <Sidebar />
      <div className="page-container">
        <DashboardHeader />
        {user?.userType === 'ADMIN' && (
          <div className="page-actions" style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
            <Button
              icon={Plus}
              iconPosition="left"
              onClick={() => navigate('/warehouses/add')}
            >
              Add Warehouse
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
        )}

        <DataTable
          data={warehousesForTable}
          columns={columns}
          loading={isLoading}
          pagination={!!allWarehousesData?.data}
          pageSize={size}
          columnSearchable={true}
        />

        {!allWarehousesData?.data && (data?.data?.totalPages || 0) > 1 && (
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

export default Warehouses;




