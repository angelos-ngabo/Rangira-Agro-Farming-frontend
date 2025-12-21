import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import Navbar from '../components/layout/Navbar';
import WarehouseMap from '../components/maps/WarehouseMap';
import { dataService } from '../services/dataService';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  // Fetch warehouses for map display
  const { data: warehousesData } = useQuery(
    'warehouses-for-contact',
    () => dataService.getWarehouses({ page: 0, size: 100, status: 'ACTIVE' }),
    {
      retry: false,
      refetchOnWindowFocus: false
    }
  );

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement form submission
    console.log('Form submitted:', formData);
    alert('Thank you for your message! We will get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
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
            <h1>Contact</h1>

            <nav className="breadcrumbs">
              <ol>
                <li><Link to="/">Home</Link></li>
                <li className="current">Contact</li>
              </ol>
            </nav>
          </div>
        </div>

        {/* Contact Section */}
        <section id="contact" className="contact section">
          <div className="mb-5" style={{ height: '400px', width: '100%' }}>
            <WarehouseMap warehouses={warehousesData?.data?.content || []} />
          </div>

          <div className="container" data-aos="fade">
            <div className="row gy-5 gx-lg-5">
              <div className="col-lg-4">
                <div className="info">
                  <h3>Get in touch</h3>
                  <p>We are here to help you with any questions regarding our services and platform.</p>

                  <div className="info-item d-flex">
                    <i className="bi bi-geo-alt flex-shrink-0"></i>
                    <div>
                      <h4>Location:</h4>
                      <p>Kigali, Rwanda</p>
                    </div>
                  </div>

                  <div className="info-item d-flex">
                    <i className="bi bi-envelope flex-shrink-0"></i>
                    <div>
                      <h4>Email:</h4>
                      <p>info@rangiraagro.com</p>
                    </div>
                  </div>

                  <div className="info-item d-flex">
                    <i className="bi bi-phone flex-shrink-0"></i>
                    <div>
                      <h4>Call:</h4>
                      <p>+250 788 123 456</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-8">
                <form onSubmit={handleSubmit} className="php-email-form">
                  <div className="row">
                    <div className="col-md-6 form-group">
                      <input
                        type="text"
                        name="name"
                        className="form-control"
                        id="name"
                        placeholder="Your Name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-6 form-group mt-3 mt-md-0">
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        id="email"
                        placeholder="Your Email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="form-group mt-3">
                    <input
                      type="text"
                      className="form-control"
                      name="subject"
                      id="subject"
                      placeholder="Subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group mt-3">
                    <textarea
                      className="form-control"
                      name="message"
                      placeholder="Message"
                      required
                      value={formData.message}
                      onChange={handleChange}
                    ></textarea>
                  </div>
                  <div className="my-3">
                    {/* Loading and error messages can be added here */}
                  </div>
                  <div className="text-center">
                    <button type="submit">Send Message</button>
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

export default ContactPage;
