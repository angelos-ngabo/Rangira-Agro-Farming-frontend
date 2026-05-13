import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight, User, Warehouse, Package, CreditCard, FileText, Sprout } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import './DashboardGlobalSearch.css';

const DashboardGlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
        setResults([]);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  

  const performSearch = async (term) => {
    if (!term || term.trim().length < 2) {
      setResults([]);
      return;
    }

    if (!user?.id) {
      console.warn('User not authenticated, cannot perform dashboard search');
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await dataService.dashboardSearch(term, 0, 15);
      const searchResults = response.data?.content || response.content || [];
      setResults(searchResults);
    } catch (error) {
      console.error('Dashboard search error:', error);
      if (error.response?.status === 401) {
        console.warn('Authentication failed during search');
      } else {
        console.error('Search failed:', error.response?.data?.error || error.message);
      }
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        performSearch(searchTerm);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, user]);

  const handleResultClick = (result) => {
    try {
      

      if (result.type === 'crop_type') {
        

        if (result.id) {
          const searchTerm = result.title || result.name || result.code || '';
          navigate(`/crop-types?search=${encodeURIComponent(searchTerm)}`);
        } else {
          navigate('/crop-types');
        }
      } else if (result.type === 'warehouse') {
        

        if (result.id) {
          const searchTerm = result.title || result.warehouseName || result.code || '';
          navigate(`/warehouses?search=${encodeURIComponent(searchTerm)}`);
        } else {
          navigate('/warehouses');
        }
      } else if (result.type === 'inventory') {
        

        if (result.id) {
          const searchTerm = result.title || result.inventoryCode || result.code || '';
          navigate(`/inventory?search=${encodeURIComponent(searchTerm)}`);
        } else {
          navigate('/inventory');
        }
      } else if (result.type === 'transaction') {
        

        if (result.id) {
          const searchTerm = result.title || result.transactionCode || result.code || '';
          navigate(`/transactions?search=${encodeURIComponent(searchTerm)}`);
        } else {
          navigate('/transactions');
        }
      } else if (result.type === 'enquiry') {
        

        if (result.id) {
          const searchTerm = result.title || result.enquiryCode || result.code || '';
          navigate(`/enquiries?search=${encodeURIComponent(searchTerm)}`);
        } else {
          navigate('/enquiries');
        }
      } else if (result.type === 'user') {
        

        if (result.id && user?.userType === 'ADMIN') {
          navigate(`/users/edit/${result.id}`);
        } else if (result.id) {
          const searchTerm = result.title || result.email || result.name || '';
          navigate(`/users?search=${encodeURIComponent(searchTerm)}`);
        } else {
          navigate('/users');
        }
      }
    } catch (error) {
      console.error('Error navigating to result:', error);
    }
    
    setIsOpen(false);
    setSearchTerm('');
    setResults([]);
  };

  const getResultTitle = (result) => {
    return result.title || result.code || 'Result';
  };

  const getResultDescription = (result) => {
    if (result.type === 'crop_type') {
      return `${result.category || 'Crop'} - ${result.description || 'High quality crop from Rwanda'}`;
    } else if (result.type === 'warehouse') {
      return `${result.warehouseType || 'Warehouse'} - ${result.location || ''}`;
    } else if (result.type === 'inventory') {
      return `${result.quantity || 0} kg available - ${result.qualityGrade || ''}`;
    } else if (result.type === 'transaction') {
      return `Status: ${result.status || ''} - Amount: RWF ${result.totalAmount?.toLocaleString() || 0}`;
    } else if (result.type === 'enquiry') {
      return `Status: ${result.status || ''} - Quantity: ${result.proposedQuantityKg || 0} kg`;
    } else if (result.type === 'user') {
      return `${result.userType || ''} - ${result.email || ''}`;
    }
    return '';
  };

  const getResultIcon = (result) => {
    switch (result.type) {
      case 'crop_type':
        return <Sprout size={18} />;
      case 'warehouse':
        return <Warehouse size={18} />;
      case 'inventory':
        return <Package size={18} />;
      case 'transaction':
        return <CreditCard size={18} />;
      case 'enquiry':
        return <FileText size={18} />;
      case 'user':
        return <User size={18} />;
      default:
        return <Search size={18} />;
    }
  };

  const highlightText = (text, searchTerm) => {
    if (!text || !searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="search-highlight">{part}</mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="dashboard-global-search" ref={searchRef}>
      <button
        className="dashboard-search-trigger"
        onClick={() => setIsOpen(!isOpen)}
        title="Search Dashboard"
      >
        <Search size={18} />
      </button>

      {isOpen && (
        <div className="dashboard-search-dropdown">
          <div className="dashboard-search-input-wrapper">
            <input
              type="text"
              className="dashboard-search-input"
              placeholder="Search dashboard..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            {searchTerm ? (
              <button
                className="dashboard-search-clear"
                onClick={() => {
                  setSearchTerm('');
                  setResults([]);
                }}
              >
                <X size={16} />
              </button>
            ) : (
              <Search size={18} className="dashboard-search-icon" />
            )}
          </div>

          {isSearching && (
            <div className="dashboard-search-loading">
              <div className="loader-small"></div>
              <span>Searching...</span>
            </div>
          )}

          {!isSearching && results.length > 0 && (
            <div className="dashboard-search-results">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="dashboard-search-result-item"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="dashboard-search-result-icon">
                    {getResultIcon(result)}
                  </div>
                  <div className="dashboard-search-result-content">
                    <div className="dashboard-search-result-title">
                      {highlightText(getResultTitle(result), searchTerm)}
                    </div>
                    <div className="dashboard-search-result-description">
                      {getResultDescription(result)}
                    </div>
                  </div>
                  <ArrowRight size={16} className="dashboard-search-result-arrow" />
                </div>
              ))}
            </div>
          )}

          {!isSearching && searchTerm && results.length === 0 && (
            <div className="dashboard-search-no-results">
              <p>No results found for "{searchTerm}"</p>
              <p className="dashboard-search-hint">
                {user?.userType === 'ADMIN' 
                  ? 'Try searching for users, warehouses, inventory, transactions, or crop types'
                  : 'Try searching within your own data'}
              </p>
            </div>
          )}

          {!isSearching && !searchTerm && (
            <div className="dashboard-search-empty-state">
              <Search size={32} className="dashboard-search-empty-icon" />
              <p>Start typing to search your dashboard...</p>
              <p className="dashboard-search-hint">
                {user?.userType === 'ADMIN' 
                  ? 'Search across all dashboard data'
                  : `Search your ${user?.userType?.toLowerCase() || 'user'} data`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardGlobalSearch;

