import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getLogoUrl } from '../../utils/imageUtils';
import PublicGlobalSearch from '../search/PublicGlobalSearch';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    navigate('/');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    document.body.classList.toggle('mobile-nav-active');
  };

  const toggleDropdown = (e) => {
    e.preventDefault();
    setDropdownOpen(!dropdownOpen);
  };

  

  useEffect(() => {
    setMobileMenuOpen(false);
    document.body.classList.remove('mobile-nav-active');
  }, [navigate]);

  return (
    <header id="header" className="header d-flex align-items-center position-relative">
      <div className="container-fluid container-xl position-relative d-flex align-items-center justify-content-between">
        <Link to="/" className="logo d-flex align-items-center">
          {}
          <img src={getLogoUrl()} alt="Rangira Agro Farming" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block' }} />
          <h1 className="sitename" style={{ display: 'none' }}>Rangira</h1>
        </Link>

        <nav id="navmenu" className={`navmenu ${mobileMenuOpen ? 'mobile-nav-active' : ''}`}>
          <ul>
            <li><NavLink to="/" className={({ isActive }) => isActive ? "active" : ""}>Home</NavLink></li>
            <li><NavLink to="/about" className={({ isActive }) => isActive ? "active" : ""}>About Us</NavLink></li>
            <li><NavLink to="/services" className={({ isActive }) => isActive ? "active" : ""}>Our Services</NavLink></li>
            <li><NavLink to="/testimonials" className={({ isActive }) => isActive ? "active" : ""}>Testimonials</NavLink></li>
            <li><NavLink to="/blog" className={({ isActive }) => isActive ? "active" : ""}>Blog</NavLink></li>

            <li className={`dropdown ${dropdownOpen ? 'active' : ''}`}>
              <a href="#" onClick={toggleDropdown}>
                <span>Interact</span> <i className="bi bi-chevron-down toggle-dropdown"></i>
              </a>
              <ul className={dropdownOpen ? 'dropdown-active' : ''}>
                {!isAuthenticated ? (
                  <>
                    <li><Link to="/login">Login</Link></li>
                    <li><Link to="/signup">Signup</Link></li>
                  </>
                ) : (
                  <>
                    <li><Link to="/profile">Profile</Link></li>
                    <li><Link to="/dashboard">Dashboard</Link></li>
                    <li><a href="#" onClick={handleLogout}>Logout</a></li>
                  </>
                )}
              </ul>
            </li>

            <li><NavLink to="/contact" className={({ isActive }) => isActive ? "active" : ""}>Contact</NavLink></li>
            <li className="nav-search-item">
              <PublicGlobalSearch />
            </li>
          </ul>
          <i
            className={`mobile-nav-toggle d-xl-none bi ${mobileMenuOpen ? 'bi-x' : 'bi-list'}`}
            onClick={toggleMobileMenu}
          ></i>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
