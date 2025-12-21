import React, { useEffect, useState, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

const RWANDA_LOCATIONS = {
  'Kigali': { lat: -1.9441, lng: 30.0619 },
  'Gasabo': { lat: -1.9441, lng: 30.0619 },
  'Nyarugenge': { lat: -1.9486, lng: 30.0597 },
  'Kicukiro': { lat: -1.9667, lng: 30.1167 },
  'Huye': { lat: -2.4833, lng: 29.7500 },
  'Butare': { lat: -2.4833, lng: 29.7500 },
  'Musanze': { lat: -1.5000, lng: 29.6333 },
  'Ruhengeri': { lat: -1.5000, lng: 29.6333 },
  'Rubavu': { lat: -1.6833, lng: 29.2333 },
  'Gisenyi': { lat: -1.6833, lng: 29.2333 },
  'Nyagatare': { lat: -1.3000, lng: 30.3167 },
  'Rwamagana': { lat: -1.9486, lng: 30.4333 },
  'Kayonza': { lat: -1.9167, lng: 30.6167 },
  'Gicumbi': { lat: -1.5833, lng: 30.0833 },
  'Rulindo': { lat: -1.7333, lng: 29.9167 },
  'Burera': { lat: -1.5833, lng: 29.7500 },
  'Gakenke': { lat: -1.6833, lng: 29.7500 },
  'Muhanga': { lat: -2.0833, lng: 29.7500 },
  'Kamonyi': { lat: -2.0167, lng: 29.8333 },
  'Ruhango': { lat: -2.3000, lng: 29.7500 },
  'Nyanza': { lat: -2.3500, lng: 29.7500 },
  'Gisagara': { lat: -2.4833, lng: 29.7500 },
  'Nyaruguru': { lat: -2.6167, lng: 29.5833 },
  'Nyamagabe': { lat: -2.4833, lng: 29.5833 },
  'Karongi': { lat: -2.0833, lng: 29.3333 },
  'Rutsiro': { lat: -2.0833, lng: 29.3333 },
  'Nyabihu': { lat: -1.5833, lng: 29.5000 },
  'Ngororero': { lat: -1.8333, lng: 29.5833 },
  'Rusizi': { lat: -2.4833, lng: 28.9167 },
  'Nyamasheke': { lat: -2.4167, lng: 28.7500 },
  'Bugesera': { lat: -2.1667, lng: 30.1667 },
  'Gatsibo': { lat: -1.8333, lng: 30.4167 },
  'Ngoma': { lat: -2.1667, lng: 30.5833 },
  'Kirehe': { lat: -2.1667, lng: 30.8333 }
};

const TEST_WAREHOUSE_COORDINATES = [
  { lat: -1.9441, lng: 30.0619 },
  { lat: -1.9486, lng: 30.0597 },
  { lat: -1.9667, lng: 30.1167 },
  { lat: -2.4833, lng: 29.7500 },
  { lat: -1.5000, lng: 29.6333 },
  { lat: -1.6833, lng: 29.2333 },
  { lat: -1.3000, lng: 30.3167 },
  { lat: -1.9486, lng: 30.4333 },
  { lat: -1.9167, lng: 30.6167 },
  { lat: -1.5833, lng: 30.0833 },
  { lat: -1.7333, lng: 29.9167 },
  { lat: -2.0833, lng: 29.7500 },
  { lat: -2.0167, lng: 29.8333 },
  { lat: -2.3000, lng: 29.7500 },
  { lat: -2.3500, lng: 29.7500 },
  { lat: -2.4833, lng: 29.7500 },
  { lat: -2.6167, lng: 29.5833 },
  { lat: -2.4833, lng: 29.5833 },
  { lat: -2.0833, lng: 29.3333 },
  { lat: -1.5833, lng: 29.5000 },
  { lat: -1.8333, lng: 29.5833 },
  { lat: -2.4833, lng: 28.9167 },
  { lat: -2.4167, lng: 28.7500 },
  { lat: -2.1667, lng: 30.1667 },
  { lat: -1.8333, lng: 30.4167 },
  { lat: -2.1667, lng: 30.5833 },
  { lat: -2.1667, lng: 30.8333 }
];

const WarehouseMap = ({ warehouses }) => {
  const [geocodedWarehouses, setGeocodedWarehouses] = useState([]);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  const buildAddress = (location) => {
    if (!location) return 'Rwanda';
    let address = location.name;
    let current = location.parent;
    while (current) {
      address = current.name + ', ' + address;
      current = current.parent;
    }
    return address + ', Rwanda';
  };

  useEffect(() => {
    if (!warehouses || warehouses.length === 0) return;

    const geocodeWarehouses = async () => {
      const usedCoords = new Map();

      const geocoded = await Promise.all(
        warehouses.map(async (warehouse, index) => {
          if (!warehouse.location) {
            const testCoord = TEST_WAREHOUSE_COORDINATES[index % TEST_WAREHOUSE_COORDINATES.length];
            const offset = Math.floor(index / TEST_WAREHOUSE_COORDINATES.length) * 0.01;
            return {
              ...warehouse,
              lat: testCoord.lat + offset,
              lng: testCoord.lng + offset,
              address: 'Rwanda'
            };
          }

          const address = buildAddress(warehouse.location);

          const locationName = warehouse.location.name;
          let baseCoords = RWANDA_LOCATIONS[locationName] ||
            RWANDA_LOCATIONS[address.split(',')[0].trim()];


          if (!baseCoords) {
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
                {
                  headers: {
                    'User-Agent': 'RangiraAgroFarming/1.0'
                  }
                }
              );
              const data = await response.json();
              if (data && data.length > 0) {
                baseCoords = {
                  lat: parseFloat(data[0].lat),
                  lng: parseFloat(data[0].lon)
                };
              } else {
                // Default to Kigali with offset if geocoding fails
                baseCoords = { lat: -1.9441, lng: 30.0619 };
              }
            } catch (error) {
              console.error('Geocoding error:', error);
              baseCoords = { lat: -1.9441, lng: 30.0619 };
            }
          }

          // Add unique offset to prevent overlapping markers
          // Use warehouse ID or index to create consistent but unique offsets
          const warehouseId = warehouse.id || index;
          const offsetLat = (warehouseId % 10) * 0.005; // 0.005 degrees ≈ 550m
          const offsetLng = (Math.floor(warehouseId / 10) % 10) * 0.005;

          let finalCoords = {
            lat: baseCoords.lat + offsetLat,
            lng: baseCoords.lng + offsetLng
          };

          // Ensure coordinates are unique (avoid exact duplicates)
          const coordKey = `${finalCoords.lat.toFixed(4)},${finalCoords.lng.toFixed(4)}`;
          let attempts = 0;
          while (usedCoords.has(coordKey) && attempts < 20) {
            // Add more offset if duplicate found
            finalCoords = {
              lat: baseCoords.lat + offsetLat + (attempts * 0.002),
              lng: baseCoords.lng + offsetLng + (attempts * 0.002)
            };
            const newKey = `${finalCoords.lat.toFixed(4)},${finalCoords.lng.toFixed(4)}`;
            if (!usedCoords.has(newKey)) {
              usedCoords.set(newKey, true);
              break;
            }
            attempts++;
          }

          if (!usedCoords.has(coordKey)) {
            usedCoords.set(coordKey, true);
          }

          return {
            ...warehouse,
            lat: finalCoords.lat,
            lng: finalCoords.lng,
            address: address
          };
        })
      );

      console.log(`Geocoded ${geocoded.length} warehouses with unique coordinates:`,
        geocoded.map(w => `${w.warehouseName}: [${w.lat.toFixed(4)}, ${w.lng.toFixed(4)}]`));

      setGeocodedWarehouses(geocoded);
    };

    geocodeWarehouses();
  }, [warehouses]);

  // Build OpenStreetMap URL with markers
  useEffect(() => {
    if (geocodedWarehouses.length === 0 || !mapContainerRef.current) return;

    let mapInstance = null;
    let isMounted = true;

    const initializeMap = () => {
      try {
        if (!isMounted || !window.L || !mapContainerRef.current) {
          return;
        }

        // Calculate center point (average of all coordinates)
        const avgLat = geocodedWarehouses.reduce((sum, w) => sum + w.lat, 0) / geocodedWarehouses.length;
        const avgLng = geocodedWarehouses.reduce((sum, w) => sum + w.lng, 0) / geocodedWarehouses.length;

        // Clear existing map if any
        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.remove();
          } catch (e) {
            // Ignore if already removed
          }
        }
        if (mapContainerRef.current._leaflet_id) {
          try {
            const existingMap = window.L.map.getMap(mapContainerRef.current);
            if (existingMap) {
              existingMap.remove();
            }
          } catch (e) {
            // Ignore
          }
        }
        if (mapContainerRef.current) {
          mapContainerRef.current.innerHTML = '';
        }

        // Create map
        mapInstance = window.L.map(mapContainerRef.current, {
          zoomControl: true,
          attributionControl: true
        }).setView([avgLat, avgLng], 8);

        // Store map instance
        mapInstanceRef.current = mapInstance;

        // Add OpenStreetMap tiles
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(mapInstance);

        // Smart marker management: keep existing, remove old, add new
        const currentWarehouseIds = new Set(geocodedWarehouses.map(w => w.id));

        // Remove markers for warehouses that no longer exist
        markersRef.current = markersRef.current.filter(markerData => {
          if (!currentWarehouseIds.has(markerData.warehouse.id)) {
            // Remove marker from map if warehouse no longer exists
            try {
              mapInstance.removeLayer(markerData.marker);
            } catch (e) {
              // Ignore if already removed
            }
            return false;
          }
          return true;
        });

        // Track which warehouses already have markers to avoid duplicates
        const existingWarehouseIds = new Set(markersRef.current.map(m => m.warehouse.id));

        // Add markers for each warehouse - create a pin for EACH warehouse
        console.log(`📍 Processing ${geocodedWarehouses.length} warehouses (one pin per warehouse)`);
        console.log(`   Existing markers: ${markersRef.current.length}`);

        let newMarkersCount = 0;
        geocodedWarehouses.forEach((warehouse, index) => {
          // Skip if marker already exists for this warehouse
          if (existingWarehouseIds.has(warehouse.id)) {
            return; // Marker already exists, skip
          }

          newMarkersCount++;

          try {
            // Create unique marker at unique coordinates - ONE PIN PER WAREHOUSE
            const marker = window.L.marker([warehouse.lat, warehouse.lng], {
              title: warehouse.warehouseName,
              alt: warehouse.warehouseName,
              warehouseId: warehouse.id // Store warehouse ID for reference
            })
              .addTo(mapInstance)
              .bindPopup(`
                <div style="min-width: 200px;">
                  <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">${warehouse.warehouseName}</h3>
                  <p style="margin: 4px 0; font-size: 12px; color: #666;">Code: ${warehouse.warehouseCode}</p>
                  <p style="margin: 4px 0; font-size: 12px; color: #666;">${warehouse.address}</p>
                  <p style="margin: 4px 0; font-size: 12px; color: #666;">Type: ${warehouse.warehouseType}</p>
                  <p style="margin: 4px 0; font-size: 12px; color: #666;">Capacity: ${warehouse.totalCapacityKg} kg</p>
                </div>
              `);

            // Add custom icon with warehouse color - use different colors for variety
            try {
              const colors = ['green', 'blue', 'red', 'orange', 'yellow', 'violet', 'grey'];
              const colorIndex = index % colors.length;
              marker.setIcon(
                window.L.icon({
                  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${colors[colorIndex]}.png`,
                  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41]
                })
              );
            } catch (e) {
              // Use default icon if custom fails
              console.warn('Could not set custom icon for warehouse:', warehouse.warehouseName, e);
            }

            // Store marker with warehouse reference
            markersRef.current.push({
              marker: marker,
              warehouse: warehouse
            });

            console.log(`✅ NEW PIN created for "${warehouse.warehouseName}" at [${warehouse.lat.toFixed(6)}, ${warehouse.lng.toFixed(6)}]`);
          } catch (e) {
            console.error(`❌ Error creating pin for warehouse ${warehouse.warehouseName}:`, e);
          }
        });

        console.log(`🎯 Map Status: ${newMarkersCount} new pins added, ${markersRef.current.length} total pins for ${geocodedWarehouses.length} warehouses`);

        // Verify all warehouses have pins
        if (markersRef.current.length !== geocodedWarehouses.length) {
          console.warn(`⚠️ Warning: Only ${markersRef.current.length} pins on map, expected ${geocodedWarehouses.length}`);
          const missingWarehouses = geocodedWarehouses.filter(w =>
            !markersRef.current.some(m => m.warehouse.id === w.id)
          );
          if (missingWarehouses.length > 0) {
            console.warn('Missing pins for:', missingWarehouses.map(w => w.warehouseName));
          }
        } else {
          console.log(`✅ SUCCESS: All ${geocodedWarehouses.length} warehouses have pins on the map!`);
        }

        // Fit map to show all markers
        if (markersRef.current.length > 0) {
          const group = window.L.featureGroup(markersRef.current.map(m => m.marker));
          mapInstance.fitBounds(group.getBounds().pad(0.1));
        }
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        // Wait a bit for Leaflet to fully initialize
        setTimeout(initializeMap, 100);
      };
      script.onerror = (error) => {
        console.error('Failed to load Leaflet:', error);
      };
      document.body.appendChild(script);
    } else {
      // Leaflet already loaded
      setTimeout(initializeMap, 100);
    }

    // Cleanup function
    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      markersRef.current = [];
    };
  }, [geocodedWarehouses]);

  if (!warehouses || warehouses.length === 0) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5'
      }}>
        <p style={{ color: '#666' }}>No warehouses to display</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', minHeight: '600px' }}>
      <div
        ref={mapContainerRef}
        style={{ width: '100%', height: '100%', minHeight: '600px' }}
      />
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'white',
        padding: '12px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        maxWidth: '300px',
        maxHeight: 'calc(100vh - 100px)',
        overflowY: 'auto',
        zIndex: 1000
      }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>Warehouses ({geocodedWarehouses.length})</h4>
        {geocodedWarehouses.map((warehouse) => {
          return (
            <div key={warehouse.id} style={{
              marginBottom: '8px',
              padding: '8px',
              borderBottom: '1px solid #e0e0e0',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              borderRadius: '4px'
            }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (mapInstanceRef.current && markersRef.current.length > 0) {
                  try {
                    // Find the marker for this warehouse
                    const markerData = markersRef.current.find(m => m.warehouse.id === warehouse.id);
                    if (markerData && mapInstanceRef.current) {
                      // Zoom to the marker location (not Google Maps)
                      mapInstanceRef.current.setView([warehouse.lat, warehouse.lng], 15, {
                        animate: true,
                        duration: 0.5
                      });
                      // Open the popup for this marker
                      setTimeout(() => {
                        markerData.marker.openPopup();
                      }, 600);
                    }
                  } catch (e) {
                    console.error('Error zooming to warehouse:', e);
                  }
                }
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: '#1f2937' }}>
                {warehouse.warehouseName}
              </div>
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
                {warehouse.address}
              </div>
              <div style={{ fontSize: '10px', color: '#116530', marginTop: '4px', fontWeight: '500' }}>
                Click to locate on map →
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WarehouseMap;

