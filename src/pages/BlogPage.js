import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { getImage } from '../utils/imageUtils';
import './BlogPage.css';

const BlogPage = () => {
    return (
        <div className="blog-page">
            <Navbar />

            <main className="main">
                {/* Page Title */}
                <div
                    className="page-title dark-background"
                    data-aos="fade"
                    style={{ backgroundImage: `url(${getImage('tea-plantation-background.jpg')})` }}
                >
                    <div className="container position-relative">
                        <h1>Blog</h1>
                        <p>
                            Home / Blog
                        </p>
                        <nav className="breadcrumbs">
                            <ol>
                                <li><Link to="/">Home</Link></li>
                                <li className="current">Blog</li>
                            </ol>
                        </nav>
                    </div>
                </div>

                {/* Blog Posts 2 Section */}
                <section id="blog-posts-2" className="blog-posts-2 section">
                    <div className="container">
                        <div className="row gy-4">

                            <div className="col-lg-4">
                                <article className="position-relative h-100">
                                    <div className="post-img position-relative overflow-hidden">
                                        <img src={getImage('blog/blog-1.jpg')} className="img-fluid" alt="" />
                                    </div>
                                    <div className="meta d-flex align-items-end">
                                        <span className="post-date"><span>12</span>Dec</span>
                                        <div className="d-flex align-items-center">
                                            <i className="bi bi-person"></i> <span className="ps-2">Dr. Jean Bosco</span>
                                        </div>
                                        <span className="px-3 text-black-50">/</span>
                                        <div className="d-flex align-items-center">
                                            <i className="bi bi-folder2"></i> <span className="ps-2">Agriculture</span>
                                        </div>
                                    </div>
                                    <div className="post-content d-flex flex-column">
                                        <h3 className="post-title">Modern Irrigation Techniques for Rwandan Hillsides</h3>
                                        <Link to="/blog/1" className="readmore stretched-link"><span>Read More</span><i className="bi bi-arrow-right"></i></Link>
                                    </div>
                                </article>
                            </div>

                            <div className="col-lg-4">
                                <article className="position-relative h-100">
                                    <div className="post-img position-relative overflow-hidden">
                                        <img src={getImage('blog/blog-2.jpg')} className="img-fluid" alt="" />
                                    </div>
                                    <div className="meta d-flex align-items-end">
                                        <span className="post-date"><span>19</span>Mar</span>
                                        <div className="d-flex align-items-center">
                                            <i className="bi bi-person"></i> <span className="ps-2">Sarah Uwase</span>
                                        </div>
                                        <span className="px-3 text-black-50">/</span>
                                        <div className="d-flex align-items-center">
                                            <i className="bi bi-folder2"></i> <span className="ps-2">Economics</span>
                                        </div>
                                    </div>
                                    <div className="post-content d-flex flex-column">
                                        <h3 className="post-title">Understanding Seasonal Price Fluctuations in Maize Markets</h3>
                                        <Link to="/blog/2" className="readmore stretched-link"><span>Read More</span><i className="bi bi-arrow-right"></i></Link>
                                    </div>
                                </article>
                            </div>

                            <div className="col-lg-4">
                                <article className="position-relative h-100">
                                    <div className="post-img position-relative overflow-hidden">
                                        <img src={getImage('blog/blog-3.jpg')} className="img-fluid" alt="" />
                                    </div>
                                    <div className="meta d-flex align-items-end">
                                        <span className="post-date"><span>24</span>Jun</span>
                                        <div className="d-flex align-items-center">
                                            <i className="bi bi-person"></i> <span className="ps-2">Eric Mugisha</span>
                                        </div>
                                        <span className="px-3 text-black-50">/</span>
                                        <div className="d-flex align-items-center">
                                            <i className="bi bi-folder2"></i> <span className="ps-2">Technology</span>
                                        </div>
                                    </div>
                                    <div className="post-content d-flex flex-column">
                                        <h3 className="post-title">How Digital Warehousing is Reducing Post-Harvest Losses</h3>
                                        <Link to="/blog/3" className="readmore stretched-link"><span>Read More</span><i className="bi bi-arrow-right"></i></Link>
                                    </div>
                                </article>
                            </div>

                            <div className="col-lg-4">
                                <article className="position-relative h-100">
                                    <div className="post-img position-relative overflow-hidden">
                                        <img src={getImage('blog/blog-4.jpg')} className="img-fluid" alt="" />
                                    </div>
                                    <div className="meta d-flex align-items-end">
                                        <span className="post-date"><span>05</span>Aug</span>
                                        <div className="d-flex align-items-center">
                                            <i className="bi bi-person"></i> <span className="ps-2">Alice Mutesi</span>
                                        </div>
                                        <span className="px-3 text-black-50">/</span>
                                        <div className="d-flex align-items-center">
                                            <i className="bi bi-folder2"></i> <span className="ps-2">Sustainability</span>
                                        </div>
                                    </div>
                                    <div className="post-content d-flex flex-column">
                                        <h3 className="post-title">Sustainable Farming Practices for Smallholder Farmers</h3>
                                        <Link to="/blog/4" className="readmore stretched-link"><span>Read More</span><i className="bi bi-arrow-right"></i></Link>
                                    </div>
                                </article>
                            </div>

                            <div className="col-lg-4">
                                <article className="position-relative h-100">
                                    <div className="post-img position-relative overflow-hidden">
                                        <img src={getImage('blog/blog-5.jpg')} className="img-fluid" alt="" />
                                    </div>
                                    <div className="meta d-flex align-items-end">
                                        <span className="post-date"><span>17</span>Sep</span>
                                        <div className="d-flex align-items-center">
                                            <i className="bi bi-person"></i> <span className="ps-2">David Karekezi</span>
                                        </div>
                                        <span className="px-3 text-black-50">/</span>
                                        <div className="d-flex align-items-center">
                                            <i className="bi bi-folder2"></i> <span className="ps-2">Policy</span>
                                        </div>
                                    </div>
                                    <div className="post-content d-flex flex-column">
                                        <h3 className="post-title">New Government Subsidies for Fertilizers in 2025</h3>
                                        <Link to="/blog/5" className="readmore stretched-link"><span>Read More</span><i className="bi bi-arrow-right"></i></Link>
                                    </div>
                                </article>
                            </div>

                            <div className="col-lg-4">
                                <article className="position-relative h-100">
                                    <div className="post-img position-relative overflow-hidden">
                                        <img src={getImage('blog/blog-6.jpg')} className="img-fluid" alt="" />
                                    </div>
                                    <div className="meta d-flex align-items-end">
                                        <span className="post-date"><span>07</span>Dec</span>
                                        <div className="d-flex align-items-center">
                                            <i className="bi bi-person"></i> <span className="ps-2">Grace Umutoni</span>
                                        </div>
                                        <span className="px-3 text-black-50">/</span>
                                        <div className="d-flex align-items-center">
                                            <i className="bi bi-folder2"></i> <span className="ps-2">Education</span>
                                        </div>
                                    </div>
                                    <div className="post-content d-flex flex-column">
                                        <h3 className="post-title">Training the Next Generation of Agri-Entrepreneurs</h3>
                                        <Link to="/blog/6" className="readmore stretched-link"><span>Read More</span><i className="bi bi-arrow-right"></i></Link>
                                    </div>
                                </article>
                            </div>

                        </div>
                    </div>
                </section>

                {/* Blog Pagination Section */}
                <section id="blog-pagination" className="blog-pagination section">
                    <div className="container">
                        <div className="d-flex justify-content-center">
                            <ul>
                                <li><a href="#"><i className="bi bi-chevron-left"></i></a></li>
                                <li><a href="#">1</a></li>
                                <li><a href="#" className="active">2</a></li>
                                <li><a href="#">3</a></li>
                                <li><a href="#">4</a></li>
                                <li>...</li>
                                <li><a href="#">10</a></li>
                                <li><a href="#"><i className="bi bi-chevron-right"></i></a></li>
                            </ul>
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

export default BlogPage;
