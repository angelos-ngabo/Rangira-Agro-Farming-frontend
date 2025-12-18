import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer id="footer" className="footer dark-background">
      <div className="footer-top">
        <div className="container">
          <div className="row gy-4">
            <div className="col-lg-4 col-md-6 footer-about">
              <Link to="/" className="logo d-flex align-items-center">
                <span className="sitename">Rangira Agro Farming</span>
              </Link>
              <div className="footer-contact pt-3">
                <p>Kigali, Rwanda</p>
                <p className="mt-3"><strong>Phone:</strong> <span>+250 788 123 456</span></p>
                <p><strong>Email:</strong> <span>info@rangiraagro.com</span></p>
                <p className="mt-3">
                  Rangira Agro Farming connects farmers, buyers, and warehouse managers to create a seamless agricultural supply chain.
                </p>
              </div>
            </div>

            <div className="col-lg-2 col-md-3 footer-links">
              <h4>Quick Links</h4>
              <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/about">About</Link></li>
                <li><Link to="/services">Services</Link></li>
                <li><Link to="/contact">Contact</Link></li>
              </ul>
            </div>

            <div className="col-lg-2 col-md-3 footer-links">
              <h4>Our Services</h4>
              <ul>
                <li><a href="#">Crop Storage</a></li>
                <li><a href="#">Warehouse Management</a></li>
                <li><a href="#">Direct Trading</a></li>
                <li><a href="#">Quality Assurance</a></li>
              </ul>
            </div>

            {}
          </div>
        </div>
      </div>

      <div className="copyright text-center">
        <div className="container d-flex flex-column flex-lg-row justify-content-center justify-content-lg-between align-items-center">
          <div className="d-flex flex-column align-items-center align-items-lg-start">
            <div>
              © Copyright <strong><span>Rangira Agro Farming</span></strong>. All Rights Reserved
            </div>
          </div>

          <div className="social-links order-first order-lg-last mb-3 mb-lg-0">
            <a href=""><i className="bi bi-twitter-x"></i></a>
            <a href=""><i className="bi bi-facebook"></i></a>
            <a href=""><i className="bi bi-instagram"></i></a>
            <a href=""><i className="bi bi-linkedin"></i></a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
