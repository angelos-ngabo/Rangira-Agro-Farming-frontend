import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import Navbar from '../../components/layout/Navbar';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authService.forgotPassword(email);
      setSent(true);
      toast.success('Password reset link sent to your email!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="contact-page">
        <Navbar />
        <main className="main">
          <div
            className="page-title dark-background"
            data-aos="fade"
            style={{ backgroundImage: 'url(/assets/img/page-title-bg.webp)' }}
          >
            <div className="container position-relative">
              <h1>Check Your Email</h1>
              <nav className="breadcrumbs">
                <ol>
                  <li><Link to="/">Home</Link></li>
                  <li><Link to="/login">Login</Link></li>
                  <li className="current">Forgot Password</li>
                </ol>
              </nav>
            </div>
          </div>

          <section id="contact" className="contact section">
            <div className="container" data-aos="fade">
              <div className="row gy-5 gx-lg-5 justify-content-center">
                <div className="col-lg-8">
                  <div className="info" style={{ textAlign: 'center' }}>
                    <h3>Email Sent</h3>
                    <p>We've sent a password reset link to <strong>{email}</strong></p>
                    <p>Please check your email and click the link to reset your password.</p>
                    <div className="text-center mt-4">
                      <Link to="/login" className="btn btn-primary" style={{ background: 'var(--accent-color)', border: 'none' }}>
                        Back to Login
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

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
            <h1>Forgot Password</h1>
            <nav className="breadcrumbs">
              <ol>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/login">Login</Link></li>
                <li className="current">Forgot Password</li>
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
                  <h3>Reset Password</h3>
                  <p>Enter your email address and we'll send you a link to reset your password.</p>
                </div>

                <form onSubmit={handleSubmit} className="php-email-form">
                  <div className="row">
                    <div className="col-md-12 form-group">
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        id="email"
                        placeholder="Enter your email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="my-3">
                    {loading && <div className="loading">Loading</div>}
                  </div>

                  <div className="text-center">
                    <button type="submit" disabled={loading}>
                      {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                  </div>

                  <div className="text-center mt-4">
                    <p>
                      Remember your password? <Link to="/login" style={{ color: 'var(--accent-color)' }}>Login</Link>
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

export default ForgotPassword;




