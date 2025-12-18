import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import Navbar from '../../components/layout/Navbar';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(email, password);

      if (result.requires2FA) {
        const emailFor2FA = result.email || email;
        setRequires2FA(true);
        toast.success('Please verify with 2FA code sent to your email');
        navigate('/2fa', { state: { email: emailFor2FA }, replace: true });
      } else {
        toast.success('Login successful!');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  if (requires2FA) {
    return <Navigate to="/2fa" state={{ email }} replace />;
  }

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
            <h1>Login</h1>

            <nav className="breadcrumbs">
              <ol>
                <li><Link to="/">Home</Link></li>
                <li className="current">Login</li>
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
                  <h3>Welcome Back</h3>
                  <p>Access your dashboard to manage your farm, warehouse, or orders.</p>

                  <div className="info-item d-flex">
                    <i className="bi bi-person-plus flex-shrink-0"></i>
                    <div>
                      <h4>New User?</h4>
                      <p>
                        <Link to="/signup" style={{ color: 'inherit', textDecoration: 'underline' }}>
                          Create an account
                        </Link>
                      </p>
                    </div>
                  </div>

                  <div className="info-item d-flex">
                    <i className="bi bi-key flex-shrink-0"></i>
                    <div>
                      <h4>Forgot Password?</h4>
                      <p>
                        <Link to="/forgot-password" style={{ color: 'inherit', textDecoration: 'underline' }}>
                          Reset it here
                        </Link>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-8">
                <form onSubmit={handleSubmit} className="php-email-form">
                  <div className="row">
                    <div className="col-md-12 form-group">
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        id="email"
                        placeholder="Your Email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-group mt-3">
                    <input
                      type="password"
                      className="form-control"
                      name="password"
                      id="password"
                      placeholder="Your Password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <div className="my-3">
                    {loading && <div className="loading">Loading</div>}
                  </div>

                  <div className="text-center">
                    <button type="submit" disabled={loading}>
                      {loading ? 'Logging in...' : 'Login'}
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

export default Login;
