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

  // Location hierarchy state
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [sectors, setSectors] = useState([]);

  // Selected location IDs
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedSector, setSelectedSector] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Fetch provinces on mount
  React.useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingLocations(true);
      try {
        const response = await dataService.getProvinces();
        const provincesData = response?.data;

        if (Array.isArray(provincesData)) {
          if (provincesData.length > 0) {
            setProvinces(provincesData);
          } else {
            setProvinces([]);
            toast.error('No provinces found.', { duration: 6000 });
          }
        } else {
          setProvinces([]);
        }
      } catch (error) {
        console.error('Error fetching provinces:', error);
        setProvinces([]);
      } finally {
        setLoadingLocations(false);
      }
    };

    fetchProvinces();
  }, []);

  // Fetch districts when province is selected
  React.useEffect(() => {
    if (selectedProvince) {
      setLoadingLocations(true);
      dataService.getChildLocations(selectedProvince)
        .then((response) => {
          const districtsData = response?.data || [];
          if (Array.isArray(districtsData)) {
            setDistricts(districtsData);
            setSelectedDistrict('');
            setSelectedSector('');
            setSectors([]);
            setFormData(prev => ({ ...prev, locationId: '' }));
          } else {
            setDistricts([]);
          }
        })
        .catch((error) => {
          console.error('Error fetching districts:', error);
          toast.error('Failed to load districts');
          setDistricts([]);
        })
        .finally(() => {
          setLoadingLocations(false);
        });
    } else {
      setDistricts([]);
      setSelectedDistrict('');
      setSelectedSector('');
      setSectors([]);
    }
  }, [selectedProvince]);

  // Fetch sectors when district is selected
  React.useEffect(() => {
    if (selectedDistrict) {
      setLoadingLocations(true);
      dataService.getChildLocations(selectedDistrict)
        .then((response) => {
          const sectorsData = response?.data || response || [];
          setSectors(sectorsData);
          setSelectedSector('');
          setFormData(prev => ({ ...prev, locationId: '' }));
        })
        .catch((error) => {
          console.error('Error fetching sectors:', error);
          toast.error('Failed to load sectors');
          setSectors([]);
        })
        .finally(() => {
          setLoadingLocations(false);
        });
    } else {
      setSectors([]);
      setSelectedSector('');
    }
  }, [selectedDistrict]);

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
    setFormData(prev => ({ ...prev, locationId: sectorId }));
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

    if (!formData.locationId) {
      toast.error('Please select a complete location (Province → District → Sector)');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      toast.success('Registration successful! Please check your email for the verification code.');
      navigate('/verify-otp', { state: { email: formData.email } });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page">
      <Navbar />

      <main className="main">
        {/* Page Title */}
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

        {/* Contact Section (Reused for Signup) */}
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
