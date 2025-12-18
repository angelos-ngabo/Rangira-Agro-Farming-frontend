import React, { useEffect, useState, useRef } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { dataService } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/layout/Sidebar';
import WarehouseMap from '../components/maps/WarehouseMap';
import AddLocationModal from '../components/location/AddLocationModal';
import { Menu, X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import './Page.css';
import './Locations.css';

const Locations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef(null);
  const manualToggle = useRef(false);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);

  

  const { data: warehousesData, isLoading } = useQuery(
    'warehouses-for-map',
    () => dataService.getWarehouses({ page: 0, size: 1000, status: 'ACTIVE' }),
    {
      refetchInterval: 5000, 

      refetchOnWindowFocus: true,
      staleTime: 3000, 

      cacheTime: 60000, 

    }
  );

  

  useEffect(() => {
    const handleStorageChange = () => {
      

      queryClient.invalidateQueries('warehouses-for-map');
    };

    

    window.addEventListener('warehouse-updated', handleStorageChange);

    

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

  

  

  

  

  

  

  

  


  

      
  

  

  

  


  

  

  

  

  

  

  

  

  

  


  

  


  

    
  

  

  

  

  

  

  


  const handleToggleSidebar = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    manualToggle.current = true;
    setSidebarVisible(prev => {
      const newValue = !prev;
      return newValue;
    });
  };

  return (
    <div className="dashboard" style={{ height: '100vh', overflow: 'hidden' }}>
      <div 
        className="sidebar-wrapper"
        style={{
          left: sidebarVisible ? '0' : '-260px'
        }}
      >
        <Sidebar />
      </div>
      <div 
        className="locations-map-wrapper"
        style={{ 
          marginLeft: '0',
          width: '100%',
          height: '100vh',
          overflow: 'auto',
          position: 'relative',
          transition: 'margin-left 0.3s ease'
        }}
      >
        {}
        {user?.userType === 'ADMIN' && (
          <button
            onClick={() => setShowAddLocationModal(true)}
            style={{
              position: 'fixed',
              top: '10px',
              left: sidebarVisible ? '280px' : '20px',
              zIndex: 1001,
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              transition: 'all 0.3s ease',
              fontSize: '14px',
              fontWeight: '500',
              gap: '6px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#0056b3'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#007bff'}
            title="Add New Location (Full Hierarchy: Province → District → Sector → Cell → Village)"
          >
            <Plus size={18} /> Add Location
          </button>
        )}
        <button
          className="sidebar-toggle-btn"
          onClick={handleToggleSidebar}
          style={{
            position: 'fixed',
            top: '10px',
            right: '50px', 

            zIndex: 1001,
            background: '#116530',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            transition: 'background 0.2s, right 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#2ea359'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#116530'}
          title={sidebarVisible ? 'Hide Sidebar' : 'Show Sidebar'}
        >
          {sidebarVisible ? <X size={20} /> : <Menu size={20} />}
        </button>
        {isLoading ? (
          <div className="loading-state">
            <div className="loader"></div>
            <p>Loading warehouses...</p>
          </div>
        ) : (
          <WarehouseMap warehouses={warehousesData?.data?.content || warehousesData?.data || []} />
        )}
      </div>
      
      {}
      {user?.userType === 'ADMIN' && (
        <AddLocationModal
          isOpen={showAddLocationModal}
          onClose={(success) => {
            setShowAddLocationModal(false);
            if (success) {
              

              queryClient.invalidateQueries('locations');
              queryClient.invalidateQueries('warehouses-for-map');
            }
          }}
        />
      )}
    </div>
  );
};

export default Locations;




