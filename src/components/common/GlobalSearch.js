import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import './GlobalSearch.css';

const GlobalSearch = ({ scope = 'dashboard', onResultClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);
  const resultsRef = useRef(null);
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  

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

    setIsSearching(true);
    try {
      let searchResults = [];

      if (scope === 'dashboard') {
        

        const searchPromises = [];

        

        searchPromises.push(
          dataService.getCropTypes({ page: 0, size: 100 }).then(r => {
            const data = r.data?.content || r.data || [];
            return data.filter(crop => 
              crop.cropName?.toLowerCase().includes(term.toLowerCase()) ||
              crop.category?.toLowerCase().includes(term.toLowerCase()) ||
              crop.description?.toLowerCase().includes(term.toLowerCase())
            );
          }).catch(() => [])
        );

        if (user?.userType === 'ADMIN') {
          

          const termLower = term.toLowerCase();
          searchPromises.push(
            dataService.getUsers({ search: term }).then(r => r.data?.content || r.data || []).catch(() => []),
            dataService.getWarehouses({ page: 0, size: 100 }).then(r => {
              const data = r.data?.content || r.data || [];
              return data.filter(warehouse => 
                warehouse.warehouseName?.toLowerCase().includes(termLower) ||
                warehouse.warehouseCode?.toLowerCase().includes(termLower) ||
                JSON.stringify(warehouse).toLowerCase().includes(termLower)
              );
            }).catch(() => []),
            dataService.getInventory({ page: 0, size: 100 }).then(r => {
              const data = r.data?.content || r.data || [];
              return data.filter(inventory => 
                JSON.stringify(inventory).toLowerCase().includes(termLower)
              );
            }).catch(() => []),
            dataService.getTransactions({ page: 0, size: 100 }).then(r => {
              const data = r.data?.content || r.data || [];
              return data.filter(transaction => 
                JSON.stringify(transaction).toLowerCase().includes(termLower)
              );
            }).catch(() => [])
          );
        } else if (user?.userType === 'FARMER') {
          

          searchPromises.push(
            dataService.getFarmerInventory().then(r => {
              const data = r.data?.content || r.data || [];
              return data.filter(item => 
                JSON.stringify(item).toLowerCase().includes(term.toLowerCase())
              );
            }).catch(() => []),
            dataService.getFarmerTransactions().then(r => {
              const data = r.data?.content || r.data || [];
              return data.filter(item => 
                JSON.stringify(item).toLowerCase().includes(term.toLowerCase())
              );
            }).catch(() => []),
            dataService.getFarmerEnquiries().then(r => {
              const data = r.data?.content || r.data || [];
              return data.filter(item => 
                JSON.stringify(item).toLowerCase().includes(term.toLowerCase())
              );
            }).catch(() => [])
          );
        } else if (user?.userType === 'BUYER') {
          

          searchPromises.push(
            dataService.getBuyerTransactions().then(r => {
              const data = r.data?.content || r.data || [];
              return data.filter(item => 
                JSON.stringify(item).toLowerCase().includes(term.toLowerCase())
              );
            }).catch(() => []),
            dataService.getBuyerEnquiries().then(r => {
              const data = r.data?.content || r.data || [];
              return data.filter(item => 
                JSON.stringify(item).toLowerCase().includes(term.toLowerCase())
              );
            }).catch(() => []),
            dataService.getInventory({ search: term, status: 'AVAILABLE' }).then(r => r.data?.content || r.data || []).catch(() => [])
          );
        } else if (user?.userType === 'STOREKEEPER') {
          

          searchPromises.push(
            dataService.getStorekeeperWarehouses().then(warehouses => {
              const warehouseIds = (warehouses.data?.content || warehouses.data || []).map(w => w.id);
              return dataService.getInventory({ search: term }).then(r => {
                const data = r.data?.content || r.data || [];
                return data.filter(item => warehouseIds.includes(item.warehouse?.id));
              }).catch(() => []);
            }).catch(() => []),
            dataService.getStorekeeperWarehouses().then(warehouses => {
              const warehouseIds = (warehouses.data?.content || warehouses.data || []).map(w => w.id);
              return dataService.getInventoryRequests({ search: term }).then(r => {
                const data = r.data?.content || r.data || [];
                return data.filter(item => warehouseIds.includes(item.inventory?.warehouse?.id));
              }).catch(() => []);
            }).catch(() => [])
          );
        }

        const results = await Promise.all(searchPromises);
        searchResults = results.flat().slice(0, 10); 

      } else {
        

        const searchPromises = [];
        const termLower = term.toLowerCase();
        
        

        searchPromises.push(
          dataService.getCropTypes({ page: 0, size: 100 }).then(r => {
            const data = r.data?.content || r.data || [];
            return data.filter(crop => 
              crop.cropName?.toLowerCase().includes(termLower) ||
              crop.category?.toLowerCase().includes(termLower) ||
              (crop.description && crop.description.toLowerCase().includes(termLower))
            ).map(crop => ({
              ...crop,
              type: 'crop_type'
            }));
          }).catch((err) => {
            console.error('Error searching crop types:', err);
            return [];
          })
        );
        
        

        searchPromises.push(
          dataService.getWarehouses({ page: 0, size: 100 }).then(r => {
            const data = r.data?.content || r.data || [];
            return data.filter(warehouse => 
              warehouse.warehouseName?.toLowerCase().includes(termLower) ||
              warehouse.warehouseCode?.toLowerCase().includes(termLower) ||
              warehouse.warehouseType?.toString().toLowerCase().includes(termLower) ||
              (warehouse.address && warehouse.address.toLowerCase().includes(termLower))
            ).map(warehouse => ({
              ...warehouse,
              type: 'warehouse'
            }));
          }).catch((err) => {
            console.error('Error searching warehouses:', err);
            return [];
          })
        );
        
        

        searchPromises.push(
          dataService.getInventory({ page: 0, size: 100, status: 'AVAILABLE' }).then(r => {
            const data = r.data?.content || r.data || [];
            return data.filter(inventory => {
              const searchableText = JSON.stringify(inventory).toLowerCase();
              return searchableText.includes(termLower);
            }).map(inventory => ({
              ...inventory,
              type: 'inventory'
            }));
          }).catch((err) => {
            console.error('Error searching inventory:', err);
            return [];
          })
        );
        
        

        const pageContent = document.body.innerText || '';
        const contentLower = pageContent.toLowerCase();
        
        if (contentLower.includes(termLower)) {
          searchPromises.push(
            Promise.resolve([{
              type: 'page_content',
              title: `Found "${term}" on this page`,
              description: 'Click to scroll to the first occurrence',
              term: term
            }])
          );
        }
        
        const results = await Promise.all(searchPromises);
        searchResults = results.flat().slice(0, 15); 

      }

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
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
  }, [searchTerm, scope, user]);

  const handleResultClick = (result) => {
    if (onResultClick) {
      onResultClick(result);
    } else {
      

      if (result.type === 'page_content') {
        

        const term = result.term || searchTerm;
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
        
        let node;
        while (node = walker.nextNode()) {
          if (node.textContent.toLowerCase().includes(term.toLowerCase())) {
            node.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            

            const range = document.createRange();
            const text = node.textContent;
            const index = text.toLowerCase().indexOf(term.toLowerCase());
            range.setStart(node, index);
            range.setEnd(node, index + term.length);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            break;
          }
        }
      } else if (result.id) {
        

        if (result.cropName || result.cropCode || result.type === 'crop_type') {
          

          navigate(`/crop-types/${result.id}`);
        } else if (result.warehouseName || result.warehouseCode || result.type === 'warehouse') {
          

          navigate(`/warehouses/${result.id}`);
        } else if (result.inventoryCode || result.type === 'inventory') {
          

          navigate(`/inventory/${result.id}`);
        } else if (result.transactionCode) {
          navigate(`/transactions/${result.id}`);
        } else if (result.userCode) {
          navigate(`/users/${result.id}`);
        }
      }
    }
    
    setIsOpen(false);
    setSearchTerm('');
    setResults([]);
  };

  const getResultTitle = (result) => {
    if (result.type === 'page_content') {
      return result.title;
    }
    

    if (result.cropName || result.type === 'crop_type') {
      return result.cropName || 'Crop Type';
    }
    

    if (result.warehouseName || result.type === 'warehouse') {
      return result.warehouseName || result.warehouseCode || 'Warehouse';
    }
    

    if (result.inventoryCode || result.type === 'inventory') {
      return result.cropType?.cropName || result.inventoryCode || 'Inventory';
    }
    return result.cropType?.cropName || 
           result.transactionCode || 
           result.warehouseName || 
           result.inventoryCode ||
           (result.firstName && result.lastName ? `${result.firstName} ${result.lastName}` : null) ||
           'Result';
  };

  const getResultDescription = (result) => {
    if (result.type === 'page_content') {
      return result.description;
    }
    

    if (result.cropName || result.type === 'crop_type') {
      return `${result.category || 'Crop'} - ${result.description || 'High quality crop from Rwanda'}`;
    }
    

    if (result.warehouseName || result.type === 'warehouse') {
      return `${result.warehouseType || 'Warehouse'} - ${result.address || ''}`;
    }
    

    if (result.inventoryCode || result.type === 'inventory') {
      return `${result.cropType?.cropName || 'Crop'} - ${result.remainingQuantityKg || 0} kg available`;
    }
    return result.cropType?.category || 
           result.status || 
           result.warehouseType ||
           result.userType ||
           '';
  };

  return (
    <div className="global-search" ref={searchRef}>
      <button
        className="global-search-trigger"
        onClick={() => setIsOpen(!isOpen)}
        title="Search"
      >
        <Search size={18} style={{ marginRight: scope === 'home' ? '6px' : '0' }} />
        {scope === 'home' && <span>Search</span>}
      </button>

      {isOpen && (
        <div className="global-search-dropdown">
          <div className="global-search-input-wrapper">
            <input
              type="text"
              className="global-search-input"
              placeholder={scope === 'dashboard' ? 'Search dashboard...' : 'Search everything...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            {searchTerm ? (
              <button
                className="global-search-clear"
                onClick={() => {
                  setSearchTerm('');
                  setResults([]);
                }}
              >
                <X size={16} />
              </button>
            ) : (
              <Search size={18} className="global-search-icon" />
            )}
          </div>

          {isSearching && (
            <div className="global-search-loading">
              <div className="loader-small"></div>
              <span>Searching...</span>
            </div>
          )}

          {!isSearching && results.length > 0 && (
            <div className="global-search-results" ref={resultsRef}>
              {results.map((result, index) => (
                <div
                  key={index}
                  className="global-search-result-item"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="global-search-result-content">
                    <div className="global-search-result-title">
                      {getResultTitle(result)}
                    </div>
                    <div className="global-search-result-description">
                      {getResultDescription(result)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isSearching && searchTerm && results.length === 0 && (
            <div className="global-search-no-results">
              No results found for "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;

