import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import Navbar from '../../components/layout/Navbar';
import './Auth.css';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(token, password);
      toast.success('Password reset successful! Please login with your new password.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password. Please try again.');
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
            <h1>Reset Password</h1>
            <nav className="breadcrumbs">
              <ol>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/login">Login</Link></li>
                <li className="current">Reset Password</li>
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
                  <h3>Set New Password</h3>
                  <p>Please enter your new password below.</p>
                </div>

                <form onSubmit={handleSubmit} className="php-email-form">
                  <div className="row">
                    <div className="col-md-12 form-group">
                      <input
                        type="password"
                        className="form-control"
                        name="password"
                        id="password"
                        placeholder="New Password (Min. 6 characters)"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    <div className="col-md-12 form-group mt-3">
                      <input
                        type="password"
                        className="form-control"
                        name="confirmPassword"
                        id="confirmPassword"
                        placeholder="Confirm New Password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="my-3">
                    {loading && <div className="loading">Loading</div>}
                  </div>

                  <div className="text-center">
                    <button type="submit" disabled={loading}>
                      {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                  </div>

                  <div className="text-center mt-4">
                    <Link to="/login" style={{ color: 'var(--accent-color)' }}>Back to Login</Link>
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

export default ResetPassword;




