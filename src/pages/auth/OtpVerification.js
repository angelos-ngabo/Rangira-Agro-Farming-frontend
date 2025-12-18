import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import Navbar from '../../components/layout/Navbar';
import { getBackgroundImageUrl } from '../../utils/backgroundImage';
import './Auth.css';

const OtpVerification = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuthData } = useAuth();

  

  const email = location.state?.email || new URLSearchParams(location.search).get('email');

  React.useEffect(() => {
    if (!email) {
      toast.error('Email address is required for verification');
      navigate('/signup');
    }
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP code');
      return;
    }

    setLoading(true);

    try {
      const data = await authService.verifyOtp(email, otp);

      

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        userId: data.userId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        userType: data.userType,
        profilePictureUrl: data.profilePictureUrl,
      }));

      

      const { token: authToken, ...userData } = data;

      

      setAuthData(authToken, userData);

      toast.success('Email verified successfully! Your account is now active.');
      

      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'OTP verification failed. Please try again.');
      console.error('OTP verification error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);

    try {
      await authService.resendOtp(email);
      toast.success('OTP has been resent to your email address');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP. Please try again.');
      console.error('Resend OTP error:', error);
    } finally {
      setResending(false);
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
            <h1>Verify Email</h1>
            <nav className="breadcrumbs">
              <ol>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/signup">Sign Up</Link></li>
                <li className="current">Verify Email</li>
              </ol>
            </nav>
          </div>
        </div>

        {}
        <section id="contact" className="contact section">
          <div className="container" data-aos="fade">
            <div className="row gy-5 gx-lg-5 justify-content-center">
              <div className="col-lg-8">
                <div className="info mb-4">
                  <h3>Enter Verification Code</h3>
                  <p>
                    We've sent a 6-digit verification code to <strong>{email}</strong>.
                    Please check your email and enter the code below.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="php-email-form">
                  <div className="row">
                    <div className="col-md-12 form-group">
                      <input
                        type="text"
                        className="form-control"
                        name="otp"
                        id="otp"
                        value={otp}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setOtp(value);
                        }}
                        placeholder="Enter 6-digit OTP"
                        maxLength="6"
                        required
                      />
                    </div>
                  </div>

                  <div className="my-3">
                    {loading && <div className="loading">Loading</div>}
                  </div>

                  <div className="text-center">
                    <button type="submit" disabled={loading || otp.length !== 6}>
                      {loading ? 'Verifying...' : 'Verify Email'}
                    </button>
                  </div>

                  <div className="text-center mt-4">
                    <p>
                      Didn't receive the code?{' '}
                      <button
                        type="button"
                        onClick={handleResendOtp}
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
                        {resending ? 'Resending...' : 'Resend OTP'}
                      </button>
                    </p>
                    <p className="mt-2">
                      <Link to="/signup" style={{ color: 'var(--accent-color)' }}>Back to Sign Up</Link>
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

export default OtpVerification;

