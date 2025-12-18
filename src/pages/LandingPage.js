import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/layout/Navbar';
import { getHeroImageUrl, getImage } from '../utils/imageUtils';
import NewsletterForm from '../components/common/NewsletterForm';

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, loading } = useAuth();

  

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      const dashboardPath = user.userType === 'ADMIN' ? '/admin/dashboard' :
        user.userType === 'FARMER' ? '/farmer/dashboard' :
          user.userType === 'BUYER' ? '/buyer/dashboard' :
            user.userType === 'STOREKEEPER' ? '/storekeeper/dashboard' :
              '/dashboard';
      navigate(dashboardPath, { replace: true });
    }
  }, [isAuthenticated, user, loading, navigate]);

  

  useEffect(() => {
    const initSwiper = () => {
      document.querySelectorAll(".rangira-swiper").forEach(function (swiperElement) {
        const config = {
          loop: true,
          speed: 600,
          autoplay: {
            delay: 5000
          },
          slidesPerView: "auto",
          pagination: {
            el: ".swiper-pagination",
            type: "bullets",
            clickable: true
          },
          navigation: {
            nextEl: ".js-custom-next",
            prevEl: ".js-custom-prev"
          },
          breakpoints: {
            320: {
              slidesPerView: 1,
              spaceBetween: 40
            },
            1200: {
              slidesPerView: 3,
              spaceBetween: 40
            }
          }
        };

        if (window.Swiper) {
          new window.Swiper(swiperElement, config);
        }
      });
    };

    

    const timer = setTimeout(initSwiper, 100);
    return () => clearTimeout(timer);
  }, []);

  if (!loading && isAuthenticated) {
    return null;
  }

  return (
    <div className="index-page">
      <Navbar />

      <main className="main">
        {}
        <section id="hero" className="hero section dark-background">
          <div id="hero-carousel" className="carousel slide carousel-fade" data-bs-ride="carousel" data-bs-interval="5000">

            <div className="carousel-item active">
              <img src={getHeroImageUrl(1)} alt="" />
              <div className="carousel-container">
                <h2>Dedicated To Building Farms</h2>
                <p>Rwanda's premier digital farming platform. Seamlessly manage crops, warehouses, and transactions in one system.</p>
              </div>
            </div>

            <div className="carousel-item">
              <img src={getHeroImageUrl(2)} alt="" />
              <div className="carousel-container">
                <h2>Digital Farm Management Platform</h2>
                <p>Track crops, manage inventory, and connect with buyers to enhance market linkages.</p>
              </div>
            </div>

            <div className="carousel-item">
              <img src={getHeroImageUrl(3)} alt="" />
              <div className="carousel-container">
                <h2>Empowering Rwandan Farmers</h2>
                <p>Built for Rwanda. Manage agriculture efficiently from Province to Village level.</p>
              </div>
            </div>

            <a className="carousel-control-prev" href="#hero-carousel" role="button" data-bs-slide="prev">
              <span className="carousel-control-prev-icon bi bi-chevron-left" aria-hidden="true"></span>
            </a>

            <a className="carousel-control-next" href="#hero-carousel" role="button" data-bs-slide="next">
              <span className="carousel-control-next-icon bi bi-chevron-right" aria-hidden="true"></span>
            </a>

            <ol className="carousel-indicators">
              <li data-bs-target="#hero-carousel" data-bs-slide-to="0" className="active"></li>
              <li data-bs-target="#hero-carousel" data-bs-slide-to="1"></li>
              <li data-bs-target="#hero-carousel" data-bs-slide-to="2"></li>
            </ol>
          </div>
        </section>

        {/* About Section - Why Choose Us */}
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
                    Rangira Agro Farming is Rwanda's premier digital agricultural management platform, designed to revolutionize how farmers, buyers, and storekeepers interact.
                  </p>

                  <div className="row my-5">
                    <div className="col-lg-12 d-flex align-items-start mb-4">
                      <i className="bi bi-check-circle me-4 display-6 text-white"></i>
                      <div>
                        <h4 className="m-0 h5 text-white">Comprehensive Management</h4>
                        <p className="text-white opacity-50">Track inventory and manage operations in one place.</p>
                      </div>
                    </div>
                    <div className="col-lg-12 d-flex align-items-start mb-4">
                      <i className="bi bi-people me-4 display-6 text-white"></i>
                      <div>
                        <h4 className="m-0 h5 text-white">Direct Connections</h4>
                        <p className="text-white opacity-50">Connect directly with buyers and storekeepers.</p>
                      </div>
                    </div>
                    <div className="col-lg-12 d-flex align-items-start">
                      <i className="bi bi-geo-alt me-4 display-6 text-white"></i>
                      <div>
                        <h4 className="m-0 h5 text-white">Rwanda-Focused</h4>
                        <p className="text-white opacity-50">Built for Rwanda's administrative structure.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About 3 Section - Technology Makes Farming Better */}
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
                <h2 className="content-title mb-4">Technology Makes Farming Better</h2>
                <p className="mb-4">
                  By integrating modern technology into traditional farming practices, we help you achieve better yields, reduce waste, and secure fair prices for your produce.
                </p>
                <ul className="list-unstyled list-check">
                  <li>Real-time market data access</li>
                  <li>Digital inventory management</li>
                  <li>Secure and transparent transactions</li>
                </ul>

                <p><Link to="/contact" className="btn-cta">Get in touch</Link></p>
              </div>
            </div>
          </div>
        </section>

        {/* Services 2 Section - Sliding Carousel */}
        <section id="services-2" className="services-2 section dark-background">
          {/* Section Title */}
          <div className="container section-title" data-aos="fade-up">
            <h2>Services</h2>
            <p>Comprehensive Agricultural Solutions</p>
          </div>{/* End Section Title */}

          <div className="services-carousel-wrap">
            <div className="container">
              <div className="swiper rangira-swiper">
                <button className="navigation-prev js-custom-prev">
                  <i className="bi bi-arrow-left-short"></i>
                </button>
                <button className="navigation-next js-custom-next">
                  <i className="bi bi-arrow-right-short"></i>
                </button>
                <div className="swiper-wrapper">
                  <div className="swiper-slide">
                    <div className="service-item">
                      <div className="service-item-contents">
                        <a href="#">
                          <span className="service-item-category">We do</span>
                          <h2 className="service-item-title">Crop Management</h2>
                        </a>
                      </div>
                      <img src={getImage('img_sq_1.jpg')} alt="Image" className="img-fluid" />
                    </div>
                  </div>
                  <div className="swiper-slide">
                    <div className="service-item">
                      <div className="service-item-contents">
                        <a href="#">
                          <span className="service-item-category">We do</span>
                          <h2 className="service-item-title">Warehousing</h2>
                        </a>
                      </div>
                      <img src={getImage('img_sq_3.jpg')} alt="Image" className="img-fluid" />
                    </div>
                  </div>
                  <div className="swiper-slide">
                    <div className="service-item">
                      <div className="service-item-contents">
                        <a href="#">
                          <span className="service-item-category">We do</span>
                          <h2 className="service-item-title">Market Access</h2>
                        </a>
                      </div>
                      <img src={getImage('img_sq_8.jpg')} alt="Image" className="img-fluid" />
                    </div>
                  </div>

                  <div className="swiper-slide">
                    <div className="service-item">
                      <div className="service-item-contents">
                        <a href="#">
                          <span className="service-item-category">We do</span>
                          <h2 className="service-item-title">Quality Grading</h2>
                        </a>
                      </div>
                      <img src={getImage('img_sq_4.jpg')} alt="Image" className="img-fluid" />
                    </div>
                  </div>
                  <div className="swiper-slide">
                    <div className="service-item">
                      <div className="service-item-contents">
                        <a href="#">
                          <span className="service-item-category">We do</span>
                          <h2 className="service-item-title">Transactions</h2>
                        </a>
                      </div>
                      <img src={getImage('img_sq_5.jpg')} alt="Image" className="img-fluid" />
                    </div>
                  </div>
                  <div className="swiper-slide">
                    <div className="service-item">
                      <div className="service-item-contents">
                        <a href="#">
                          <span className="service-item-category">We do</span>
                          <h2 className="service-item-title">Analytics</h2>
                        </a>
                      </div>
                      <img src={getImage('img_sq_6.jpg')} alt="Image" className="img-fluid" />
                    </div>
                  </div>
                </div>
                <div className="swiper-pagination"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="testimonials-12 testimonials section" id="testimonials">
          <div className="container section-title" data-aos="fade-up">
            <h2>TESTIMONIALS</h2>
            <p>What Our Customers Say</p>
          </div>

          <div className="testimonial-wrap">
            <div className="container">
              <div className="row">
                <div className="col-md-6 mb-4 mb-md-4">
                  <div className="testimonial">
                    <img src={getImage('testimonials/testimonials-1.jpg')} alt="Testimonial author" />
                    <blockquote>
                      <p>
                        “Rangira Agro Farming has transformed how I manage my crops. The inventory tracking system is so easy to use, and I can now connect directly with buyers.”
                      </p>
                    </blockquote>
                    <p className="client-name">Jean Baptiste - Farmer</p>
                  </div>
                </div>
                <div className="col-md-6 mb-4 mb-md-4">
                  <div className="testimonial">
                    <img src={getImage('testimonials/testimonials-2.jpg')} alt="Testimonial author" />
                    <blockquote>
                      <p>
                        “As a cooperative manager, tracking inventory across multiple warehouses was a nightmare. This platform gives me real-time visibility and helps me reduce post-harvest losses significantly.”
                      </p>
                    </blockquote>
                    <p className="client-name">Manager Kimironko - Storekeeper</p>
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

export default LandingPage;
