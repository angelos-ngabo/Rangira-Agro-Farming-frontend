import api from './api';

export const dataService = {
  // Users
  getUsers: (params) => {
    // Use paginated endpoint if page and size are provided
    if (params?.page !== undefined || params?.size !== undefined) {
      return api.get('/users/paginated', { params });
    }
    return api.get('/users', { params });
  },
  getUserById: (id) => api.get(`/users/${id}`),
  getUsersByType: (userType) => api.get(`/users/type/${userType}`), // Get users filtered by type (e.g., STOREKEEPER, FARMER, BUYER)
  createUser: (data) => api.post('/users', data),
  createUserByAdmin: (data) => api.post('/users/admin/create', data), // Admin only - for FARMER and STOREKEEPER
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  updateUserProfile: (id, data) => api.patch(`/users/${id}/profile`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  uploadProfilePicture: (id, formData) => api.post(`/users/${id}/profile-picture`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteProfilePicture: (id) => api.delete(`/users/${id}/profile-picture`),
  updateNotificationPreference: (enabled) => api.patch('/users/me/notification-preference', null, { params: { enabled } }),
  updateTwoFactorPreference: (enabled) => api.patch('/users/me/two-factor-preference', null, { params: { enabled } }),

  // Warehouses
  getWarehouses: (params) => api.get('/warehouses', { params }),
  getWarehouseById: (id) => api.get(`/warehouses/${id}`),
  createWarehouse: (data) => api.post('/warehouses', data),
  createWarehouseWithCropTypes: (data) => api.post('/warehouses/with-crop-types', data), // With crop types
  updateWarehouse: (id, data) => api.put(`/warehouses/${id}`, data),
  deleteWarehouse: (id) => api.delete(`/warehouses/${id}`),

  // Inventory
  getInventories: (params) => api.get('/inventories', { params }),
  getInventoryById: (id) => api.get(`/inventories/${id}`),
  createInventory: (data) => api.post('/inventories', data),
  updateInventory: (id, data) => api.put(`/inventories/${id}`, data),
  deleteInventory: (id) => api.delete(`/inventories/${id}`),
  updateInventoryByStorekeeper: (id, data) => api.patch(`/inventories/${id}/storekeeper`, data),
  createInventoryByStorekeeper: (data) => api.post('/inventories/storekeeper/create', data),
  deleteInventoryByStorekeeper: (id) => api.delete(`/inventories/${id}/storekeeper`),

  // Inventory Requests
  createInventoryRequest: (data) => api.post('/inventory-requests', data),
  getMyInventoryRequests: () => api.get('/inventory-requests/my-requests'),
  getInventoryRequestById: (id) => api.get(`/inventory-requests/${id}`),
  getPendingInventoryRequests: () => api.get('/inventory-requests/storekeeper/pending'),
  getAllInventoryRequests: () => api.get('/inventory-requests/storekeeper/all'),
  respondToInventoryRequest: (id, data) => api.post(`/inventory-requests/${id}/respond`, data),
  deleteInventoryRequest: (id) => api.delete(`/inventory-requests/${id}`),

  // Transactions
  getTransactions: (params) => {
    // If buyerId is provided, use the buyer-specific endpoint
    if (params?.buyerId) {
      return api.get(`/transactions/buyer/${params.buyerId}`);
    }
    // If pagination parameters are provided, use the paginated endpoint
    if (params?.page !== undefined || params?.size !== undefined) {
      return api.get('/transactions/paginated', { params });
    }
    // Otherwise return all transactions
    return api.get('/transactions', { params });
  },
  getTransactionsByPaymentStatus: (paymentStatus) => api.get(`/transactions/payment-status/${paymentStatus}`),
  getTransactionById: (id) => api.get(`/transactions/${id}`),
  createTransaction: (data) => api.post('/transactions', data),
  updateTransaction: (id, data) => api.put(`/transactions/${id}`, data),
  updatePaymentStatus: (id, status) => api.patch(`/transactions/${id}/payment`, { paymentStatus: status }),

  // Locations
  getLocations: (params) => api.get('/locations', { params }),
  getLocationById: (id) => api.get(`/locations/${id}`),
  createLocation: (data) => api.post('/locations', data),
  updateLocation: (id, data) => api.put(`/locations/${id}`, data),
  deleteLocation: (id) => api.delete(`/locations/${id}`),
  getProvinces: () => api.get('/locations/provinces'),
  getChildLocations: (parentId) => api.get(`/locations/parent/${parentId}/children`),

  // Crop Types
  getCropTypes: (params) => api.get('/crop-types', { params }),
  getCropTypeById: (id) => api.get(`/crop-types/${id}`),
  createCropType: (data) => api.post('/crop-types', data),
  updateCropType: (id, data) => api.put(`/crop-types/${id}`, data),
  deleteCropType: (id) => api.delete(`/crop-types/${id}`),

  // Ratings
  getRatings: (params) => {
    // Use paginated endpoint if page and size are provided
    if (params?.page !== undefined || params?.size !== undefined) {
      return api.get('/ratings/paginated', { params });
    }
    return api.get('/ratings', { params });
  },
  getRatingById: (id) => api.get(`/ratings/${id}`),
  createRating: (data) => api.post('/ratings', data),
  updateRating: (id, data) => api.put(`/ratings/${id}`, data),
  deleteRating: (id) => api.delete(`/ratings/${id}`),
  getRatingsByTransaction: (transactionId) => api.get(`/ratings/transaction/${transactionId}`),

  // Dashboard Stats
  getDashboardStats: () => api.get('/dashboard/stats'),

  // Warehouse Access
  getWarehouseAccesses: (params) => api.get('/warehouse-accesses', { params }),
  getWarehouseAccessById: (id) => api.get(`/warehouse-accesses/${id}`),
  createWarehouseAccess: (data) => api.post('/warehouse-accesses', data),
  updateWarehouseAccess: (id, data) => api.put(`/warehouse-accesses/${id}`, data),
  updateWarehouseAccessStatus: (id, status) => api.patch(`/warehouse-accesses/${id}/status`, null, { params: { status } }),
  deleteWarehouseAccess: (id) => api.delete(`/warehouse-accesses/${id}`),
  assignStorekeeperToWarehouse: (storekeeperId, warehouseId) => api.post('/warehouse-accesses/assign-storekeeper', { storekeeperId, warehouseId }),
  uploadWarehouseAccessImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/warehouse-accesses/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Messages
  sendMessage: (data) => api.post('/messages', data),
  getConversation: (userId1, userId2) => api.get('/messages/conversation', { params: { userId1, userId2 } }),
  getMessagesForUser: (userId, params) => api.get(`/messages/user/${userId}`, { params }),
  getUnreadMessages: (userId) => api.get(`/messages/user/${userId}/unread`),
  getUnreadMessageCount: (userId) => api.get(`/messages/user/${userId}/unread-count`),
  getMessageById: (messageId) => api.get(`/messages/${messageId}`),
  markMessageAsRead: (messageId) => api.patch(`/messages/${messageId}/read`),

  // Notifications
  getNotifications: () => api.get('/notifications'),
  getUnreadNotifications: () => api.get('/notifications/unread'),
  getUnreadNotificationCount: () => api.get('/notifications/unread/count'),
  markNotificationAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllNotificationsAsRead: () => api.patch('/notifications/read-all'),

  // Receipts
  getBuyerReceipts: () => api.get('/receipts'),
  getReceiptByTransactionId: (transactionId) => api.get(`/receipts/${transactionId}`),
  downloadReceipt: (transactionId) => api.get(`/receipts/${transactionId}/download`, { responseType: 'blob' }),
  // Admin Receipts
  getReceiptByTransactionIdAdmin: (transactionId) => api.get(`/receipts/admin/${transactionId}`),
  downloadReceiptAdmin: (transactionId) => api.get(`/receipts/admin/${transactionId}/download`, { responseType: 'blob' }),

  // Enquiries
  createEnquiry: (data) => api.post('/enquiries', data),
  getBuyerEnquiries: () => api.get('/enquiries/buyer'),
  getFarmerEnquiries: () => api.get('/enquiries/farmer'),
  respondToEnquiry: (enquiryId, data) => api.post(`/enquiries/${enquiryId}/respond`, data),
  getEnquiryById: (id) => api.get(`/enquiries/${id}`),

  // Payments
  processPayment: (data) => api.post('/payments', data),
  
  // Wallet
  getWallet: () => api.get('/wallet'),
  requestWithdrawal: (data) => api.post('/wallet/withdraw', data),
  verifyWithdrawalOtp: (withdrawalId, otpCode) => api.post(`/wallet/withdraw/${withdrawalId}/verify-otp`, { otpCode }),
  getWithdrawals: () => api.get('/wallet/withdrawals'),
  
  // Transactions (seller/farmer)
  getSellerTransactions: (sellerId) => api.get(`/transactions/seller/${sellerId}`),
  getMyTransactions: () => api.get('/transactions/my-transactions'),
  
  // Delivery/Shipment
  updateDeliveryStatus: (transactionId, status) => api.patch(`/transactions/${transactionId}/delivery-status?deliveryStatus=${status}`),
};


