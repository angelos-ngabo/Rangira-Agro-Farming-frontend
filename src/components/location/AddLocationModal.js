import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { dataService } from '../../services/dataService';
import toast from 'react-hot-toast';
import './AddLocationModal.css';

const AddLocationModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    targetType: 'Province',
    targetName: '',
    targetCode: '',
    provinceId: '',
    provinceName: '',
    provinceCode: '',
    districtId: '',
    districtName: '',
    districtCode: '',
    sectorId: '',
    sectorName: '',
    sectorCode: '',
    cellId: '',
    cellName: '',
    cellCode: '',
  });

  const [loading, setLoading] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [cells, setCells] = useState([]);
  const [expandedSections, setExpandedSections] = useState({
    province: true,
    district: true,
    sector: true,
    cell: true
  });

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  

  useEffect(() => {
    if (isOpen && formData.targetType !== 'Province' && provinces.length === 0 && !loading) {
      fetchProvinces();
    }
  }, [isOpen, formData.targetType]);

  const resetForm = () => {
    setFormData({
      targetType: 'Province',
      targetName: '',
      targetCode: '',
      provinceId: '',
      provinceName: '',
      provinceCode: '',
      districtId: '',
      districtName: '',
      districtCode: '',
      sectorId: '',
      sectorName: '',
      sectorCode: '',
      cellId: '',
      cellName: '',
      cellCode: '',
    });
    setDistricts([]);
    setSectors([]);
    setCells([]);
  };

  const fetchProvinces = async () => {
    try {
      

      const response = await dataService.getLocationsByType('Province');
      setProvinces(response.data || []);
      console.log(`Fetched ${response.data?.length || 0} provinces`);
    } catch (error) {
      console.error('Error fetching provinces:', error);
      toast.error('Failed to load provinces');
    }
  };

  const fetchChildren = async (parentId, setChildren, parentType = '') => {
    if (!parentId) {
      setChildren([]);
      return;
    }
    try {
      

      const response = await dataService.getChildLocations(parentId);
      const children = response.data || [];
      setChildren(children);
      console.log(`Fetched ${children.length} ${parentType} for parent ${parentId}`);
    } catch (error) {
      console.error(`Error fetching ${parentType}:`, error);
      setChildren([]);
    }
  };

  const handleTargetTypeChange = (e) => {
    const newType = e.target.value;
    setFormData(prev => ({
      ...prev,
      targetType: newType,
      targetName: '',
      targetCode: '',
      

      provinceId: '',
      provinceName: '',
      provinceCode: '',
      districtId: '',
      districtName: '',
      districtCode: '',
      sectorId: '',
      sectorName: '',
      sectorCode: '',
      cellId: '',
      cellName: '',
      cellCode: '',
    }));
    setDistricts([]);
    setSectors([]);
    setCells([]);
  };

  const handleProvinceSelect = async (e) => {
    const provinceId = e.target.value;
    setFormData(prev => ({ ...prev, provinceId, provinceName: '', provinceCode: '' }));
    if (provinceId) {
      

      await fetchChildren(provinceId, setDistricts, 'districts');
    } else {
      setDistricts([]);
    }
    setSectors([]);
    setCells([]);
    

    setFormData(prev => ({ ...prev, districtId: '', districtName: '', districtCode: '' }));
  };

  const handleDistrictSelect = async (e) => {
    const districtId = e.target.value;
    setFormData(prev => ({ ...prev, districtId, districtName: '', districtCode: '' }));
    if (districtId) {
      

      await fetchChildren(districtId, setSectors, 'sectors');
    } else {
      setSectors([]);
    }
    setCells([]);
    

    setFormData(prev => ({ ...prev, sectorId: '', sectorName: '', sectorCode: '' }));
  };

  const handleSectorSelect = async (e) => {
    const sectorId = e.target.value;
    setFormData(prev => ({ ...prev, sectorId, sectorName: '', sectorCode: '' }));
    if (sectorId) {
      

      await fetchChildren(sectorId, setCells, 'cells');
    } else {
      setCells([]);
    }
    

    setFormData(prev => ({ ...prev, cellId: '', cellName: '', cellCode: '' }));
  };

  const generateCode = (name, type, parentCode = '') => {
    const prefixes = {
      'Province': 'PRV',
      'District': 'DST',
      'Sector': 'SCTR',
      'Cell': 'CELL',
      'Village': 'VLG'
    };
    const prefix = prefixes[type] || 'LOC';
    const namePart = name.toUpperCase().replace(/\s+/g, '-').substring(0, 10).replace(/[^A-Z0-9-]/g, '');
    const parentPart = parentCode ? `-${parentCode.substring(0, 8)}` : '';
    return `${prefix}-${namePart}${parentPart}`.substring(0, 50);
  };

  const autoGenerateCode = (name, type, parentCode) => {
    if (!name) return '';
    return generateCode(name, type, parentCode);
  };

  const createLocation = async (name, code, type, parentId = null) => {
    const locationData = {
      name,
      code,
      type
    };

    if (parentId) {
      try {
        const parentResponse = await dataService.getLocationById(parentId);
        locationData.parent = {
          id: parentResponse.data.id,
          name: parentResponse.data.name,
          code: parentResponse.data.code,
          type: parentResponse.data.type
        };
      } catch (error) {
        throw new Error(`Failed to load parent location: ${error.message}`);
      }
    }

    const response = await dataService.createLocation(locationData);
    return response.data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      

      let provinceId = formData.provinceId;
      if (formData.targetType !== 'Province') {
        if (!formData.provinceId && !formData.provinceName) {
          toast.error('Please select or create a Province');
          setLoading(false);
          return;
        }
        
        if (formData.provinceName) {
          

          if (!formData.provinceCode) {
            toast.error('Please enter Province code');
            setLoading(false);
            return;
          }
          const province = await createLocation(
            formData.provinceName,
            formData.provinceCode,
            'Province'
          );
          provinceId = province.id;
          

          await fetchProvinces();
          

          setFormData(prev => ({ ...prev, provinceId: province.id }));
          toast.success(`Province "${formData.provinceName}" created`);
        }
      }

      

      let districtId = formData.districtId;
      if (['Sector', 'Cell', 'Village'].includes(formData.targetType)) {
        if (!formData.districtId && !formData.districtName) {
          toast.error('Please select or create a District');
          setLoading(false);
          return;
        }
        
        if (formData.districtName) {
          

          if (!formData.districtCode) {
            toast.error('Please enter District code');
            setLoading(false);
            return;
          }
          if (!provinceId) {
            toast.error('Province is required to create District');
            setLoading(false);
            return;
          }
          const province = provinces.find(p => p.id === provinceId) || 
                          (formData.provinceName ? { code: formData.provinceCode } : null);
          const district = await createLocation(
            formData.districtName,
            formData.districtCode,
            'District',
            provinceId
          );
          districtId = district.id;
          

          await fetchChildren(provinceId, setDistricts, 'districts');
          

          setFormData(prev => ({ ...prev, districtId: district.id }));
          toast.success(`District "${formData.districtName}" created`);
        }
      }

      

      let sectorId = formData.sectorId;
      if (['Cell', 'Village'].includes(formData.targetType)) {
        if (!formData.sectorId && !formData.sectorName) {
          toast.error('Please select or create a Sector');
          setLoading(false);
          return;
        }
        
        if (formData.sectorName) {
          

          if (!formData.sectorCode) {
            toast.error('Please enter Sector code');
            setLoading(false);
            return;
          }
          if (!districtId) {
            toast.error('District is required to create Sector');
            setLoading(false);
            return;
          }
          const sector = await createLocation(
            formData.sectorName,
            formData.sectorCode,
            'Sector',
            districtId
          );
          sectorId = sector.id;
          

          await fetchChildren(districtId, setSectors, 'sectors');
          

          setFormData(prev => ({ ...prev, sectorId: sector.id }));
          toast.success(`Sector "${formData.sectorName}" created`);
        }
      }

      

      let cellId = formData.cellId;
      if (formData.targetType === 'Village') {
        if (!formData.cellId && !formData.cellName) {
          toast.error('Please select or create a Cell');
          setLoading(false);
          return;
        }
        
        if (formData.cellName) {
          

          if (!formData.cellCode) {
            toast.error('Please enter Cell code');
            setLoading(false);
            return;
          }
          if (!sectorId) {
            toast.error('Sector is required to create Cell');
            setLoading(false);
            return;
          }
          const cell = await createLocation(
            formData.cellName,
            formData.cellCode,
            'Cell',
            sectorId
          );
          cellId = cell.id;
          

          await fetchChildren(sectorId, setCells, 'cells');
          

          setFormData(prev => ({ ...prev, cellId: cell.id }));
          toast.success(`Cell "${formData.cellName}" created`);
        }
      }

      

      let targetParentId = null;
      if (formData.targetType === 'District') {
        targetParentId = provinceId;
      } else if (formData.targetType === 'Sector') {
        targetParentId = districtId;
      } else if (formData.targetType === 'Cell') {
        targetParentId = sectorId;
      } else if (formData.targetType === 'Village') {
        targetParentId = cellId;
      }

      if (formData.targetType !== 'Province' && !targetParentId) {
        const parentType = formData.targetType === 'District' ? 'Province' : 
                          formData.targetType === 'Sector' ? 'District' : 
                          formData.targetType === 'Cell' ? 'Sector' : 'Cell';
        toast.error(`${parentType} is required to create ${formData.targetType}`);
        setLoading(false);
        return;
      }

      if (!formData.targetName || !formData.targetCode) {
        toast.error('Please fill in location name and code');
        setLoading(false);
        return;
      }

      const newLocation = await createLocation(
        formData.targetName,
        formData.targetCode,
        formData.targetType,
        targetParentId
      );

      

      

      if (formData.targetType === 'Province') {
        await fetchProvinces();
      } else if (formData.targetType === 'District' && provinceId) {
        await fetchChildren(provinceId, setDistricts, 'districts');
      } else if (formData.targetType === 'Sector' && districtId) {
        await fetchChildren(districtId, setSectors, 'sectors');
      } else if (formData.targetType === 'Cell' && sectorId) {
        await fetchChildren(sectorId, setCells, 'cells');
      }

      toast.success(`${formData.targetType} "${formData.targetName}" created successfully!`);
      
      

      

      const locationUpdateData = {
        type: formData.targetType,
        parentId: targetParentId,
        locationId: newLocation.id,
        locationName: formData.targetName,
        timestamp: Date.now()
      };
      
      

      try {
        const existingUpdates = JSON.parse(sessionStorage.getItem('location-updates') || '[]');
        existingUpdates.push(locationUpdateData);
        

        if (existingUpdates.length > 10) {
          existingUpdates.shift();
        }
        sessionStorage.setItem('location-updates', JSON.stringify(existingUpdates));
      } catch (e) {
        console.warn('Failed to store location update in sessionStorage:', e);
      }
      
      

      window.dispatchEvent(new CustomEvent('location-updated', {
        detail: locationUpdateData
      }));
      
      onClose(true);
      resetForm();
    } catch (error) {
      console.error('Error creating location:', error);
      toast.error(error.response?.data?.message || error.message || `Failed to create ${formData.targetType}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!isOpen) return null;

  const needsProvince = formData.targetType !== 'Province';
  const needsDistrict = ['Sector', 'Cell', 'Village'].includes(formData.targetType);
  const needsSector = ['Cell', 'Village'].includes(formData.targetType);
  const needsCell = formData.targetType === 'Village';

  return (
    <div className="modal-overlay" onClick={() => !loading && onClose(false)}>
      <div className="modal-content add-location-modal-full" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Location</h2>
          <button className="modal-close-btn" onClick={() => !loading && onClose(false)} disabled={loading}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-location-form-full">
          {}
          <div className="info-box">
            <Info size={18} style={{ marginRight: '8px', flexShrink: 0 }} />
            <div>
              <strong>How to use:</strong>
              <ol style={{ margin: '8px 0 0 20px', padding: 0 }}>
                <li>Select the location type you want to create</li>
                <li>For each required parent level, either select an existing one OR enter details to create a new one</li>
                <li>Fill in the target location name and code</li>
                <li>Click "Create {formData.targetType}" to save</li>
              </ol>
            </div>
          </div>

          {}
          <div className="form-group">
            <label htmlFor="targetType">
              <strong>Step 1:</strong> What location type do you want to create? *
            </label>
            <select
              id="targetType"
              value={formData.targetType}
              onChange={handleTargetTypeChange}
              required
              disabled={loading}
              style={{ fontSize: '16px', padding: '12px' }}
            >
              <option value="Province">Province (No parent required)</option>
              <option value="District">District (Requires Province)</option>
              <option value="Sector">Sector (Requires Province + District)</option>
              <option value="Cell">Cell (Requires Province + District + Sector)</option>
              <option value="Village">Village (Requires Province + District + Sector + Cell)</option>
            </select>
          </div>

          {}
          {needsProvince && (
            <div className="hierarchy-section">
              <div className="hierarchy-header" onClick={() => toggleSection('province')}>
                <h3>
                  <strong>Step 2:</strong> Province (Required Parent) 
                  {expandedSections.province ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </h3>
              </div>
              {expandedSections.province && (
                <div className="hierarchy-content">
                  <div className="form-group">
                    <label htmlFor="provinceId">Select Existing Province</label>
                    <select
                      id="provinceId"
                      value={formData.provinceId}
                      onChange={handleProvinceSelect}
                      disabled={loading}
                    >
                      <option value="">-- Select a Province --</option>
                      {provinces.map(province => (
                        <option key={province.id} value={province.id}>
                          {province.name} ({province.code})
                        </option>
                      ))}
                    </select>
                    <small className="form-hint">If the province doesn't exist, fill in the fields below to create it</small>
                  </div>

                  <div style={{ 
                    margin: '20px 0', 
                    padding: '12px', 
                    background: '#f0f0f0', 
                    borderRadius: '8px',
                    border: '1px dashed #ccc'
                  }}>
                    <strong style={{ display: 'block', marginBottom: '8px' }}>OR Create New Province:</strong>
                    <div className="form-group">
                      <label htmlFor="provinceName">Province Name</label>
                      <input
                        type="text"
                        id="provinceName"
                        value={formData.provinceName}
                        onChange={(e) => {
                          const name = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            provinceName: name,
                            provinceCode: prev.provinceCode || autoGenerateCode(name, 'Province')
                          }));
                        }}
                        placeholder="Enter province name (e.g., Northern Province)"
                        disabled={loading || !!formData.provinceId}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="provinceCode">Province Code</label>
                      <input
                        type="text"
                        id="provinceCode"
                        value={formData.provinceCode}
                        onChange={(e) => setFormData(prev => ({ ...prev, provinceCode: e.target.value.toUpperCase() }))}
                        placeholder="Auto-generated or enter manually (e.g., PRV-NORTH)"
                        maxLength={50}
                        disabled={loading || !!formData.provinceId}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* District Section (if needed) */}
          {needsDistrict && (formData.provinceId || formData.provinceName) && (
            <div className="hierarchy-section">
              <div className="hierarchy-header" onClick={() => toggleSection('district')}>
                <h3>
                  <strong>Step 3:</strong> District (Required Parent)
                  {expandedSections.district ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </h3>
              </div>
              {expandedSections.district && (
                <div className="hierarchy-content">
                  <div className="form-group">
                    <label htmlFor="districtId">Select Existing District</label>
                    <select
                      id="districtId"
                      value={formData.districtId}
                      onChange={handleDistrictSelect}
                      disabled={loading || districts.length === 0}
                    >
                      <option value="">{districts.length === 0 ? '-- No districts found (create new below) --' : '-- Select a District --'}</option>
                      {districts.map(district => (
                        <option key={district.id} value={district.id}>
                          {district.name} ({district.code})
                        </option>
                      ))}
                    </select>
                    <small className="form-hint">If the district doesn't exist, fill in the fields below to create it</small>
                  </div>

                  <div style={{ 
                    margin: '20px 0', 
                    padding: '12px', 
                    background: '#f0f0f0', 
                    borderRadius: '8px',
                    border: '1px dashed #ccc'
                  }}>
                    <strong style={{ display: 'block', marginBottom: '8px' }}>OR Create New District:</strong>
                    <div className="form-group">
                      <label htmlFor="districtName">District Name</label>
                      <input
                        type="text"
                        id="districtName"
                        value={formData.districtName}
                        onChange={(e) => {
                          const name = e.target.value;
                          const province = provinces.find(p => p.id === formData.provinceId);
                          setFormData(prev => ({
                            ...prev,
                            districtName: name,
                            districtCode: prev.districtCode || autoGenerateCode(name, 'District', province?.code || formData.provinceCode || '')
                          }));
                        }}
                        placeholder="Enter district name"
                        disabled={loading || !!formData.districtId}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="districtCode">District Code</label>
                      <input
                        type="text"
                        id="districtCode"
                        value={formData.districtCode}
                        onChange={(e) => setFormData(prev => ({ ...prev, districtCode: e.target.value.toUpperCase() }))}
                        placeholder="Auto-generated or enter manually"
                        maxLength={50}
                        disabled={loading || !!formData.districtId}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {}
          {needsSector && (formData.districtId || formData.districtName) && (
            <div className="hierarchy-section">
              <div className="hierarchy-header" onClick={() => toggleSection('sector')}>
                <h3>
                  <strong>Step 4:</strong> Sector (Required Parent)
                  {expandedSections.sector ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </h3>
              </div>
              {expandedSections.sector && (
                <div className="hierarchy-content">
                  <div className="form-group">
                    <label htmlFor="sectorId">Select Existing Sector</label>
                    <select
                      id="sectorId"
                      value={formData.sectorId}
                      onChange={handleSectorSelect}
                      disabled={loading || sectors.length === 0}
                    >
                      <option value="">{sectors.length === 0 ? '-- No sectors found (create new below) --' : '-- Select a Sector --'}</option>
                      {sectors.map(sector => (
                        <option key={sector.id} value={sector.id}>
                          {sector.name} ({sector.code})
                        </option>
                      ))}
                    </select>
                    <small className="form-hint">If the sector doesn't exist, fill in the fields below to create it</small>
                  </div>

                  <div style={{ 
                    margin: '20px 0', 
                    padding: '12px', 
                    background: '#f0f0f0', 
                    borderRadius: '8px',
                    border: '1px dashed #ccc'
                  }}>
                    <strong style={{ display: 'block', marginBottom: '8px' }}>OR Create New Sector:</strong>
                    <div className="form-group">
                      <label htmlFor="sectorName">Sector Name</label>
                      <input
                        type="text"
                        id="sectorName"
                        value={formData.sectorName}
                        onChange={(e) => {
                          const name = e.target.value;
                          const district = districts.find(d => d.id === formData.districtId);
                          setFormData(prev => ({
                            ...prev,
                            sectorName: name,
                            sectorCode: prev.sectorCode || autoGenerateCode(name, 'Sector', district?.code || formData.districtCode || '')
                          }));
                        }}
                        placeholder="Enter sector name"
                        disabled={loading || !!formData.sectorId}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="sectorCode">Sector Code</label>
                      <input
                        type="text"
                        id="sectorCode"
                        value={formData.sectorCode}
                        onChange={(e) => setFormData(prev => ({ ...prev, sectorCode: e.target.value.toUpperCase() }))}
                        placeholder="Auto-generated or enter manually"
                        maxLength={50}
                        disabled={loading || !!formData.sectorId}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cell Section (if needed) */}
          {needsCell && (formData.sectorId || formData.sectorName) && (
            <div className="hierarchy-section">
              <div className="hierarchy-header" onClick={() => toggleSection('cell')}>
                <h3>
                  <strong>Step 5:</strong> Cell (Required Parent)
                  {expandedSections.cell ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </h3>
              </div>
              {expandedSections.cell && (
                <div className="hierarchy-content">
                  <div className="form-group">
                    <label htmlFor="cellId">Select Existing Cell</label>
                    <select
                      id="cellId"
                      value={formData.cellId}
                      onChange={(e) => setFormData(prev => ({ ...prev, cellId: e.target.value }))}
                      disabled={loading || cells.length === 0}
                    >
                      <option value="">{cells.length === 0 ? '-- No cells found (create new below) --' : '-- Select a Cell --'}</option>
                      {cells.map(cell => (
                        <option key={cell.id} value={cell.id}>
                          {cell.name} ({cell.code})
                        </option>
                      ))}
                    </select>
                    <small className="form-hint">If the cell doesn't exist, fill in the fields below to create it</small>
                  </div>

                  <div style={{ 
                    margin: '20px 0', 
                    padding: '12px', 
                    background: '#f0f0f0', 
                    borderRadius: '8px',
                    border: '1px dashed #ccc'
                  }}>
                    <strong style={{ display: 'block', marginBottom: '8px' }}>OR Create New Cell:</strong>
                    <div className="form-group">
                      <label htmlFor="cellName">Cell Name</label>
                      <input
                        type="text"
                        id="cellName"
                        value={formData.cellName}
                        onChange={(e) => {
                          const name = e.target.value;
                          const sector = sectors.find(s => s.id === formData.sectorId);
                          setFormData(prev => ({
                            ...prev,
                            cellName: name,
                            cellCode: prev.cellCode || autoGenerateCode(name, 'Cell', sector?.code || formData.sectorCode || '')
                          }));
                        }}
                        placeholder="Enter cell name"
                        disabled={loading || !!formData.cellId}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="cellCode">Cell Code</label>
                      <input
                        type="text"
                        id="cellCode"
                        value={formData.cellCode}
                        onChange={(e) => setFormData(prev => ({ ...prev, cellCode: e.target.value.toUpperCase() }))}
                        placeholder="Auto-generated or enter manually"
                        maxLength={50}
                        disabled={loading || !!formData.cellId}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {}
          <div className="target-location-section">
            <h3>
              <strong>Final Step:</strong> {formData.targetType} Details
            </h3>
            <div className="form-group">
              <label htmlFor="targetName">{formData.targetType} Name *</label>
              <input
                type="text"
                id="targetName"
                value={formData.targetName}
                onChange={(e) => {
                  const name = e.target.value;
                  let parentCode = '';
                  if (formData.targetType === 'District' && formData.provinceId) {
                    const province = provinces.find(p => p.id === formData.provinceId);
                    parentCode = province?.code || formData.provinceCode || '';
                  } else if (formData.targetType === 'Sector' && formData.districtId) {
                    const district = districts.find(d => d.id === formData.districtId);
                    parentCode = district?.code || formData.districtCode || '';
                  } else if (formData.targetType === 'Cell' && formData.sectorId) {
                    const sector = sectors.find(s => s.id === formData.sectorId);
                    parentCode = sector?.code || formData.sectorCode || '';
                  } else if (formData.targetType === 'Village' && formData.cellId) {
                    const cell = cells.find(c => c.id === formData.cellId);
                    parentCode = cell?.code || formData.cellCode || '';
                  }
                  setFormData(prev => ({
                    ...prev,
                    targetName: name,
                    targetCode: prev.targetCode || autoGenerateCode(name, formData.targetType, parentCode)
                  }));
                }}
                placeholder={`Enter ${formData.targetType.toLowerCase()} name`}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="targetCode">{formData.targetType} Code *</label>
              <input
                type="text"
                id="targetCode"
                value={formData.targetCode}
                onChange={(e) => setFormData(prev => ({ ...prev, targetCode: e.target.value.toUpperCase() }))}
                placeholder="Auto-generated or enter manually"
                required
                maxLength={50}
                disabled={loading}
              />
              <small className="form-hint">
                Code will be auto-generated based on name and parent, or enter manually
              </small>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={() => !loading && onClose(false)}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : `Create ${formData.targetType}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLocationModal;
