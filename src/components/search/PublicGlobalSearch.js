import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, X, ArrowRight, LogIn, FileText, Home, Info, Briefcase, MessageSquare, Phone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import './PublicGlobalSearch.css';

const PublicGlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  

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

  

  const pageMappings = {
    'home': { path: '/', label: 'Home', icon: Home },
    'about': { path: '/about', label: 'About Us', icon: Info },
    'about us': { path: '/about', label: 'About Us', icon: Info },
    'services': { path: '/services', label: 'Our Services', icon: Briefcase },
    'our services': { path: '/services', label: 'Our Services', icon: Briefcase },
    'contact': { path: '/contact', label: 'Contact', icon: Phone },
    'testimonials': { path: '/testimonials', label: 'Testimonials', icon: MessageSquare },
    'blog': { path: '/blog', label: 'Blog', icon: FileText },
  };

  

  const performSearch = async (term) => {
    if (!term || term.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const termLower = term.toLowerCase().trim();
      const allResults = [];

      

      Object.entries(pageMappings).forEach(([key, page]) => {
        if (key.includes(termLower) || termLower.includes(key)) {
          allResults.push({
            type: 'page_link',
            title: page.label,
            path: page.path,
            description: `Navigate to ${page.label} page`,
            icon: page.icon,
            priority: 1
          });
        }
      });

      

      const pageContent = document.body.innerText || '';
      const pageContentLower = pageContent.toLowerCase();
      if (pageContentLower.includes(termLower)) {
        

        const occurrences = findTextOccurrences(term, pageContent);
        if (occurrences.length > 0) {
          allResults.push({
            type: 'page_content',
            title: `Found "${term}" on this page`,
            description: `${occurrences.length} occurrence(s) found - Click to scroll to first match`,
            term: term,
            occurrences: occurrences,
            priority: 2
          });
        }
      }

      

      try {
        const warehouseResponse = await dataService.getWarehouses({ page: 0, size: 10 });
        const warehouses = warehouseResponse.data?.content || warehouseResponse.data || [];
        warehouses
          .filter(warehouse => 
            warehouse.warehouseName?.toLowerCase().includes(termLower) ||
            warehouse.warehouseCode?.toLowerCase().includes(termLower)
          )
          .forEach(warehouse => {
            allResults.push({
              type: 'warehouse',
              id: warehouse.id,
              title: warehouse.warehouseName,
              code: warehouse.warehouseCode,
              warehouseType: warehouse.warehouseType,
              location: warehouse.location?.name,
              priority: 3
            });
          });
      } catch (error) {
        console.error('Error searching warehouses:', error);
      }

      

      if (isAuthenticated) {
        try {
          const response = await dataService.publicSearch(term, 0, 10);
          const searchResults = response.data?.content || response.content || [];
          searchResults.forEach(result => {
            if (result.type === 'crop_type' || result.type === 'inventory') {
              allResults.push({
                ...result,
                priority: result.type === 'crop_type' ? 4 : 5
              });
            }
          });
        } catch (error) {
          console.error('Public search error:', error);
        }
      } else {
        

        if (termLower.length >= 2) {
          allResults.push({
            type: 'login_prompt',
            title: 'Login Required',
            description: 'Please login to search for crops and inventory',
            priority: 6
          });
        }
      }

      

      allResults.sort((a, b) => (a.priority || 99) - (b.priority || 99));
      setResults(allResults.slice(0, 15));
    } catch (error) {
      console.error('Public search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  

  const findTextOccurrences = (searchTerm, text) => {
    const occurrences = [];
    const regex = new RegExp(searchTerm, 'gi');
    let match;
    let count = 0;
    
    while ((match = regex.exec(text)) !== null && count < 10) {
      occurrences.push({
        index: match.index,
        text: match[0]
      });
      count++;
    }
    
    return occurrences;
  };

  

  const scrollToText = (term) => {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    let node;
    while (node = walker.nextNode()) {
      if (node.textContent.toLowerCase().includes(term.toLowerCase())) {
        const parent = node.parentElement;
        if (parent) {
          parent.scrollIntoView({ behavior: 'smooth', block: 'center' });
          

          try {
            const range = document.createRange();
            const text = node.textContent;
            const index = text.toLowerCase().indexOf(term.toLowerCase());
            if (index !== -1) {
              range.setStart(node, index);
              range.setEnd(node, index + term.length);
              const selection = window.getSelection();
              selection.removeAllRanges();
              selection.addRange(range);
              

              setTimeout(() => selection.removeAllRanges(), 2000);
            }
          } catch (e) {
            

          }
          break;
        }
      }
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
  }, [searchTerm]);

  const handleResultClick = (result) => {
    try {
      

      if (result.type === 'page_link') {
        navigate(result.path);
      } else if (result.type === 'page_content') {
        scrollToText(result.term);
      } else if (result.type === 'login_prompt') {
        navigate('/login');
      } else if (result.type === 'crop_type') {
        

        if (result.id) {
          navigate(`/crop-types?search=${encodeURIComponent(result.title || '')}`);
        } else {
          navigate('/crop-types');
        }
      } else if (result.type === 'warehouse') {
        

        if (result.id) {
          navigate(`/warehouses?search=${encodeURIComponent(result.title || result.warehouseName || '')}`);
        } else {
          navigate('/warehouses');
        }
      } else if (result.type === 'inventory') {
        

        if (result.id) {
          navigate(`/inventory?search=${encodeURIComponent(result.title || result.inventoryCode || '')}`);
        } else {
          navigate('/inventory');
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
    if (result.type === 'page_link') {
      return result.description;
    } else if (result.type === 'page_content') {
      return result.description;
    } else if (result.type === 'login_prompt') {
      return result.description;
    } else if (result.type === 'crop_type') {
      return `${result.category || 'Crop'} - ${result.description || 'High quality crop from Rwanda'}`;
    } else if (result.type === 'warehouse') {
      return `${result.warehouseType || 'Warehouse'} - ${result.location || ''}`;
    } else if (result.type === 'inventory') {
      return `${result.quantity || 0} kg available - ${result.qualityGrade || ''}`;
    }
    return '';
  };

  const getResultIcon = (result) => {
    if (result.type === 'page_link' && result.icon) {
      const Icon = result.icon;
      return <Icon size={18} />;
    } else if (result.type === 'page_content') {
      return <FileText size={18} />;
    } else if (result.type === 'login_prompt') {
      return <LogIn size={18} />;
    }
    
    switch (result.type) {
      case 'crop_type':
        return '🌾';
      case 'warehouse':
        return '🏢';
      case 'inventory':
        return '📦';
      default:
        return '🔍';
    }
  };

  return (
    <div className="public-global-search" ref={searchRef}>
      <button
        className="public-search-trigger"
        onClick={() => setIsOpen(!isOpen)}
        title="Search Site"
      >
        <Search size={18} style={{ marginRight: '6px' }} />
        <span>Search Site</span>
      </button>

      {isOpen && (
        <div className="public-search-dropdown">
          <div className="public-search-input-wrapper">
            <input
              type="text"
              className="public-search-input"
              placeholder="Search pages, keywords, warehouses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            {searchTerm ? (
              <button
                className="public-search-clear"
                onClick={() => {
                  setSearchTerm('');
                  setResults([]);
                }}
              >
                <X size={16} />
              </button>
            ) : (
              <Search size={18} className="public-search-icon" />
            )}
          </div>

          {isSearching && (
            <div className="public-search-loading">
              <div className="loader-small"></div>
              <span>Searching...</span>
            </div>
          )}

          {!isSearching && results.length > 0 && (
            <div className="public-search-results">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`public-search-result-item ${result.type === 'login_prompt' ? 'login-prompt-item' : ''}`}
                  onClick={() => handleResultClick(result)}
                >
                  <div className="public-search-result-icon">
                    {getResultIcon(result)}
                  </div>
                  <div className="public-search-result-content">
                    <div className="public-search-result-title">
                      {getResultTitle(result)}
                    </div>
                    <div className="public-search-result-description">
                      {getResultDescription(result)}
                    </div>
                  </div>
                  <ArrowRight size={16} className="public-search-result-arrow" />
                </div>
              ))}
            </div>
          )}

          {!isSearching && searchTerm && results.length === 0 && (
            <div className="public-search-no-results">
              <p>No results found for "{searchTerm}"</p>
              <p className="public-search-hint">Try searching for page names (about, services, contact), keywords on this page, or warehouse names</p>
              {!isAuthenticated && (
                <p className="public-search-hint" style={{ marginTop: '8px', color: '#116530', fontWeight: '500' }}>
                  Login to search for crops and inventory
                </p>
              )}
            </div>
          )}

          {!isSearching && !searchTerm && (
            <div className="public-search-empty-state">
              <Search size={32} className="public-search-empty-icon" />
              <p>Start typing to search...</p>
              <p className="public-search-hint">Search for page names, keywords, or warehouses</p>
              {!isAuthenticated && (
                <p className="public-search-hint" style={{ marginTop: '8px', color: '#116530', fontWeight: '500' }}>
                  Login to search for crops and inventory
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PublicGlobalSearch;

