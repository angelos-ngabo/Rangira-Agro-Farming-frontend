import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { getImage } from '../utils/imageUtils';


const AboutPage = () => {
  return (
    <div className="about-page">
      <Navbar />

      <main className="main">
        {/* Page Title */}
        <div
          className="page-title dark-background"
          data-aos="fade"
          style={{ backgroundImage: `url(${getImage('tea-plantation-background.jpg')})` }}
        >
          <div className="container position-relative">
            <h1>About</h1>
            <p>Rangira Agro Farming: Revolutionizing agriculture in Rwanda through digital innovation.</p>
            <nav className="breadcrumbs">
              <ol>
                <li><Link to="/">Home</Link></li>
                <li className="current">About</li>
              </ol>
            </nav>
          </div>
        </div>

        {/* About 3 Section */}
        <section id="about-3" className="about-3 section">
          <div className="container">
            <div className="row gy-4 justify-content-between align-items-center">
              <div className="col-lg-6 order-lg-2 position-relative" data-aos="zoom-out">
                <img src={getImage('img_sq_1.jpg')} alt="Image" className="img-fluid" />
                <a href="https://www.youtube.com/watch?v=pPOlaiQqaEw" className="glightbox pulsating-play-btn">
                  <span className="play"><i className="bi bi-play-fill"></i></span>
                </a>
              </div>
              <div className="col-lg-5 order-lg-1" data-aos="fade-up" data-aos-delay="100">
                <h2 className="content-title mb-4">Empowering Farmers, Connecting Markets</h2>
                <p className="mb-4">
                  Rangira Agro Farming is Rwanda's premier digital agricultural management platform.
                  We are dedicated to transforming the agricultural landscape by providing tools that
                  simplify crop management, optimize warehouse storage, and facilitate transparent transactions.
                </p>
                <ul className="list-unstyled list-check">
                  <li>Comprehensive Crop Management</li>
                  <li>Real-time Warehouse Inventory Tracking</li>
                  <li>Direct Farmer-to-Buyer Connections</li>
                  <li>Transparent Rating & Review System</li>
                </ul>

                <p><Link to="/contact" className="btn-cta">Get in touch</Link></p>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="team-15 team section" id="team">
          <div className="container section-title" data-aos="fade-up">
            <h2>Team</h2>
            <p>Meet the dedicated team behind Rangira Agro Farming</p>
          </div>

          <div className="content">
            <div className="container">
              <div className="row">
                <div className="col-lg-3 col-md-6 mb-4">
                  <div className="person">
                    <figure>
                      <img src={getImage('team/team-1.jpg')} alt="Image" className="img-fluid" />
                      <div className="social">
                        <a href="#"><span className="bi bi-facebook"></span></a>
                        <a href="#"><span className="bi bi-twitter-x"></span></a>
                        <a href="#"><span className="bi bi-linkedin"></span></a>
                      </div>
                    </figure>
                    <div className="person-contents">
                      <h3>Ngabo Angelos</h3>
                      <span className="position">Founder & CEO</span>
                    </div>
                  </div>
                </div>

                <div className="col-lg-3 col-md-6 mb-4">
                  <div className="person">
                    <figure>
                      <img src={getImage('team/team-2.jpg')} alt="Image" className="img-fluid" />
                      <div className="social">
                        <a href="#"><span className="bi bi-facebook"></span></a>
                        <a href="#"><span className="bi bi-twitter-x"></span></a>
                        <a href="#"><span className="bi bi-linkedin"></span></a>
                      </div>
                    </figure>
                    <div className="person-contents">
                      <h3>Aline Uwase</h3>
                      <span className="position">Operations Manager</span>
                    </div>
                  </div>
                </div>

                <div className="col-lg-3 col-md-6 mb-4">
                  <div className="person">
                    <figure>
                      <img src={getImage('team/team-3.jpg')} alt="Image" className="img-fluid" />
                      <div className="social">
                        <a href="#"><span className="bi bi-facebook"></span></a>
                        <a href="#"><span className="bi bi-twitter-x"></span></a>
                        <a href="#"><span className="bi bi-linkedin"></span></a>
                      </div>
                    </figure>
                    <div className="person-contents">
                      <h3>Patrick Mugisha</h3>
                      <span className="position">Lead Developer</span>
                    </div>
                  </div>
                </div>

                <div className="col-lg-3 col-md-6 mb-4">
                  <div className="person">
                    <figure>
                      <img src={getImage('team/team-4.jpg')} alt="Image" className="img-fluid" />
                      <div className="social">
                        <a href="#"><span className="bi bi-facebook"></span></a>
                        <a href="#"><span className="bi bi-twitter-x"></span></a>
                        <a href="#"><span className="bi bi-linkedin"></span></a>
                      </div>
                    </figure>
                    <div className="person-contents">
                      <h3>Diane Mutesi</h3>
                      <span className="position">Accountant</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default AboutPage;
