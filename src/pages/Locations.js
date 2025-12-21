import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { dataService } from '../services/dataService';
import Sidebar from '../components/layout/Sidebar';
import WarehouseMap from '../components/maps/WarehouseMap';
import './Page.css';
import './Locations.css';

const Locations = () => {
  const queryClient = useQueryClient();

  // Fetch warehouses for map display - refetch frequently to catch new warehouses
  const { data: warehousesData, isLoading } = useQuery(
    'warehouses-for-map',
    () => dataService.getWarehouses({ page: 0, size: 1000, status: 'ACTIVE' }),
    {
      refetchInterval: 5000, // Refetch every 5 seconds to catch new warehouses
      refetchOnWindowFocus: true,
      staleTime: 3000, // Consider data stale after 3 seconds
      cacheTime: 60000, // Keep in cache for 60 seconds
    }
  );

  // Also listen for warehouse updates from other pages
  useEffect(() => {
    const handleStorageChange = () => {
      // Invalidate query when warehouse is added/updated
      queryClient.invalidateQueries('warehouses-for-map');
    };

    // Listen for custom events (when warehouse is added from other pages)
    window.addEventListener('warehouse-updated', handleStorageChange);

    // Also check localStorage for warehouse updates
    const checkInterval = setInterval(() => {
      const lastUpdate = localStorage.getItem('warehouse-last-update');
      if (lastUpdate) {
        queryClient.invalidateQueries('warehouses-for-map');
      }
    }, 2000);

    return () => {
      window.removeEventListener('warehouse-updated', handleStorageChange);
      clearInterval(checkInterval);
    };
  }, [queryClient]);

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="header-left">
            <h1>Locations & Warehouses</h1>
            <p>View warehouse locations on the map</p>
          </div>
        </div>

        {isLoading ? (
          <div className="loading-state">
            <div className="loader"></div>
            <p>Loading warehouses...</p>
          </div>
        ) : (
          <div className="warehouse-map-container">
            <WarehouseMap warehouses={warehousesData?.data?.content || warehousesData?.data || []} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Locations;




