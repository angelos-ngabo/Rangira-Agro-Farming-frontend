import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import Navbar from '../../components/layout/Navbar';
import './Auth.css';

const TwoFactorAuth = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { loginWith2FA } = useAuth();
  const [email, setEmail] = useState(location.state?.email || '');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (code.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);

    try {
      await loginWith2FA(email, code);
      toast.success('2FA verification successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid verification code. Please try again.');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authService.send2FACode(email);
      toast.success('New verification code sent to your email!');
    } catch (error) {
      toast.error('Failed to resend code. Please try again.');
    } finally {
      setResending(false);
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
            <h1>Two-Factor Authentication</h1>
            <nav className="breadcrumbs">
              <ol>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/login">Login</Link></li>
                <li className="current">2FA Verification</li>
              </ol>
            </nav>
          </div>
        </div>

        {/* Contact Section */}
        <section id="contact" className="contact section">
          <div className="container" data-aos="fade">
            <div className="row gy-5 gx-lg-5 justify-content-center">
              <div className="col-lg-8">
                <div className="info mb-4">
                  <h3>Verification Code</h3>
                  <p>
                    Enter the 6-digit code sent to <strong>{email}</strong>
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="php-email-form">
                  <div className="row">
                    <div className="col-md-12 form-group">
                      <input
                        type="text"
                        className="form-control"
                        id="code"
                        value={code}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setCode(value);
                        }}
                        required
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                      />
                    </div>
                  </div>

                  <div className="my-3">
                    {loading && <div className="loading">Loading</div>}
                  </div>

                  <div className="text-center">
                    <button type="submit" disabled={loading || code.length !== 6}>
                      {loading ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>

                  <div className="text-center mt-4">
                    <p>
                      Didn't receive the code?{' '}
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resending}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--accent-color)',
                          cursor: resending ? 'not-allowed' : 'pointer',
                          padding: 0,
                          fontWeight: 'inherit',
                          textDecoration: 'none'
                        }}
                      >
                        {resending ? 'Resending...' : 'Resend Code'}
                      </button>
                    </p>
                    <p className="mt-2">
                      <Link to="/login" style={{ color: 'var(--accent-color)' }}>Back to Login</Link>
                    </p>
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

export default TwoFactorAuth;

