import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { getImage } from '../utils/imageUtils';
import NewsletterForm from '../components/common/NewsletterForm';


const ServicesPage = () => {
  return (
    <div className="services-page">
      <Navbar />

      <main className="main">
        {}
        <div
          className="page-title dark-background"
          data-aos="fade"
          style={{ backgroundImage: `url(${getImage('tea-plantation-background.jpg')})` }}
        >
          <div className="container position-relative">
            <h1>Services</h1>
            <p>Comprehensive digital solutions for modern agriculture.</p>
            <nav className="breadcrumbs">
              <ol>
                <li><Link to="/">Home</Link></li>
                <li className="current">Services</li>
              </ol>
            </nav>
          </div>
        </div>

        {}
        <section id="services" className="services section">
          <div className="container section-title" data-aos="fade-up">
            <h2>SERVICES</h2>
            <p>Providing Digital Tools for Every Step</p>
          </div>
          <div className="content">
            <div className="container">
              <div className="row g-0">

                <div className="col-lg-3 col-md-6">
                  <div className="service-item">
                    <span className="number">01</span>
                    <div className="service-item-icon">
                      <i className="bi bi-flower1 display-6"></i>
                    </div>
                    <div className="service-item-content">
                      <h3 className="service-heading">Crop Management</h3>
                      <p>Track planting dates, expected harvest, and manage your crop inventory efficiently.</p>
                    </div>
                  </div>
                </div>

                <div className="col-lg-3 col-md-6">
                  <div className="service-item">
                    <span className="number">02</span>
                    <div className="service-item-icon">
                      <i className="bi bi-house-door display-6"></i>
                    </div>
                    <div className="service-item-content">
                      <h3 className="service-heading">Warehouse System</h3>
                      <p>Real-time visibility into warehouse capacity and location-based storage solutions.</p>
                    </div>
                  </div>
                </div>

                <div className="col-lg-3 col-md-6">
                  <div className="service-item">
                    <span className="number">03</span>
                    <div className="service-item-icon">
                      <i className="bi bi-cash-coin display-6"></i>
                    </div>
                    <div className="service-item-content">
                      <h3 className="service-heading">Transactions</h3>
                      <p>Secure digital payments and transparent transaction history for all parties.</p>
                    </div>
                  </div>
                </div>

                <div className="col-lg-3 col-md-6">
                  <div className="service-item">
                    <span className="number">04</span>
                    <div className="service-item-icon">
                      <i className="bi bi-star display-6"></i>
                    </div>
                    <div className="service-item-content">
                      <h3 className="service-heading">Quality Grading</h3>
                      <p>Standardized grading system to ensure fair pricing based on produce quality.</p>
                    </div>
                  </div>
                </div>

                <div className="col-lg-3 col-md-6">
                  <div className="service-item">
                    <span className="number">05</span>
                    <div className="service-item-icon">
                      <i className="bi bi-truck display-6"></i>
                    </div>
                    <div className="service-item-content">
                      <h3 className="service-heading">Market Access</h3>
                      <p>Direct connection between farmers and buyers, eliminating unnecessary middlemen.</p>
                    </div>
                  </div>
                </div>

                <div className="col-lg-3 col-md-6">
                  <div className="service-item">
                    <span className="number">06</span>
                    <div className="service-item-icon">
                      <i className="bi bi-graph-up display-6"></i>
                    </div>
                    <div className="service-item-content">
                      <h3 className="service-heading">Analytics</h3>
                      <p>Data-driven insights to help you make informed decisions about planting and selling.</p>
                    </div>
                  </div>
                </div>

                <div className="col-lg-3 col-md-6">
                  <div className="service-item">
                    <span className="number">07</span>
                    <div className="service-item-icon">
                      <i className="bi bi-people display-6"></i>
                    </div>
                    <div className="service-item-content">
                      <h3 className="service-heading">Extension Services</h3>
                      <p>Access to expert advice and best practices to improve your farming yield.</p>
                    </div>
                  </div>
                </div>

                <div className="col-lg-3 col-md-6">
                  <div className="service-item">
                    <span className="number">08</span>
                    <div className="service-item-icon">
                      <i className="bi bi-phone display-6"></i>
                    </div>
                    <div className="service-item-content">
                      <h3 className="service-heading">Mobile Access</h3>
                      <p>Fully responsive platform allowing you to manage your business from any device.</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {}
        <section id="about" className="about section">
          <div className="content">
            <div className="container">
              <div className="row">
                <div className="col-lg-6 mb-4 mb-lg-0">
                  <img src={getImage('img_long_5.jpg')} alt="Image" className="img-fluid img-overlap" data-aos="zoom-out" />
                </div>
                <div className="col-lg-5 ml-auto" data-aos="fade-up" data-aos-delay="100">
                  <h3 className="content-subtitle text-white opacity-50">Why Choose Us</h3>
                  <h2 className="content-title mb-4">
                    Empowering <strong>Rwandan Agriculture</strong> with Technology
                  </h2>
                  <p className="opacity-50">
                    Rangira Agro Farming is designed to address the unique challenges of the Rwandan agricultural sector.
                  </p>

                  <div className="row my-5">
                    <div className="col-lg-12 d-flex align-items-start mb-4">
                      <i className="bi bi-check-circle me-4 display-6 text-white"></i>
                      <div>
                        <h4 className="m-0 h5 text-white">Localized Solutions</h4>
                        <p className="text-white opacity-50">Tailored to Rwanda's administrative structure.</p>
                      </div>
                    </div>
                    <div className="col-lg-12 d-flex align-items-start mb-4">
                      <i className="bi bi-shield-check me-4 display-6 text-white"></i>
                      <div>
                        <h4 className="m-0 h5 text-white">Secure Platform</h4>
                        <p className="text-white opacity-50">Data privacy and secure transactions are our priority.</p>
                      </div>
                    </div>
                    <div className="col-lg-12 d-flex align-items-start">
                      <i className="bi bi-headset me-4 display-6 text-white"></i>
                      <div>
                        <h4 className="m-0 h5 text-white">Dedicated Support</h4>
                        <p className="text-white opacity-50">Our team is here to assist you every step of the way.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call To Action Section */}
        <section id="call-to-action" className="call-to-action section light-background">
          <div className="content">
            <div className="container">
              <div className="row align-items-center">
                <div className="col-lg-6">
                  <h3>Subscribe To Our Newsletter</h3>
                  <p className="opacity-50">
                    Stay updated with the latest agricultural insights, platform features, and market trends.
                  </p>
                </div>
                <div className="col-lg-6">
                  <NewsletterForm />
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default ServicesPage;
