import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/dataService';
import Sidebar from '../components/layout/Sidebar';

import DataTable from '../components/tables/DataTable';
import Button from '../components/common/Button';
import { Plus, FileDown, Search, MessageSquare, X, CreditCard, Leaf, Filter } from 'lucide-react';
import { exportToPDF } from '../utils/pdfExport';
import toast from 'react-hot-toast';
import './Page.css';
import './Dashboard.css';

const Inventory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [proposedPrice, setProposedPrice] = useState('');
  const [proposedQuantity, setProposedQuantity] = useState('');
  const [enquiryMessage, setEnquiryMessage] = useState('');

  // For buyers: fetch available inventory items for purchase
  const { data: availableItems, isLoading: itemsLoading } = useQuery(
    'availableItems',
    async () => {
      try {
        const response = await dataService.getInventories({
          page: 0,
          size: 100,
          status: 'STORED'
        });

        if (response.data?.content) {
          return response.data.content;
        } else if (Array.isArray(response.data)) {
          return response.data.filter(item => item.status === 'STORED' && item.remainingQuantityKg > 0);
        } else if (Array.isArray(response)) {
          return response.filter(item => item.status === 'STORED' && item.remainingQuantityKg > 0);
        }
        return [];
      } catch (error) {
        console.error('Error fetching available items:', error);
        return [];
      }
    },
    {
      enabled: user?.userType === 'BUYER',
      refetchInterval: 30000,
      refetchOnWindowFocus: true
    }
  );

  // Fetch buyer's enquiries
  const { data: myEnquiries } = useQuery(
    ['buyerEnquiries', user?.id],
    async () => {
      if (!user?.id) return [];
      try {
        const response = await dataService.getBuyerEnquiries();
        return response.data || [];
      } catch (error) {
        console.error('Error fetching enquiries:', error);
        return [];
      }
    },
    { enabled: !!user?.id && user?.userType === 'BUYER' }
  );

  const filteredItems = availableItems?.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.cropType?.cropName?.toLowerCase().includes(query) ||
      item.farmer?.firstName?.toLowerCase().includes(query) ||
      item.farmer?.lastName?.toLowerCase().includes(query) ||
      item.warehouse?.warehouseName?.toLowerCase().includes(query)
    );
  }) || [];

  const createEnquiryMutation = useMutation(
    (data) => dataService.createEnquiry(data),
    {
      onSuccess: () => {
        toast.success('Enquiry sent successfully! The farmer will be notified.');
        setShowEnquiryModal(false);
        setSelectedItem(null);
        setProposedPrice('');
        setProposedQuantity('');
        setEnquiryMessage('');
        queryClient.invalidateQueries('buyerEnquiries');
        queryClient.invalidateQueries('availableItems');
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to send enquiry';
        toast.error(errorMessage);
      }
    }
  );

  const handleSendEnquiry = (item) => {
    setSelectedItem(item);
    setProposedPrice(item.cropType?.pricePerKg ? item.cropType.pricePerKg.toString() : '');
    setProposedQuantity(item.remainingQuantityKg.toString());
    setShowEnquiryModal(true);
  };

  const handleSubmitEnquiry = async (e) => {
    e.preventDefault();

    if (!selectedItem) return;

    const price = parseFloat(proposedPrice);
    const quantity = parseFloat(proposedQuantity);

    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    if (quantity > selectedItem.remainingQuantityKg) {
      toast.error(`Quantity cannot exceed available amount (${selectedItem.remainingQuantityKg} kg)`);
      return;
    }

    createEnquiryMutation.mutate({
      inventoryId: selectedItem.id,
      proposedPricePerKg: price,
      proposedQuantityKg: quantity,
      message: enquiryMessage || `I would like to purchase ${quantity} kg at RWF ${price.toLocaleString()} per kg.`
    });
  };

  // For farmers: fetch only their own inventories
  // For storekeepers: fetch inventories from their assigned warehouses
  // For admins: fetch all inventories
  const { data: assignedWarehouses } = useQuery(
    ['assignedWarehouses', user?.id],
    async () => {
      if (!user?.id || user?.userType !== 'STOREKEEPER') return [];
      try {
        const response = await dataService.getWarehouseAccesses({ userId: user.id, isActive: true });

        // Handle both paginated and list responses
        let accessList = [];
        if (response.data?.content) {
          // Paginated response
          accessList = response.data.content;
        } else if (Array.isArray(response.data)) {
          // List response
          accessList = response.data;
        } else if (Array.isArray(response)) {
          // Direct array response
          accessList = response;
        }

        const warehouseIds = accessList.map(access => access.warehouse?.id).filter(Boolean) || [];
        return warehouseIds;
      } catch (error) {
        console.error('Error fetching assigned warehouses:', error);
        return [];
      }
    },
    { enabled: user?.userType === 'STOREKEEPER' && !!user?.id }
  );

  // For non-buyers: fetch inventories based on user type
  const { data: allInventoriesData } = useQuery(
    ['inventories-all-for-search', user?.id, user?.userType, assignedWarehouses],
    () => {
      // Farmers: fetch only their own inventories
      if (user?.userType === 'FARMER') {
        return dataService.getInventories({ farmerId: user.id, page: 0, size: 10000 });
      }
      // Storekeepers: fetch inventories from their assigned warehouses
      if (user?.userType === 'STOREKEEPER') {
        // If no assigned warehouses, return empty array
        if (!assignedWarehouses || assignedWarehouses.length === 0) {
          return Promise.resolve({ data: [] });
        }
        // Fetch inventories from all assigned warehouses
        return Promise.all(
          assignedWarehouses.map(warehouseId =>
            dataService.getInventories({ warehouseId, page: 0, size: 10000 })
          )
        ).then(responses => {
          // Combine all inventories from all warehouses
          const allInventories = [];
          responses.forEach(response => {
            if (response.data?.content) {
              allInventories.push(...response.data.content);
            } else if (Array.isArray(response.data)) {
              allInventories.push(...response.data);
            }
          });
          return { data: allInventories };
        });
      }
      // Admins: fetch all inventories
      return dataService.getInventories({ page: 0, size: 10000, sort: 'storageDate,desc' });
    },
    {
      staleTime: 30000,
      enabled: user?.userType !== 'BUYER' && !!user?.id
    }
  );

  const { data, isLoading, error } = useQuery(
    ['inventories', page, size, user?.id, user?.userType, assignedWarehouses],
    () => {
      // Farmers: fetch only their own inventories
      if (user?.userType === 'FARMER') {
        return dataService.getInventories({ farmerId: user.id, page, size, sort: 'storageDate,desc' });
      }
      // Storekeepers: fetch inventories from their first assigned warehouse (or all if multiple)
      if (user?.userType === 'STOREKEEPER') {
        // If no assigned warehouses, return empty page
        if (!assignedWarehouses || assignedWarehouses.length === 0) {
          return Promise.resolve({ data: { content: [], totalElements: 0 } });
        }
        // Use the first warehouse for pagination, or fetch all warehouses and combine
        return dataService.getInventories({ warehouseId: assignedWarehouses[0], page, size, sort: 'storageDate,desc' });
      }
      // Admins: fetch all inventories
      return dataService.getInventories({ page, size, sort: 'storageDate,desc' });
    },
    {
      keepPreviousData: true,
      refetchInterval: 30000,
      refetchOnWindowFocus: true,
      enabled: user?.userType !== 'BUYER' && !!user?.id
    }
  );

  // Combine inventories for table - for storekeepers, we might need to combine from multiple warehouses
  let inventoriesForTable = [];
  if (user?.userType === 'STOREKEEPER' && assignedWarehouses && assignedWarehouses.length > 0) {
    // For storekeepers, use allInventoriesData which combines all warehouses
    // Handle both paginated (with content) and list (direct array) responses
    inventoriesForTable =
      allInventoriesData?.data?.content ||
      (Array.isArray(allInventoriesData?.data) ? allInventoriesData.data : []) ||
      [];
  } else {
    // Handle both paginated (with content) and list (direct array) responses
    inventoriesForTable =
      allInventoriesData?.data?.content ||
      (Array.isArray(allInventoriesData?.data) ? allInventoriesData.data : []) ||
      data?.data?.content ||
      (Array.isArray(data?.data) ? data.data : []) ||
      [];
  }

  const handleExportPDF = () => {
    const exportColumns = columns.filter(col => col.accessor !== 'actions');
    exportToPDF(inventoriesForTable, exportColumns, 'Inventory Report', `inventory-report-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF report generated successfully!');
  };

  const columns = [
    {
      header: 'Image',
      accessor: 'cropImageUrl',
      render: (row) => row.cropImageUrl ? (
        <img
          src={row.cropImageUrl.startsWith('http') ? row.cropImageUrl : `http://localhost:8080${row.cropImageUrl}`}
          alt={row.cropType?.cropName || 'Crop'}
          style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
        />
      ) : (
        <div style={{ width: '50px', height: '50px', background: '#f0f0f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '12px' }}>
          No Image
        </div>
      ),
    },
    {
      header: 'Code',
      accessor: 'inventoryCode',
      sortable: true,
    },
    {
      header: 'Crop Type',
      accessor: 'cropType',
      render: (row) => row.cropType?.cropName || 'N/A',
    },
    {
      header: 'Quantity (kg)',
      accessor: 'remainingQuantityKg',
      render: (row) => `${row.remainingQuantityKg} kg`,
    },
    {
      header: 'Quality',
      accessor: 'qualityGrade',
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
      header: 'Storage Date',
      accessor: 'storageDate',
      render: (row) => new Date(row.storageDate).toLocaleDateString(),
    },
  ];

  // Buyer view: Card-based browsing with enquiries
  if (user?.userType === 'BUYER') {
    return (
      <div className="dashboard">
        <Sidebar />

        <div className="dashboard-container">
          <div className="search-section">
            <div className="search-box">
              <Search size={20} />
              <input
                type="text"
                placeholder="Search crops, farmers, or warehouses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="items-grid">
            {itemsLoading ? (
              <p>Loading available items...</p>
            ) : filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <div key={item.id} className="item-card">
                  {(item.cropImageUrl || item.cropType?.imageUrl) && (
                    <img
                      src={item.cropImageUrl
                        ? (item.cropImageUrl.startsWith('http') ? item.cropImageUrl : `http://localhost:8080${item.cropImageUrl}`)
                        : (item.cropType?.imageUrl?.startsWith('http') ? item.cropType.imageUrl : `http://localhost:8080${item.cropType.imageUrl}`)
                      }
                      alt={item.cropType?.cropName || 'Crop'}
                      className="item-image"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  <div className="item-content">
                    <h3>{item.cropType?.cropName || 'Unknown Crop'}</h3>

                    {item.cropType?.pricePerKg ? (
                      <p className="item-price">
                        RWF {item.cropType.pricePerKg.toLocaleString()} per {item.cropType.measurementUnit || 'KG'}
                      </p>
                    ) : (
                      <p className="item-price" style={{ fontSize: '14px', color: '#999', fontStyle: 'italic' }}>
                        Price not set
                      </p>
                    )}

                    <div className="item-details">
                      <p className="item-farmer">
                        <strong>Farmer:</strong> {item.farmer?.firstName || 'N/A'} {item.farmer?.lastName || ''}
                      </p>
                      <p className="item-warehouse">
                        <strong>Warehouse:</strong> {item.warehouse?.warehouseName || 'N/A'}
                      </p>
                      <p>
                        <strong>Available:</strong> {item.remainingQuantityKg || 0} {item.cropType?.measurementUnit || 'KG'}
                      </p>
                      <p>
                        <strong>Grade:</strong> {item.qualityGrade || 'N/A'}
                      </p>
                      {item.cropType?.category && (
                        <p style={{ fontSize: '12px', color: '#666' }}>
                          <strong>Category:</strong> {item.cropType.category}
                        </p>
                      )}
                      {item.storageDate && (
                        <p style={{ fontSize: '12px', color: '#666' }}>
                          <strong>Stored:</strong> {new Date(item.storageDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Check if buyer has pending enquiry for this item */}
                    {myEnquiries?.some(e => e.inventory?.id === item.id && e.status === 'PENDING') ? (
                      <div style={{ padding: '8px', background: '#fff3cd', borderRadius: '4px', textAlign: 'center', fontSize: '14px', color: '#856404' }}>
                        Enquiry Pending
                      </div>
                    ) : myEnquiries?.some(e => e.inventory?.id === item.id && e.status === 'ACCEPTED') ? (
                      <Button
                        variant="success"
                        icon={CreditCard}
                        onClick={() => {
                          const acceptedEnquiry = myEnquiries.find(e => e.inventory?.id === item.id && e.status === 'ACCEPTED');
                          const transactionId = acceptedEnquiry?.transaction?.id || acceptedEnquiry?.transactionId;
                          if (transactionId) {
                            navigate(`/payment/${transactionId}`);
                          } else {
                            toast.error('Transaction not found for accepted enquiry');
                          }
                        }}
                        style={{ width: '100%' }}
                      >
                        Proceed to Payment
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        icon={MessageSquare}
                        onClick={() => handleSendEnquiry(item)}
                        style={{ width: '100%' }}
                      >
                        Send Enquiry
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p>No items available for purchase at the moment.</p>
            )}
          </div>
        </div>

        {/* Enquiry Modal */}
        {showEnquiryModal && selectedItem && (
          <div className="modal-overlay" onClick={() => setShowEnquiryModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
              <div className="modal-header">
                <h2>Send Enquiry</h2>
                <Button variant="outline" size="small" className="modal-close" onClick={() => setShowEnquiryModal(false)} icon={X} />
              </div>
              <div className="modal-body">
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ marginBottom: '10px' }}>{selectedItem.cropType?.cropName || 'Unknown Crop'}</h3>
                  <p style={{ color: '#666', marginBottom: '5px' }}>
                    <strong>Available:</strong> {selectedItem.remainingQuantityKg || 0} {selectedItem.cropType?.measurementUnit || 'KG'}
                  </p>
                  {selectedItem.cropType?.pricePerKg ? (
                    <p style={{ color: '#666', marginBottom: '5px' }}>
                      <strong>Current Price:</strong> RWF {selectedItem.cropType.pricePerKg.toLocaleString()} per {selectedItem.cropType?.measurementUnit || 'KG'}
                    </p>
                  ) : (
                    <p style={{ color: '#999', marginBottom: '5px', fontStyle: 'italic' }}>
                      Price not set - you can propose a price
                    </p>
                  )}
                  <p style={{ color: '#666', marginBottom: '5px' }}>
                    <strong>Farmer:</strong> {selectedItem.farmer?.firstName || 'N/A'} {selectedItem.farmer?.lastName || ''}
                  </p>
                  <p style={{ color: '#666', marginBottom: '5px' }}>
                    <strong>Warehouse:</strong> {selectedItem.warehouse?.warehouseName || 'N/A'}
                  </p>
                  <p style={{ color: '#666', marginBottom: '5px' }}>
                    <strong>Grade:</strong> {selectedItem.qualityGrade || 'N/A'}
                  </p>
                </div>

                <form onSubmit={handleSubmitEnquiry}>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label htmlFor="proposedQuantity">Quantity (KG) *</label>
                    <input
                      type="number"
                      id="proposedQuantity"
                      value={proposedQuantity}
                      onChange={(e) => setProposedQuantity(e.target.value)}
                      required
                      min="0.01"
                      max={selectedItem.remainingQuantityKg}
                      step="0.01"
                      placeholder={`Max: ${selectedItem.remainingQuantityKg} KG`}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label htmlFor="proposedPrice">Proposed Price per KG (RWF) *</label>
                    <input
                      type="number"
                      id="proposedPrice"
                      value={proposedPrice}
                      onChange={(e) => setProposedPrice(e.target.value)}
                      required
                      min="1"
                      step="1"
                      placeholder={`Suggested: ${selectedItem.cropType?.pricePerKg?.toLocaleString()}`}
                    />
                    {selectedItem.cropType?.pricePerKg && (
                      <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>
                        Current price: RWF {selectedItem.cropType.pricePerKg.toLocaleString()} per KG
                      </small>
                    )}
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label htmlFor="enquiryMessage">Message (Optional)</label>
                    <textarea
                      id="enquiryMessage"
                      value={enquiryMessage}
                      onChange={(e) => setEnquiryMessage(e.target.value)}
                      rows="3"
                      placeholder="Add any additional message or negotiation terms..."
                    />
                  </div>

                  {proposedPrice && proposedQuantity && (
                    <div style={{
                      padding: '12px',
                      background: '#f0f0f0',
                      borderRadius: '8px',
                      marginBottom: '16px'
                    }}>
                      <p><strong>Total Amount:</strong> RWF {
                        (parseFloat(proposedPrice || 0) * parseFloat(proposedQuantity || 0)).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })
                      }</p>
                    </div>
                  )}

                  <div className="modal-actions">
                    <Button variant="outline" icon={X} onClick={() => setShowEnquiryModal(false)}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      icon={MessageSquare}
                      disabled={createEnquiryMutation.isLoading}
                    >
                      {createEnquiryMutation.isLoading ? 'Sending...' : 'Send Enquiry'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Non-buyer view: Table view
  if (error) {
    return (
      <div>
        <Sidebar />
        <div className="page-container">
          <div className="error-message">Error loading inventory</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <Sidebar />
      <div className="page-container">
        <div className="page-actions" style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
          {user?.userType === 'STOREKEEPER' && (
            <Button
              icon={Plus}
              iconPosition="left"
              onClick={() => navigate('/inventory/add')}
            >
              Add Inventory
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
          data={inventoriesForTable}
          columns={columns}
          loading={isLoading}
          pagination={true}
          pageSize={size}
          columnSearchable={true}
        />

        {data?.data?.totalPages > 1 && (
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

export default Inventory;
