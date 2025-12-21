import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { getImage } from '../utils/imageUtils';
import './TestimonialsPage.css';

const TestimonialsPage = () => {
    return (
        <div className="testimonials-page">
            <Navbar />

            <main className="main">
                {/* Page Title */}
                <div
                    className="page-title dark-background"
                    data-aos="fade"
                    style={{ backgroundImage: `url(${getImage('tea-plantation-background.jpg')})` }}
                >
                    <div className="container position-relative">
                        <h1>Testimonials</h1>
                        <p>
                            Home / Testimonials
                        </p>
                        <nav className="breadcrumbs">
                            <ol>
                                <li><Link to="/">Home</Link></li>
                                <li className="current">Testimonials</li>
                            </ol>
                        </nav>
                    </div>
                </div>

                {/* Testimonials Section */}
                <section className="testimonials-12 testimonials section" id="testimonials">
                    {/* Section Title */}
                    <div className="container section-title" data-aos="fade-up">
                        <h2>TESTIMONIALS</h2>
                        <p>What Our Users Say</p>
                    </div>{/* End Section Title */}

                    <div className="testimonial-wrap">
                        <div className="container">
                            <div className="row">
                                <div className="col-md-6 mb-4 mb-md-4">
                                    <div className="testimonial">
                                        <img src={getImage('testimonials/testimonials-1.jpg')} alt="Testimonial author" />
                                        <blockquote>
                                            <p>
                                                “Rangira Agro Farming has completely transformed how I sell my harvest. I used to struggle to find buyers, but now I can connect directly with them and get fair prices for my maize.”
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
                                <div className="col-md-6 mb-4 mb-md-4">
                                    <div className="testimonial">
                                        <img src={getImage('testimonials/testimonials-3.jpg')} alt="Testimonial author" />
                                        <blockquote>
                                            <p>
                                                “The transparency this platform offers is unmatched. I can see the quality ratings of the produce before I buy, and the secure transaction system gives me peace of mind.”
                                            </p>
                                        </blockquote>
                                        <p className="client-name">Robert Nkurunziza - Buyer</p>
                                    </div>
                                </div>
                                <div className="col-md-6 mb-4 mb-md-4">
                                    <div className="testimonial">
                                        <img src={getImage('testimonials/testimonials-4.jpg')} alt="Testimonial author" />
                                        <blockquote>
                                            <p>
                                                “I highly recommend Rangira Agro Farming to any farmer looking to modernize their business. The tools are easy to use, even on a mobile phone, and the support team is always helpful.”
                                            </p>
                                        </blockquote>
                                        <p className="client-name">Marie Uwimana - Farmer</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>{/* /Testimonials Section */}

                {/* Call To Action Section */}
                <section id="call-to-action" className="call-to-action section light-background">
                    <div className="content">
                        <div className="container">
                            <div className="row align-items-center">
                                <div className="col-lg-6">
                                    <h3>Subscribe To Our Newsletter</h3>
                                    <p className="opacity-50">
                                        Stay updated with the latest agricultural insights, platform features, and market trends from Rangira Agro Farming.
                                    </p>
                                </div>
                                <div className="col-lg-6">
                                    <form action="" className="form-subscribe php-email-form">
                                        <div className="form-group d-flex align-items-stretch">
                                            <input type="email" name="email" className="form-control h-100" placeholder="Enter your e-mail" />
                                            <input type="submit" className="btn btn-secondary px-4" value="Subscribe" />
                                        </div>
                                        <div className="loading">Loading</div>
                                        <div className="error-message"></div>
                                        <div className="sent-message">
                                            Your subscription request has been sent. Thank you!
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

            </main>
        </div>
    );
};

export default TestimonialsPage;
