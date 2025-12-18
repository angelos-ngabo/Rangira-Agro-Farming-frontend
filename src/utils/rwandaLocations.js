import { Provinces, Districts, Sectors, Cells, Villages } from 'rwanda';

export const getProvinces = () => {
  try {
    const provinces = Provinces();
    return provinces.map((province, index) => ({
      id: `province-${index}`,
      name: province,
      code: province.toUpperCase().replace(/\s+/g, '-')
    }));
  } catch (error) {
    console.error('Error getting provinces:', error);
    return [];
  }
};

export const getDistricts = (provinceName) => {
  try {
    if (!provinceName) return [];
    const districts = Districts({ province: provinceName });
    if (!districts) return [];
    return districts.map((district, index) => ({
      id: `district-${provinceName}-${index}`,
      name: district,
      code: district.toUpperCase().replace(/\s+/g, '-')
    }));
  } catch (error) {
    console.error('Error getting districts:', error);
    return [];
  }
};

export const getSectors = (provinceName, districtName) => {
  try {
    if (!provinceName || !districtName) return [];
    const sectors = Sectors({ province: provinceName, district: districtName });
    if (!sectors) return [];
    return sectors.map((sector, index) => ({
      id: `sector-${provinceName}-${districtName}-${index}`,
      name: sector,
      code: sector.toUpperCase().replace(/\s+/g, '-')
    }));
  } catch (error) {
    console.error('Error getting sectors:', error);
    return [];
  }
};

export const getCells = (provinceName, districtName, sectorName) => {
  try {
    if (!provinceName || !districtName || !sectorName) return [];
    const cells = Cells({ province: provinceName, district: districtName, sector: sectorName });
    if (!cells) return [];
    return cells.map((cell, index) => ({
      id: `cell-${provinceName}-${districtName}-${sectorName}-${index}`,
      name: cell,
      code: cell.toUpperCase().replace(/\s+/g, '-')
    }));
  } catch (error) {
    console.error('Error getting cells:', error);
    return [];
  }
};

export const getVillages = (provinceName, districtName, sectorName, cellName) => {
  try {
    if (!provinceName || !districtName || !sectorName || !cellName) return [];
    const villages = Villages({ province: provinceName, district: districtName, sector: sectorName, cell: cellName });
    if (!villages) return [];
    return villages.map((village, index) => ({
      id: `village-${provinceName}-${districtName}-${sectorName}-${cellName}-${index}`,
      name: village,
      code: village.toUpperCase().replace(/\s+/g, '-')
    }));
  } catch (error) {
    console.error('Error getting villages:', error);
    return [];
  }
};

export const getAllLocations = () => {
  try {
    const provinces = getProvinces();
    const allLocations = [];
    
    provinces.forEach(province => {
      allLocations.push(province);
      const districts = getDistricts(province.name);
      
      districts.forEach(district => {
        allLocations.push({ ...district, parent: province.name });
        const sectors = getSectors(province.name, district.name);
        
        sectors.forEach(sector => {
          allLocations.push({ ...sector, parent: district.name });
          const cells = getCells(province.name, district.name, sector.name);
          
          cells.forEach(cell => {
            allLocations.push({ ...cell, parent: sector.name });
            const villages = getVillages(province.name, district.name, sector.name, cell.name);
            
            villages.forEach(village => {
              allLocations.push({ ...village, parent: cell.name });
            });
          });
        });
      });
    });
    
    return allLocations;
  } catch (error) {
    console.error('Error getting all locations:', error);
    return [];
  }
};

const mapProvinceName = (rwandaName) => {
  const mapping = {
    'East': 'Eastern Province',
    'Kigali': 'Kigali',
    'North': 'Northern Province',
    'South': 'Southern Province',
    'West': 'Western Province'
  };
  return mapping[rwandaName] || rwandaName;
};

export const mapProvinceNameForRwanda = (backendName) => {
  const mapping = {
    'Eastern Province': 'East',
    'Kigali': 'Kigali',
    'Northern Province': 'North',
    'Southern Province': 'South',
    'Western Province': 'West'
  };
  return mapping[backendName] || backendName;
};

export const normalizeBackendLocationName = (name) => {
  if (!name) return '';
  return name.replace(/\s+(District|Sector|Cell|Village)\s*$/i, '').trim();
};

export const normalizeLocationName = (name) => {
  return name.toLowerCase().trim();
};

export const matchesLocationName = (backendName, rwandaName) => {
  if (!backendName || !rwandaName) return false;
  
  const normalizedBackend = normalizeLocationName(backendName);
  const normalizedRwanda = normalizeLocationName(rwandaName);
  
  const backendBase = normalizedBackend
    .replace(/\s+(district|sector|cell|village)\s+\d*$/i, '')
    .replace(/\s+(district|sector|cell|village)\s*$/i, '')
    .trim();
  const rwandaBase = normalizedRwanda
    .replace(/\s+(district|sector|cell|village)\s+\d*$/i, '')
    .replace(/\s+(district|sector|cell|village)\s*$/i, '')
    .trim();
  
  if (normalizedBackend === normalizedRwanda) return true;
  if (normalizedBackend.includes(normalizedRwanda)) return true;
  if (normalizedRwanda.includes(normalizedBackend)) return true;
  if (backendBase === rwandaBase) return true;
  if (backendBase.includes(rwandaBase)) return true;
  if (rwandaBase.includes(backendBase)) return true;
  
  const backendWithoutSuffix = normalizedBackend
    .replace(/\s+cell\s*/i, '')
    .replace(/\s+village\s+\d+$/i, '')
    .replace(/\s+village\s*$/i, '')
    .replace(/\s+sector\s*/i, '')
    .replace(/\s+district\s*/i, '')
    .trim();
  
  if (backendWithoutSuffix === normalizedRwanda) return true;
  if (normalizedRwanda === backendWithoutSuffix) return true;
  
  return false;
};

export const findLocationIdByName = async (dataService, provinceName, districtName, sectorName, cellName, villageName) => {
  try {
    const mappedProvinceName = mapProvinceName(provinceName);
    const provinces = await dataService.getProvinces();
    const province = provinces.data?.find(p => 
      normalizeLocationName(p.name) === normalizeLocationName(mappedProvinceName) ||
      matchesLocationName(p.name, mappedProvinceName)
    );
    
    if (!province) {
      throw new Error(`Province "${mappedProvinceName}" not found`);
    }
    
    const districts = await dataService.getChildLocations(province.id);
    const district = districts.data?.find(d => matchesLocationName(d.name, districtName));
    
    if (!district) {
      throw new Error(`District "${districtName}" not found in province "${mappedProvinceName}"`);
    }
    
    const sectors = await dataService.getChildLocations(district.id);
    let sector = sectors.data?.find(s => matchesLocationName(s.name, sectorName));
    
    if (!sector) {
      const normalizedSectorName = normalizeLocationName(sectorName);
      sector = sectors.data?.find(s => {
        const normalized = normalizeLocationName(s.name);
        return normalized.includes(normalizedSectorName) || 
               normalizedSectorName.includes(normalized.replace(/\s+sector\s*/i, ''));
      });
    }
    
    if (!sector) {
      console.error(`Sector "${sectorName}" not found in district "${districtName}". Available sectors:`, sectors.data?.map(s => s.name));
      throw new Error(`Sector "${sectorName}" not found in district "${districtName}"`);
    }
    
    const cells = await dataService.getChildLocations(sector.id);
    let cell = cells.data?.find(c => matchesLocationName(c.name, cellName));
    
    if (!cell && cells.data && cells.data.length > 0) {
      cell = cells.data.find(c => {
        const cellBaseName = normalizeLocationName(c.name)
          .replace(/\s+cell\s*/i, '')
          .replace(/\s+\d+$/i, '')
          .trim();
        const rwandaBaseName = normalizeLocationName(cellName);
        const matches = cellBaseName === rwandaBaseName || 
                       cellBaseName.includes(rwandaBaseName) || 
                       rwandaBaseName.includes(cellBaseName);
        if (matches) {
          console.log(`Matched cell: "${c.name}" with "${cellName}"`);
        }
        return matches;
      });
    }
    
    if (!cell) {
      if (cells.data && cells.data.length > 0) {
        console.warn(`Cell "${cellName}" not found in sector "${sectorName}". Available cells:`, cells.data.map(c => c.name));
        cell = cells.data[0];
        console.warn(`Using first available cell: "${cell.name}"`);
      } else {
        throw new Error(`No cells found in sector "${sectorName}". Please ensure locations are seeded.`);
      }
    }
    
    const villages = await dataService.getChildLocations(cell.id);
    let village = villages.data?.find(v => matchesLocationName(v.name, villageName));
    
    if (!village && villages.data && villages.data.length > 0) {
      village = villages.data.find(v => {
        const villageBaseName = normalizeLocationName(v.name)
          .replace(/\s+village\s+\d+$/i, '')
          .replace(/\s+village\s*$/i, '')
          .trim();
        const rwandaBaseName = normalizeLocationName(villageName);
        const matches = villageBaseName === rwandaBaseName || 
                       villageBaseName.includes(rwandaBaseName) || 
                       rwandaBaseName.includes(villageBaseName);
        if (matches) {
          console.log(`Matched village: "${v.name}" with "${villageName}"`);
        }
        return matches;
      });
    }
    
    if (!village) {
      if (villages.data && villages.data.length > 0) {
        console.warn(`Village "${villageName}" not found in cell "${cell.name}". Available villages:`, villages.data.map(v => v.name));
        village = villages.data[0];
        console.warn(`Using first available village: "${village.name}"`);
      } else {
        throw new Error(`No villages found in cell "${cell.name}". Please ensure locations are seeded.`);
      }
    }
    
    return village.id;
  } catch (error) {
    console.error('Error finding location ID:', error);
    throw error;
  }
};

