import api from './api';

export const dataService = {


  getUsers: (params) => {


    if (params?.page !== undefined || params?.size !== undefined) {
      return api.get('/users/paginated', { params });
    }
    return api.get('/users', { params });
  },
  getUserById: (id) => api.get(`/users/${id}`),
  getUsersByType: (userType) => api.get(`/users/type/${userType}`),

  createUser: (data) => api.post('/users', data),
  createUserByAdmin: (data) => api.post('/users/admin/create', data),

  updateUser: (id, data) => api.put(`/users/${id}`, data),
  updateUserProfile: (id, data) => api.patch(`/users/${id}/profile`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  uploadProfilePicture: (id, formData) => api.post(`/users/${id}/profile-picture`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteProfilePicture: (id) => api.delete(`/users/${id}/profile-picture`),
  updateNotificationPreference: (enabled) => api.patch('/users/me/notification-preference', null, { params: { enabled } }),
  updateTwoFactorPreference: (enabled) => api.patch('/users/me/two-factor-preference', null, { params: { enabled } }),



  getWarehouses: (params) => api.get('/warehouses', { params }),
  getWarehouseById: (id) => api.get(`/warehouses/${id}`),
  createWarehouse: (data) => api.post('/warehouses', data),
  createWarehouseWithCropTypes: (data) => api.post('/warehouses/with-crop-types', data),

  updateWarehouse: (id, data) => api.put(`/warehouses/${id}`, data),
  deleteWarehouse: (id) => api.delete(`/warehouses/${id}`),



  getInventories: (params) => api.get('/inventories', { params }),
  getInventory: (params) => api.get('/inventories', { params }),

  getAvailableInventories: () => api.get('/inventories/available'),

  getInventoryById: (id) => api.get(`/inventories/${id}`),
  createInventory: (data) => api.post('/inventories', data),
  updateInventory: (id, data) => api.put(`/inventories/${id}`, data),
  deleteInventory: (id) => api.delete(`/inventories/${id}`),
  updateInventoryByStorekeeper: (id, data) => api.patch(`/inventories/${id}/storekeeper`, data),
  createInventoryByStorekeeper: (data) => api.post('/inventories/storekeeper/create', data),
  deleteInventoryByStorekeeper: (id) => api.delete(`/inventories/${id}/storekeeper`),



  createInventoryRequest: (data) => api.post('/inventory-requests', data),
  getMyInventoryRequests: () => api.get('/inventory-requests/my-requests'),
  getInventoryRequestById: (id) => api.get(`/inventory-requests/${id}`),
  getPendingInventoryRequests: () => api.get('/inventory-requests/storekeeper/pending'),
  getAllInventoryRequests: () => api.get('/inventory-requests/storekeeper/all'),
  respondToInventoryRequest: (id, data) => api.post(`/inventory-requests/${id}/respond`, data),
  deleteInventoryRequest: (id) => api.delete(`/inventory-requests/${id}`),



  getTransactions: (params) => {


    if (params?.buyerId) {
      return api.get(`/transactions/buyer/${params.buyerId}`);
    }


    if (params?.page !== undefined || params?.size !== undefined) {
      return api.get('/transactions/paginated', { params });
    }


    return api.get('/transactions', { params });
  },
  getTransactionsByPaymentStatus: (paymentStatus) => api.get(`/transactions/payment-status/${paymentStatus}`),
  getTransactionById: (id) => api.get(`/transactions/${id}`),
  getTotalSystemCommission: () => api.get('/transactions/commission/total'),
  createTransaction: (data) => api.post('/transactions', data),
  updateTransaction: (id, data) => api.put(`/transactions/${id}`, data),
  updatePaymentStatus: (id, status) => api.patch(`/transactions/${id}/payment`, { paymentStatus: status }),



  subscribeNewsletter: (email) => api.post('/newsletter/subscribe', { email }),
  unsubscribeNewsletter: (email) => api.post('/newsletter/unsubscribe', { email }),



  sendContactMessage: (data) => api.post('/contact/send', data),



  getLocations: (params) => api.get('/locations', { params }),
  getLocationsByType: (type) => api.get(`/locations/type/${type}`),

  getLocationById: (id) => api.get(`/locations/${id}`),
  createLocation: (data) => api.post('/locations', data),
  updateLocation: (id, data) => api.put(`/locations/${id}`, data),
  deleteLocation: (id) => api.delete(`/locations/${id}`),
  getProvinces: (params) => api.get('/locations/provinces', { params }),
  getDistricts: (province) => api.get('/locations/districts', { params: { province } }),
  getSectors: (province, district) => api.get('/locations/sectors', { params: { province, district } }),
  getCells: (province, district, sector) => api.get('/locations/cells', { params: { province, district, sector } }),
  getVillages: (province, district, sector, cell) => api.get('/locations/villages', { params: { province, district, sector, cell } }),
  getChildLocations: (parentId) => api.get(`/locations/parent/${parentId}/children`),
  searchLocations: (name) => api.get('/locations/search', { params: { name } }),



  getCropTypes: (params) => api.get('/crop-types', { params }),
  getCropTypeById: (id) => api.get(`/crop-types/${id}`),
  createCropType: (data) => api.post('/crop-types', data),
  updateCropType: (id, data) => api.put(`/crop-types/${id}`, data),
  deleteCropType: (id) => api.delete(`/crop-types/${id}`),



  getRatings: (params) => {


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



  getDashboardStats: () => api.get('/dashboard/stats'),



  getWarehouseAccesses: (params) => api.get('/warehouse-accesses', { params }),
  getWarehouseAccessById: (id) => api.get(`/warehouse-accesses/${id}`),
  createWarehouseAccess: (data) => api.post('/warehouse-accesses', data),
  updateWarehouseAccess: (id, data) => api.put(`/warehouse-accesses/${id}`, data),
  updateWarehouseAccessStatus: (id, status) => api.patch(`/warehouse-accesses/${id}/status`, null, { params: { status } }),
  deleteWarehouseAccess: (id) => api.delete(`/warehouse-accesses/${id}`),
  checkStorekeeperAssignment: (storekeeperId, warehouseId) => api.get('/warehouse-accesses/assign-storekeeper/check', { params: { storekeeperId, warehouseId } }),
  assignStorekeeperToWarehouse: (storekeeperId, warehouseId) => api.post('/warehouse-accesses/assign-storekeeper', { storekeeperId, warehouseId }),
  uploadWarehouseAccessImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/warehouse-accesses/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },



  sendMessage: (data) => api.post('/messages', data),
  getConversation: (userId1, userId2) => api.get('/messages/conversation', { params: { userId1, userId2 } }),
  getMessagesForUser: (userId, params) => api.get(`/messages/user/${userId}`, { params }),
  getUnreadMessages: (userId) => api.get(`/messages/user/${userId}/unread`),
  getUnreadMessageCount: (userId) => api.get(`/messages/user/${userId}/unread-count`),
  getMessageById: (messageId) => api.get(`/messages/${messageId}`),
  markMessageAsRead: (messageId) => api.patch(`/messages/${messageId}/read`),



  getNotifications: () => api.get('/notifications'),
  getUnreadNotifications: () => api.get('/notifications/unread'),
  getUnreadNotificationCount: () => api.get('/notifications/unread/count'),
  markNotificationAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllNotificationsAsRead: () => api.patch('/notifications/read-all'),



  getBuyerReceipts: () => api.get('/receipts'),
  getReceiptByTransactionId: (transactionId) => api.get(`/receipts/${transactionId}`),
  downloadReceipt: (transactionId) => api.get(`/receipts/${transactionId}/download`, { responseType: 'blob' }),


  getReceiptByTransactionIdAdmin: (transactionId) => api.get(`/receipts/admin/${transactionId}`),
  downloadReceiptAdmin: (transactionId) => api.get(`/receipts/admin/${transactionId}/download`, { responseType: 'blob' }),



  createEnquiry: (data) => api.post('/enquiries', data),
  getBuyerEnquiries: () => api.get('/enquiries/buyer'),
  getFarmerEnquiries: () => api.get('/enquiries/farmer'),
  respondToEnquiry: (enquiryId, data) => api.post(`/enquiries/${enquiryId}/respond`, data),
  getEnquiryById: (id) => api.get(`/enquiries/${id}`),



  processPayment: (data) => api.post('/payments', data),



  getWallet: () => api.get('/wallet'),
  requestWithdrawal: (data) => api.post('/wallet/withdraw', data),
  verifyWithdrawalOtp: (withdrawalId, otpCode) => api.post(`/wallet/withdraw/${withdrawalId}/verify-otp`, { otpCode }),
  getWithdrawals: () => api.get('/wallet/withdrawals'),



  getSellerTransactions: (sellerId) => api.get(`/transactions/seller/${sellerId}`),
  getMyTransactions: () => api.get('/transactions/my-transactions'),



  updateDeliveryStatus: (transactionId, status) => api.patch(`/transactions/${transactionId}/delivery-status?deliveryStatus=${status}`),



  publicSearch: (query, page = 0, size = 15) => api.get('/public/search', {
    params: { q: query, page, size }
  }),



  dashboardSearch: (query, page = 0, size = 15) => api.get('/dashboard/search', {
    params: { q: query, page, size }
  }),
};


