import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/dataService';
import Sidebar from '../components/layout/Sidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import Button from '../components/common/Button';
import { Sprout, DollarSign, Package, MapPin, Star, Search, Filter, MessageSquare, User } from 'lucide-react';
import toast from 'react-hot-toast';
import './Dashboard.css';
import './BrowseCrops.css';

const BrowseCrops = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  

  

  const { data: inventoryData, isLoading } = useQuery(
    'available-inventory-for-browse',
    async () => {
      try {
        

        

        const response = await dataService.getAvailableInventories();
        return response.data || [];
      } catch (error) {
        console.error('Error fetching available inventory:', error);
        

        const fallback = await dataService.getInventory({ page: 0, size: 1000, status: 'STORED' });
        return fallback.data?.content || fallback.data || [];
      }
    },
    { 
      staleTime: 60000,
      refetchInterval: 30000
    }
  );

  const availableInventory = Array.isArray(inventoryData) ? inventoryData : (inventoryData?.data?.content || inventoryData?.data || []);
  
  

  

  const filteredInventory = availableInventory.filter(inv => 
    inv.remainingQuantityKg > 0 && (inv.status === 'STORED' || inv.status === 'PARTIALLY_SOLD')
  );

  

  const categories = ['ALL', ...new Set(
    filteredInventory
      .map(inv => inv.cropType?.category)
      .filter(Boolean)
  )];

  

  const displayInventory = filteredInventory.filter(inv => {
    const matchesSearch = 
      inv.cropType?.cropName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.cropType?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.farmer?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.farmer?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.warehouse?.warehouseName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'ALL' || inv.cropType?.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleSendEnquiry = (item) => {
    navigate(`/inventory?inventoryId=${item.id}&action=enquiry`);
  };

  if (!user || user.userType !== 'BUYER') {
    return (
      <div className="dashboard">
        <Sidebar />
        <div className="dashboard-container">
          <DashboardHeader />
          <div className="dashboard-section">
            <p>This page is only available for buyers.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboard-container">
        <DashboardHeader 
          title="Browse Available Crops"
          subtitle="Explore available inventory and send enquiries to farmers"
        />

        {}
        <div className="browse-crops-controls">
          <div className="search-box">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search by crop name, farmer, or warehouse..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-box">
            <Filter size={20} className="filter-icon" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-filter"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {}
        {isLoading ? (
          <div className="loading-state">
            <div className="loader"></div>
            <p>Loading available crops...</p>
          </div>
        ) : displayInventory.length > 0 ? (
          <div className="crop-types-grid-browse">
            {displayInventory.map((item) => {
              const imageUrl = item.cropImageUrl || item.cropType?.imageUrl;
              const price = item.cropType?.pricePerKg || 0;
              
              return (
                <div key={item.id} className="crop-type-card-browse">
                  <div className="crop-type-image-wrapper-browse">
                    {imageUrl ? (
                      <img
                        src={imageUrl.startsWith('http') 
                          ? imageUrl 
                          : `http://localhost:8080/api/files/crop-types/${imageUrl}`}
                        alt={item.cropType?.cropName || 'Crop'}
                        className="crop-type-image-browse"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextElementSibling) {
                            e.target.nextElementSibling.style.display = 'flex';
                          }
                        }}
                      />
                    ) : (
                      <div className="crop-type-image-placeholder-browse">
                        <Sprout size={48} />
                      </div>
                    )}
                    {item.cropType?.category && (
                      <div className="crop-type-badge-overlay">{item.cropType.category}</div>
                    )}
                  </div>
                  <div className="crop-type-content-browse">
                    <h3 className="crop-type-name-browse">{item.cropType?.cropName || 'Unknown Crop'}</h3>
                    <p className="crop-type-description-browse">
                      {item.cropType?.description || 'High quality crop from Rwanda'}
                    </p>
                    
                    <div className="crop-type-details-browse">
                      <div className="detail-item">
                        <DollarSign size={16} />
                        <span>RWF {price.toLocaleString()} / {item.cropType?.measurementUnit || 'KG'}</span>
                      </div>
                      <div className="detail-item">
                        <Package size={16} />
                        <span>{parseFloat(item.remainingQuantityKg || 0).toFixed(2)} {item.cropType?.measurementUnit || 'KG'} available</span>
                      </div>
                      <div className="detail-item">
                        <User size={16} />
                        <span>{item.farmer?.firstName || ''} {item.farmer?.lastName || ''}</span>
                      </div>
                      {item.warehouse?.warehouseName && (
                        <div className="detail-item">
                          <MapPin size={16} />
                          <span>{item.warehouse.warehouseName}</span>
                        </div>
                      )}
                      {item.qualityGrade && (
                        <div className="detail-item">
                          <Star size={16} fill="#fbbf24" color="#fbbf24" />
                          <span>Grade: {item.qualityGrade}</span>
                        </div>
                      )}
                    </div>

                    <div className="crop-type-footer-browse">
                      <Button
                        variant="primary"
                        size="medium"
                        icon={MessageSquare}
                        onClick={() => handleSendEnquiry(item)}
                        style={{ flex: 1 }}
                      >
                        Send Enquiry
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <Sprout size={64} style={{ color: '#ccc', marginBottom: '16px' }} />
            <p>No available crops found matching your search criteria.</p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('ALL');
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseCrops;
