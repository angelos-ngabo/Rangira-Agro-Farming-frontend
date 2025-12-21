import React from 'react';
import { Warehouse } from 'lucide-react';
import './WarehouseCapacityCard.css';

const WarehouseCapacityCard = ({ warehouses }) => {
  if (!warehouses || warehouses.length === 0) {
    return (
      <div className="warehouse-capacity-card">
        <div className="capacity-header">
          <Warehouse size={20} />
          <h3>Warehouse Capacity</h3>
        </div>
        <p className="no-data">No warehouses available</p>
      </div>
    );
  }

  return (
    <div className="warehouse-capacity-card">
      <div className="capacity-header">
        <Warehouse size={20} />
        <h3>Warehouse Capacity</h3>
      </div>
      <div className="capacity-list">
        {warehouses.slice(0, 5).map((warehouse) => {
          const used = parseFloat(warehouse.totalCapacityKg || 0) - parseFloat(warehouse.availableCapacityKg || 0);
          const total = parseFloat(warehouse.totalCapacityKg || 0);
          const percentage = total > 0 ? (used / total) * 100 : 0;
          const available = parseFloat(warehouse.availableCapacityKg || 0);

          return (
            <div key={warehouse.id} className="capacity-item">
              <div className="capacity-info">
                <span className="warehouse-name">{warehouse.warehouseName}</span>
                <span className="capacity-stats">
                  {used.toLocaleString()} / {total.toLocaleString()} KG
                </span>
              </div>
              <div className="capacity-progress">
                <div 
                  className="capacity-progress-bar"
                  style={{ 
                    width: `${Math.min(percentage, 100)}%`,
                    backgroundColor: percentage > 80 ? '#ef4444' : percentage > 60 ? '#f59e0b' : '#2ea359'
                  }}
                />
              </div>
              <div className="capacity-footer">
                <span className="available-text">
                  {available.toLocaleString()} KG available
                </span>
                <span className="percentage-text">
                  {percentage.toFixed(1)}% used
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WarehouseCapacityCard;

