import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import './DataTable.css';

const DataTable = ({
  data = [],
  columns = [],
  onRowClick,
  searchable = true,
  columnSearchable = true, // Enable column-specific search
  pagination = true,
  pageSize = 10,
  loading = false,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [columnFilters, setColumnFilters] = useState({}); // Column-specific filters
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Filter data based on search query and column filters
  const filteredData = useMemo(() => {
    let filtered = data;

    // Apply global search
    if (searchQuery) {
      filtered = filtered.filter((row) =>
        columns.some((col) => {
          const value = col.accessor ? row[col.accessor] : col.render?.(row);
          return String(value || '').toLowerCase().includes(searchQuery.toLowerCase());
        })
      );
    }

    // Apply column-specific filters
    if (columnSearchable && Object.keys(columnFilters).length > 0) {
      filtered = filtered.filter((row) => {
        return Object.entries(columnFilters).every(([columnKey, filterValue]) => {
          if (!filterValue) return true;
          const column = columns.find(col => col.accessor === columnKey);
          if (!column) return true;
          const value = column.accessor ? row[column.accessor] : column.render?.(row);
          return String(value || '').toLowerCase().includes(filterValue.toLowerCase());
        });
      });
    }

    return filtered;
  }, [data, searchQuery, columnFilters, columns, columnSearchable]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === bValue) return 0;

      const comparison = aValue > bValue ? 1 : -1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;

    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize, pagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  if (loading) {
    return (
      <div className="table-loading">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="data-table-container">
      {(searchable || columnSearchable) && (
        <div className="table-search-container">
          {searchable && (
            <div className="table-search">
              <Search size={20} />
              <input
                type="text"
                placeholder="Search all columns..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="table-search-input"
              />
            </div>
          )}
          {columnSearchable && (
            <div className="column-filters">
              {columns.filter(col => col.searchable !== false && col.accessor).map((col) => (
                <input
                  key={col.accessor}
                  type="text"
                  placeholder={`Filter ${col.header}...`}
                  value={columnFilters[col.accessor] || ''}
                  onChange={(e) => {
                    setColumnFilters(prev => ({
                      ...prev,
                      [col.accessor]: e.target.value
                    }));
                    setCurrentPage(1);
                  }}
                  className="column-filter-input"
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.accessor || col.header}
                  onClick={() => col.sortable !== false && handleSort(col.accessor)}
                  className={col.sortable !== false ? 'sortable' : ''}
                >
                  <div className="th-content">
                    {col.header}
                    {sortConfig.key === col.accessor && (
                      <span className="sort-indicator">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="no-data">
                  No data available
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => (
                <tr
                  key={row.id || index}
                  onClick={() => onRowClick?.(row)}
                  className={onRowClick ? 'clickable' : ''}
                >
                  {columns.map((col) => (
                    <td key={col.accessor || col.header}>
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && totalPages > 1 && (
        <div className="table-pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-button"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages} ({sortedData.length} items)
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-button"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default DataTable;




