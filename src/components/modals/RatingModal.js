import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { useMutation, useQueryClient } from 'react-query';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import './Modal.css';

const RatingModal = ({ isOpen, onClose, transaction }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [ratingType, setRatingType] = useState('QUALITY');

  const createRatingMutation = useMutation(
    (data) => dataService.createRating(data),
    {
      onSuccess: () => {
        toast.success('Thank you for your rating!');
        queryClient.invalidateQueries(['buyerTransactions', user?.id]);
        queryClient.invalidateQueries(['ratings']);
        onClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to submit rating');
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!transaction?.seller?.id) {
      toast.error('Seller information not available');
      return;
    }

    const ratingData = {
      raterId: user?.id,
      ratedUserId: transaction.seller.id,
      transactionId: transaction.id,
      ratingScore: rating,
      ratingType: ratingType,
      comment: comment.trim() || null
    };

    createRatingMutation.mutate(ratingData);
  };

  if (!isOpen || !transaction) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2>Rate Your Purchase</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div style={{ marginBottom: '24px' }}>
            <p style={{ marginBottom: '12px', color: '#666' }}>
              How would you rate your purchase of <strong>{transaction.inventory?.cropType?.cropName || 'this product'}</strong> from <strong>{transaction.seller?.firstName} {transaction.seller?.lastName}</strong>?
            </p>
          </div>

          {}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#333' }}>
              Overall Rating <span style={{ color: '#e74c3c' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="star-button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    fontSize: '40px',
                    color: star <= (hoveredRating || rating) ? '#ffc107' : '#ddd',
                    transition: 'color 0.2s',
                  }}
                >
                  <Star size={40} fill={star <= (hoveredRating || rating) ? '#ffc107' : 'none'} />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p style={{ textAlign: 'center', marginTop: '8px', color: '#666', fontSize: '14px' }}>
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            )}
          </div>

          {}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
              What are you rating?
            </label>
            <select
              value={ratingType}
              onChange={(e) => setRatingType(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="QUALITY">Product Quality</option>
              <option value="RELIABILITY">Seller Reliability</option>
              <option value="COMMUNICATION">Communication</option>
              <option value="PAYMENT">Payment Process</option>
            </select>
          </div>

          {}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
              Additional Comments (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this purchase..."
              rows={4}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          {}
          <div style={{ 
            background: '#f8f9fa', 
            padding: '16px', 
            borderRadius: '6px', 
            marginBottom: '24px',
            fontSize: '14px'
          }}>
            <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#333' }}>Transaction Details:</p>
            <p style={{ margin: '4px 0', color: '#666' }}>
              <strong>Transaction Code:</strong> {transaction.transactionCode}
            </p>
            <p style={{ margin: '4px 0', color: '#666' }}>
              <strong>Product:</strong> {transaction.inventory?.cropType?.cropName}
            </p>
            <p style={{ margin: '4px 0', color: '#666' }}>
              <strong>Quantity:</strong> {transaction.quantityKg} {transaction.inventory?.cropType?.measurementUnit || 'KG'}
            </p>
            <p style={{ margin: '4px 0', color: '#666' }}>
              <strong>Amount:</strong> RWF {transaction.totalAmount?.toLocaleString()}
            </p>
          </div>

          <div className="modal-footer" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                background: 'white',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createRatingMutation.isLoading || rating === 0}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px',
                background: rating === 0 ? '#ccc' : '#116530',
                color: 'white',
                cursor: rating === 0 ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              {createRatingMutation.isLoading ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RatingModal;

