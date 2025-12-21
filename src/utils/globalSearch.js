import { dataService } from '../services/dataService';

export const globalSearch = async (query) => {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const searchTerm = query.trim().toLowerCase();
  const results = [];

  try {
    // Search users
    const usersResponse = await dataService.getUsers({ search: searchTerm });
    if (usersResponse.data?.content) {
      usersResponse.data.content.forEach((user) => {
        results.push({
          type: 'User',
          id: user.id,
          title: `${user.firstName} ${user.lastName}`,
          subtitle: user.email,
          url: `/users/${user.id}`,
          icon: '👤',
        });
      });
    }

    // Search warehouses
    const warehousesResponse = await dataService.getWarehouses({ search: searchTerm });
    if (warehousesResponse.data?.content) {
      warehousesResponse.data.content.forEach((warehouse) => {
        results.push({
          type: 'Warehouse',
          id: warehouse.id,
          title: warehouse.warehouseName,
          subtitle: warehouse.warehouseCode,
          url: `/warehouses/${warehouse.id}`,
          icon: '🏪',
        });
      });
    }

    // Search inventory
    const inventoryResponse = await dataService.getInventories({ search: searchTerm });
    if (inventoryResponse.data?.content) {
      inventoryResponse.data.content.forEach((inventory) => {
        results.push({
          type: 'Inventory',
          id: inventory.id,
          title: inventory.inventoryCode,
          subtitle: `Quantity: ${inventory.remainingQuantityKg}kg`,
          url: `/inventory/${inventory.id}`,
          icon: '📦',
        });
      });
    }

    // Search transactions
    const transactionsResponse = await dataService.getTransactions({ search: searchTerm });
    if (transactionsResponse.data?.content) {
      transactionsResponse.data.content.forEach((transaction) => {
        results.push({
          type: 'Transaction',
          id: transaction.id,
          title: transaction.transactionCode,
          subtitle: `Amount: ${transaction.totalAmount}`,
          url: `/transactions/${transaction.id}`,
          icon: '💰',
        });
      });
    }

    // Search crop types
    const cropTypesResponse = await dataService.getCropTypes({ search: searchTerm });
    if (cropTypesResponse.data?.content) {
      cropTypesResponse.data.content.forEach((cropType) => {
        results.push({
          type: 'Crop Type',
          id: cropType.id,
          title: cropType.cropName,
          subtitle: cropType.cropCode,
          url: `/crop-types/${cropType.id}`,
          icon: '🌾',
        });
      });
    }
  } catch (error) {
    console.error('Global search error:', error);
  }

  return results.slice(0, 10); // Limit to 10 results
};




