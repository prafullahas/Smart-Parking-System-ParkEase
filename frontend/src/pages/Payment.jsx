import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import '../App.css';

const Payment = () => {
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const bookingData = location.state;

  useEffect(() => {
    if (!bookingData) {
      navigate('/dashboard');
    }
  }, [bookingData, navigate]);

  const handlePayment = async () => {
    if (!bookingData) return;

    setLoading(true);
    setError('');

    try {
      // Create booking with payment
      const response = await api.post('/bookings', {
        locationId: bookingData.location._id,
        slotId: bookingData.slot._id,
        vehicleType: bookingData.vehicleType,
        vehicleNumber: bookingData.vehicleNumber,
        startTime: new Date(`${bookingData.date}T${bookingData.time}:00Z`).toISOString(),
        duration: bookingData.duration,
        paymentMethod
      });

      if (response.data.success) {
        // Navigate to receipt page with booking details
        navigate('/receipt', { state: response.data.data });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!bookingData) {
    return <div className="loading">Redirecting...</div>;
  }

  return (
    <div className="payment-page">
      <header className="payment-header">
        <h1>Payment</h1>
      </header>

      <main className="payment-main">
        <div className="booking-details">
          <h2>Booking Details</h2>
          <div className="detail-row">
            <span>Location:</span>
            <span>{bookingData.location.name}</span>
          </div>
          <div className="detail-row">
            <span>Slot:</span>
            <span>{bookingData.slot.slotNumber} ({bookingData.slot.floor} Floor)</span>
          </div>
          <div className="detail-row">
            <span>Vehicle:</span>
            <span>{bookingData.vehicleType} - {bookingData.vehicleNumber}</span>
          </div>
          <div className="detail-row">
            <span>Date & Time:</span>
            <span>{bookingData.date} at {bookingData.time}</span>
          </div>
          <div className="detail-row">
            <span>Duration:</span>
            <span>{bookingData.duration} hour{bookingData.duration > 1 ? 's' : ''}</span>
          </div>
          <div className="detail-row total">
            <span>Total Amount:</span>
            <span>₹{bookingData.amount}</span>
          </div>
        </div>

        <div className="payment-section">
          <h2>Select Payment Method</h2>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="payment-methods">
            <div 
              className={`payment-option ${paymentMethod === 'upi' ? 'selected' : ''}`}
              onClick={() => setPaymentMethod('upi')}
            >
              <h3>UPI</h3>
              <p>Google Pay, PhonePe, Paytm</p>
            </div>
            
            <div 
              className={`payment-option ${paymentMethod === 'credit_card' ? 'selected' : ''}`}
              onClick={() => setPaymentMethod('credit_card')}
            >
              <h3>Credit Card</h3>
              <p>Visa, Mastercard, Rupay</p>
            </div>
            
            <div 
              className={`payment-option ${paymentMethod === 'debit_card' ? 'selected' : ''}`}
              onClick={() => setPaymentMethod('debit_card')}
            >
              <h3>Debit Card</h3>
              <p>All Indian banks</p>
            </div>
            
            <div 
              className={`payment-option ${paymentMethod === 'wallet' ? 'selected' : ''}`}
              onClick={() => setPaymentMethod('wallet')}
            >
              <h3>Wallet</h3>
              <p>Paytm, Amazon Pay</p>
            </div>
          </div>

          <button 
            onClick={handlePayment} 
            disabled={loading} 
            className="pay-button"
          >
            {loading ? 'Processing Payment...' : `Pay ₹${bookingData.amount}`}
          </button>
        </div>
      </main>
    </div>
  );
};

export default Payment;