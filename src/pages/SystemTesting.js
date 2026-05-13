import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Activity,
  Database,
  Server,
  Code,
  ShieldCheck,
  Play,
  Clock,
  TerminalSquare,
  Network,
  UserPlus,
  LogIn,
  Building2,
  Key,
  KeyRound,
  Trash2,
  FileJson
} from 'lucide-react';
import './SystemTesting.css';

const API_BASE_URL = process.env.REACT_APP_API_URL ?? 'http://localhost:8081/api';

const testApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const SystemTesting = () => {
  const [healthStatus, setHealthStatus] = useState({
    frontend: 'ONLINE',
    backend: 'LOADING',
    database: 'LOADING',
    docker: 'LOADING'
  });

  const [requestConfig, setRequestConfig] = useState({
    method: 'GET',
    url: '/health',
    payload: ''
  });

  const [testResult, setTestResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testToken, setTestToken] = useState(null);
  const [activeTestIndex, setActiveTestIndex] = useState(null);
  const [customPayloads, setCustomPayloads] = useState({});
  const [defaultLocationId, setDefaultLocationId] = useState("123e4567-e89b-12d3-a456-426614174000");

  useEffect(() => {
    checkSystemHealth();
    fetchDefaultLocation();
  }, []);

  const fetchDefaultLocation = async () => {
    try {
      // Get any valid location from the database to use in our test payloads
      const res = await testApi.get('/locations');
      if (res.data && res.data.length > 0) {
        setDefaultLocationId(res.data[0].id);
      }
    } catch (e) {
      console.warn("Could not fetch default location for tests", e);
    }
  };

  const checkSystemHealth = async () => {
    try {
      const backendRes = await testApi.get('/health');
      setHealthStatus(prev => ({ ...prev, backend: backendRes.data.status === 'UP' ? 'ONLINE' : 'OFFLINE' }));
      
      try {
        const dbRes = await testApi.get('/health/test/db');
        setHealthStatus(prev => ({ ...prev, database: dbRes.data.status === 'CONNECTED' ? 'CONNECTED' : 'DISCONNECTED' }));
      } catch (dbErr) {
        setHealthStatus(prev => ({ ...prev, database: 'DISCONNECTED' }));
      }

      setHealthStatus(prev => ({ ...prev, docker: 'CONNECTED' }));
    } catch (error) {
      setHealthStatus(prev => ({ 
        ...prev, 
        backend: 'OFFLINE', 
        database: 'UNKNOWN',
        docker: 'ERROR'
      }));
    }
  };

  const getAuthHeaders = () => {
    return testToken ? { Authorization: `Bearer ${testToken}` } : {};
  };

  const handleExecute = async () => {
    setIsLoading(true);
    setTestResult(null);
    const startTime = performance.now();
    
    let dataPayload = null;
    if (['POST', 'PUT', 'PATCH'].includes(requestConfig.method) && requestConfig.payload.trim()) {
      try {
        dataPayload = JSON.parse(requestConfig.payload);
      } catch (e) {
        setTestResult({
          success: false,
          method: requestConfig.method,
          url: requestConfig.url,
          status: 'Syntax Error',
          time: 0,
          data: "Invalid JSON in Request Payload:\n" + e.message
        });
        setIsLoading(false);
        return;
      }
    }

    // Sanitize URL to handle accidental pastes like "GET /api/locations"
    let sanitizedUrl = requestConfig.url.trim();
    sanitizedUrl = sanitizedUrl.replace(/^(GET|POST|PUT|PATCH|DELETE)\s+/i, '');
    if (sanitizedUrl.startsWith('/api/')) {
      sanitizedUrl = sanitizedUrl.substring(4);
    } else if (sanitizedUrl === '/api') {
      sanitizedUrl = '/';
    }

    try {
      const response = await testApi({
        method: requestConfig.method,
        url: sanitizedUrl,
        data: dataPayload,
        headers: getAuthHeaders()
      });
      
      // Automatically grab token on successful login
      if (sanitizedUrl.includes('/auth/login') && response.data?.token) {
        setTestToken(response.data.token);
      }

      const endTime = performance.now();
      setTestResult({
        url: sanitizedUrl,
        method: requestConfig.method,
        status: response.status,
        time: Math.round(endTime - startTime),
        data: response.data,
        success: true
      });
    } catch (error) {
      const endTime = performance.now();
      setTestResult({
        url: sanitizedUrl,
        method: requestConfig.method,
        status: error.response?.status || 'Network Error',
        time: Math.round(endTime - startTime),
        data: error.response?.data || error.message,
        success: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPreset = (index, test) => {
    setActiveTestIndex(index);
    setRequestConfig({
      method: test.method,
      url: test.url,
      payload: customPayloads[index] !== undefined 
        ? customPayloads[index] 
        : (test.payload ? JSON.stringify(test.payload, null, 2) : '')
    });
    setTestResult(null);
  };

  const handlePayloadChange = (e) => {
    const newPayload = e.target.value;
    setRequestConfig({...requestConfig, payload: newPayload});
    if (activeTestIndex !== null) {
      setCustomPayloads(prev => ({
        ...prev,
        [activeTestIndex]: newPayload
      }));
    }
  };

  const PRESET_TESTS = [
    {
      name: 'Backend Health Check',
      icon: Server,
      method: 'GET',
      url: '/health'
    },
    {
      name: 'Database Health Check',
      icon: Database,
      method: 'GET',
      url: '/health/test/db'
    },
    {
      name: 'Register User',
      icon: UserPlus,
      method: 'POST',
      url: '/auth/register',
      payload: {
        userCode: "ADM-999",
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        phoneNumber: "+250788123456",
        password: "Password123!",
        confirmPassword: "Password123!",
        userType: "ADMIN",
        locationId: defaultLocationId
      }
    },
    {
      name: 'Login User',
      icon: LogIn,
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: "test@example.com",
        password: "Password123!"
      }
    },
    {
      name: 'Get All Crop Types',
      icon: Activity,
      method: 'GET',
      url: '/crop-types'
    },
    {
      name: 'Get Inventory (Requires Token)',
      icon: ShieldCheck,
      method: 'GET',
      url: '/inventories'
    },
    {
      name: 'Add Warehouse (Requires Token)',
      icon: Building2,
      method: 'POST',
      url: '/warehouses',
      payload: {
        warehouseName: "Kigali Main Storage",
        totalCapacity: 5000,
        warehouseType: "PRIVATE",
        locationId: defaultLocationId,
        status: "ACTIVE"
      }
    }
  ];

  const getStatusColor = (status) => {
    if (['ONLINE', 'CONNECTED'].includes(status)) return 'status-online';
    if (['OFFLINE', 'DISCONNECTED', 'ERROR'].includes(status)) return 'status-offline';
    return 'status-loading';
  };

  const getDotClass = (status) => {
    if (['ONLINE', 'CONNECTED'].includes(status)) return 'dot-online';
    if (['OFFLINE', 'DISCONNECTED', 'ERROR'].includes(status)) return 'dot-offline';
    return 'dot-loading';
  };

  return (
    <div className="system-testing-container">
      <div className="system-testing-header">
        <h1 className="system-testing-title">
          <TerminalSquare size={32} color="#10b981" />
          API Request Studio
        </h1>
        <button onClick={checkSystemHealth} className="refresh-btn" style={{ padding: '0.5rem 1rem', background: '#e5e7eb', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          Refresh Architecture Status
        </button>
      </div>

      <div className="status-dashboard">
        <div className="status-card">
          <Activity className="status-icon" size={28} color="#6366f1" />
          <div className="status-label">Frontend UI</div>
          <div className={`status-value ${getStatusColor(healthStatus.frontend)}`}>
            <span className={`status-dot ${getDotClass(healthStatus.frontend)}`}></span>
            {healthStatus.frontend}
          </div>
        </div>
        
        <div className="status-card">
          <Server className="status-icon" size={28} color="#8b5cf6" />
          <div className="status-label">Spring Boot Backend</div>
          <div className={`status-value ${getStatusColor(healthStatus.backend)}`}>
            <span className={`status-dot ${getDotClass(healthStatus.backend)}`}></span>
            {healthStatus.backend}
          </div>
        </div>

        <div className="status-card">
          <Database className="status-icon" size={28} color="#0ea5e9" />
          <div className="status-label">PostgreSQL Database</div>
          <div className={`status-value ${getStatusColor(healthStatus.database)}`}>
            <span className={`status-dot ${getDotClass(healthStatus.database)}`}></span>
            {healthStatus.database}
          </div>
        </div>

        <div className="status-card">
          <Network className="status-icon" size={28} color="#f59e0b" />
          <div className="status-label">Docker Networking</div>
          <div className={`status-value ${getStatusColor(healthStatus.docker)}`}>
            <span className={`status-dot ${getDotClass(healthStatus.docker)}`}></span>
            {healthStatus.docker}
          </div>
        </div>
      </div>

      <div className="test-section">
        {/* Left Sidebar: Presets */}
        <div className="test-sidebar">
          <h2 className="sidebar-title">API Catalog</h2>
          {PRESET_TESTS.map((test, index) => {
            const Icon = test.icon;
            return (
              <button 
                key={index} 
                className={`preset-button ${activeTestIndex === index ? 'active' : ''}`}
                onClick={() => loadPreset(index, test)}
              >
                <Icon size={18} />
                <span>{test.name}</span>
              </button>
            );
          })}
          
          <div style={{ marginTop: 'auto', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
             <div className={`jwt-indicator ${testToken ? '' : 'missing'}`} style={{ marginTop: 0 }}>
              <div className="jwt-icon-wrapper">
                {testToken ? <Key size={18} /> : <KeyRound size={18} />}
                <span>{testToken ? 'Test JWT Active' : 'No Test JWT Token'}</span>
              </div>
              {testToken && (
                <button className="clear-token-btn" onClick={() => setTestToken(null)}>
                  <Trash2 size={14}/>
                </button>
              )}
            </div>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem', textAlign: 'center' }}>
              JWT is automatically injected into Authorization headers.
            </p>
          </div>
        </div>

        {/* Right Panel: Request & Response */}
        <div className="request-panel">
          
          {/* Request Builder */}
          <div className="request-builder">
            <div className="url-bar">
              <select 
                className="method-select"
                value={requestConfig.method}
                onChange={(e) => setRequestConfig({...requestConfig, method: e.target.value})}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
              <input 
                type="text" 
                className="url-input"
                placeholder="e.g. /api/warehouses"
                value={requestConfig.url}
                onChange={(e) => setRequestConfig({...requestConfig, url: e.target.value})}
              />
              <button 
                className="execute-btn" 
                onClick={handleExecute}
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send'}
                <Play size={18} fill={isLoading ? 'transparent' : 'white'} />
              </button>
            </div>

            {['POST', 'PUT', 'PATCH'].includes(requestConfig.method) && (
              <div className="editor-container">
                <div className="editor-label">
                  <span><FileJson size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }}/> JSON Payload</span>
                </div>
                <textarea 
                  className="json-editor"
                  value={requestConfig.payload}
                  onChange={handlePayloadChange}
                  spellCheck="false"
                />
              </div>
            )}
          </div>

          {/* Response Viewer */}
          <div className="response-viewer">
            <div className="response-header">
              <div className="response-title">
                <Code size={20} />
                Response Viewer
              </div>
              {testResult && (
                <div className="response-meta">
                  <span className={`meta-item ${testResult.status === 'Syntax Error' ? 'meta-error' : testResult.success ? 'meta-status-2xx' : 'meta-status-4xx'}`}>
                    Status: {testResult.status}
                  </span>
                  <span className="meta-item meta-time">
                    <Clock size={16} />
                    {testResult.time}ms
                  </span>
                </div>
              )}
            </div>
            
            {testResult ? (
              <pre className="response-body">
                {typeof testResult.data === 'object' 
                  ? JSON.stringify(testResult.data, null, 2) 
                  : testResult.data}
              </pre>
            ) : (
              <div className="no-response">
                <TerminalSquare size={48} opacity={0.5} />
                <p>Configure your request above and click Send</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default SystemTesting;
