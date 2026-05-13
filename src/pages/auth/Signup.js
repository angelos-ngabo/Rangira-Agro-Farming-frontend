import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import toast from 'react-hot-toast';
import Navbar from '../../components/layout/Navbar';

const Signup = () => {
  const [formData, setFormData] = useState({
    userCode: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    userType: 'FARMER',
    locationId: '',
  });

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [cells, setCells] = useState([]);
  const [villages, setVillages] = useState([]);

  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [selectedCell, setSelectedCell] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await dataService.getProvinces();
        setProvinces(response.data.map(p => ({ id: p, name: p })));
      } catch (error) {
        console.error('Error fetching provinces:', error);
        toast.error('Failed to load provinces');
      }
    };
    fetchProvinces();
  }, []);

  React.useEffect(() => {
    if (selectedProvince) {
      const fetchDistricts = async () => {
        try {
          const response = await dataService.getDistricts(selectedProvince);
          setDistricts(response.data.map(d => ({ id: d, name: d })));
        } catch (error) {
          console.error('Error fetching districts:', error);
          toast.error('Failed to load districts');
          setDistricts([]);
        }
      };
      fetchDistricts();
      setSelectedDistrict('');
      setSelectedSector('');
      setSectors([]);
      setSelectedCell('');
      setSelectedVillage('');
      setCells([]);
      setVillages([]);
      setFormData(prev => ({ ...prev, locationId: '' }));
    } else {
      setDistricts([]);
      setSelectedDistrict('');
      setSelectedSector('');
      setSectors([]);
      setSelectedCell('');
      setSelectedVillage('');
      setCells([]);
      setVillages([]);
    }
  }, [selectedProvince]);

  React.useEffect(() => {
    if (selectedDistrict && selectedProvince) {
      const fetchSectors = async () => {
        try {
          const response = await dataService.getSectors(selectedProvince, selectedDistrict);
          setSectors(response.data.map(s => ({ id: s, name: s })));
        } catch (error) {
          console.error('Error fetching sectors:', error);
          toast.error('Failed to load sectors');
          setSectors([]);
        }
      };
      fetchSectors();
      setSelectedSector('');
      setSelectedCell('');
      setSelectedVillage('');
      setCells([]);
      setVillages([]);
      setFormData(prev => ({ ...prev, locationId: '' }));
    } else {
      setSectors([]);
      setSelectedSector('');
      setSelectedCell('');
      setSelectedVillage('');
      setCells([]);
      setVillages([]);
    }
  }, [selectedDistrict, selectedProvince]);

  React.useEffect(() => {
    if (selectedSector && selectedDistrict && selectedProvince) {
      const fetchCells = async () => {
        try {
          const response = await dataService.getCells(selectedProvince, selectedDistrict, selectedSector);
          if (response.data && Array.isArray(response.data)) {
            setCells(response.data.map(c => ({ id: c, name: c })));
          } else {
            setCells([]);
          }
        } catch (error) {
          console.error('Error fetching cells:', error);
          toast.error('Failed to load cells');
          setCells([]);
        }
      };
      fetchCells();
      setSelectedCell('');
      setSelectedVillage('');
      setVillages([]);
      setFormData(prev => ({ ...prev, locationId: '' }));
    } else {
      setCells([]);
      setSelectedCell('');
      setSelectedVillage('');
      setVillages([]);
    }
  }, [selectedSector, selectedDistrict, selectedProvince]);

  React.useEffect(() => {
    if (selectedCell && selectedSector && selectedDistrict && selectedProvince) {
      const fetchVillages = async () => {
        try {
          const response = await dataService.getVillages(selectedProvince, selectedDistrict, selectedSector, selectedCell);
          if (response.data && Array.isArray(response.data)) {
            setVillages(response.data.map(v => ({ id: v.id, name: v.village })));
          } else {
            setVillages([]);
          }
        } catch (error) {
          console.error('Error fetching villages:', error);
          toast.error('Failed to load villages');
          setVillages([]);
        }
      };
      fetchVillages();
      setSelectedVillage('');
      setFormData(prev => ({ ...prev, locationId: '' }));
    } else {
      setVillages([]);
      setSelectedVillage('');
    }
  }, [selectedCell, selectedSector, selectedDistrict, selectedProvince]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleProvinceChange = (e) => {
    setSelectedProvince(e.target.value);
  };

  const handleDistrictChange = (e) => {
    setSelectedDistrict(e.target.value);
  };

  const handleSectorChange = (e) => {
    const sectorId = e.target.value;
    setSelectedSector(sectorId);
    setSelectedCell('');
    setSelectedVillage('');
    setFormData(prev => ({ ...prev, locationId: '' }));
  };

  const handleCellChange = (e) => {
    const cellId = e.target.value;
    setSelectedCell(cellId);
    setSelectedVillage('');
    setFormData(prev => ({ ...prev, locationId: '' }));
  };

  const handleVillageChange = (e) => {
    const villageId = e.target.value;
    setSelectedVillage(villageId);
    setFormData(prev => ({ ...prev, locationId: villageId }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (!selectedProvince || !selectedDistrict || !selectedSector || !selectedCell || !selectedVillage) {
      toast.error('Please select a complete location (Province → District → Sector → Cell → Village)');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      await register({ ...registerData, locationId: selectedVillage });
      toast.success('Registration successful! Please check your email for the verification code.');
      navigate('/verify-otp', { state: { email: formData.email } });
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page">
      <Navbar />

      <main className="main">
        {}
        <div
          className="page-title dark-background"
          data-aos="fade"
          style={{ backgroundImage: 'url(/assets/img/page-title-bg.webp)' }}
        >
          <div className="container position-relative">
            <h1>Sign Up</h1>

            <nav className="breadcrumbs">
              <ol>
                <li><Link to="/">Home</Link></li>
                <li className="current">Sign Up</li>
              </ol>
            </nav>
          </div>
        </div>

        {}
        <section id="contact" className="contact section">
          <div className="container" data-aos="fade">
            <div className="row gy-5 gx-lg-5">
              <div className="col-lg-4">
                <div className="info">
                  <h3>Join Our Community</h3>
                  <p>Create an account to start trading, managing your farm, or storing your crops.</p>

                  <div className="info-item d-flex">
                    <i className="bi bi-person-check flex-shrink-0"></i>
                    <div>
                      <h4>Already have an account?</h4>
                      <p>
                        <Link to="/login" style={{ color: 'inherit', textDecoration: 'underline' }}>
                          Login here
                        </Link>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-8">
                <form onSubmit={handleSubmit} className="php-email-form">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="User Code (e.g., FARMER001)"
                          name="userCode"
                          value={formData.userCode}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="form-group mt-3">
                        <select
                          className="form-control"
                          name="userType"
                          value={formData.userType}
                          onChange={handleChange}
                          required
                        >
                          <option value="FARMER">Farmer</option>
                          <option value="BUYER">Buyer</option>
                        </select>
                      </div>
                      <div className="form-group mt-3">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="First Name"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="form-group mt-3">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Last Name"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="form-group mt-3">
                        <input
                          type="email"
                          className="form-control"
                          placeholder="Email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="form-group mt-3">
                        <input
                          type="tel"
                          className="form-control"
                          placeholder="Phone Number"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group mt-3 mt-md-0">
                        <select
                          className="form-control"
                          name="province"
                          value={selectedProvince}
                          onChange={handleProvinceChange}
                          required
                          disabled={loadingLocations}
                        >
                          <option value="">
                            {loadingLocations ? 'Loading...' : 'Select Province'}
                          </option>
                          {provinces.map((province) => (
                            <option key={province.id} value={province.id}>
                              {province.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group mt-3">
                        <select
                          className="form-control"
                          name="district"
                          value={selectedDistrict}
                          onChange={handleDistrictChange}
                          required
                          disabled={!selectedProvince || loadingLocations}
                        >
                          <option value="">Select District</option>
                          {districts.map((district) => (
                            <option key={district.id} value={district.id}>
                              {district.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group mt-3">
                        <select
                          className="form-control"
                          name="sector"
                          value={selectedSector}
                          onChange={handleSectorChange}
                          required
                          disabled={!selectedDistrict || loadingLocations}
                        >
                          <option value="">Select Sector</option>
                          {sectors.map((sector) => (
                            <option key={sector.id} value={sector.id}>
                              {sector.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group mt-3">
                        <select
                          className="form-control"
                          name="cell"
                          value={selectedCell}
                          onChange={handleCellChange}
                          required
                          disabled={!selectedSector || loadingLocations}
                        >
                          <option value="">Select Cell</option>
                          {cells.map((cell) => (
                            <option key={cell.id} value={cell.id}>
                              {cell.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group mt-3">
                        <select
                          className="form-control"
                          name="village"
                          value={selectedVillage}
                          onChange={handleVillageChange}
                          required
                          disabled={!selectedCell || loadingLocations}
                        >
                          <option value="">Select Village</option>
                          {villages.map((village) => (
                            <option key={village.id} value={village.id}>
                              {village.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group mt-3">
                        <input
                          type="password"
                          className="form-control"
                          placeholder="Password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="form-group mt-3">
                        <input
                          type="password"
                          className="form-control"
                          placeholder="Confirm Password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="my-3">
                    {loading && <div className="loading">Loading</div>}
                  </div>

                  <div className="text-center">
                    <button type="submit" disabled={loading}>
                      {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Signup;
