import React, { useState } from 'react';
import { dataService } from '../../services/dataService';
import toast from 'react-hot-toast';
import './NewsletterForm.css';

const NewsletterForm = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await dataService.subscribeNewsletter(email);
      toast.success('Successfully subscribed to our newsletter!');
      setEmail('');
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to subscribe';
      if (message.includes('already subscribed')) {
        toast.error('This email is already subscribed to our newsletter');
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="form-subscribe php-email-form" onSubmit={handleSubmit}>
      <div className="form-group d-flex align-items-stretch">
        <input
          type="email"
          name="email"
          className="form-control h-100"
          placeholder="Enter your e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
        <input
          type="submit"
          className="btn btn-secondary px-4 newsletter-subscribe-btn"
          value={loading ? 'Subscribing...' : 'Subscribe'}
          disabled={loading}
        />
      </div>
    </form>
  );
};

export default NewsletterForm;

