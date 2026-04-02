import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
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
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">
        <div className="container-sm" style={{ maxWidth: '500px', margin: '2rem auto' }}>
          {/* Payment Header Card */}
          <div className="card card-glass" style={{ marginBottom: 'var(--spacing-3xl)' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: 'var(--spacing-lg)', textAlign: 'center' }}>💳 Complete Payment</h1>
          </div>

          {/* Booking Details */}
          <div className="card card-glass" style={{ marginBottom: 'var(--spacing-3xl)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-lg)' }}>Booking Details</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 'var(--spacing-md)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>📍 Location</span>
                <span style={{ fontWeight: '500' }}>{bookingData.location.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 'var(--spacing-md)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>🅿️ Slot</span>
                <span style={{ fontWeight: '500' }}>{bookingData.slot.slotNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 'var(--spacing-md)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>🚗 Vehicle</span>
                <span style={{ fontWeight: '500' }}>{bookingData.vehicleNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 'var(--spacing-md)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>📅 Date & Time</span>
                <span style={{ fontWeight: '500' }}>{bookingData.date} {bookingData.time}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 'var(--spacing-md)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>⏱️ Duration</span>
                <span style={{ fontWeight: '500' }}>{bookingData.duration} hour{bookingData.duration > 1 ? 's' : ''}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--spacing-md)', paddingTop: 'var(--spacing-md)', borderTop: '2px solid var(--primary)' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>Total Amount</span>
                <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)' }}>₹{bookingData.amount}</span>
              </div>
            </div>
          </div>

          {error && (
            <div style={{ 
              padding: 'var(--spacing-md)', 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid var(--danger)',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--danger)',
              marginBottom: 'var(--spacing-lg)',
              fontSize: '0.9rem'
            }}>
              {error}
            </div>
          )}

          {/* Payment Methods */}
          <div className="card card-glass" style={{ marginBottom: 'var(--spacing-3xl)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-lg)' }}>Select Payment Method</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-2xl)' }}>
              {[
                { id: 'upi', icon: '📱', name: 'UPI', desc: 'Google Pay, PhonePe, Paytm' },
                { id: 'credit_card', icon: '💳', name: 'Credit Card', desc: 'Visa, Mastercard, Rupay' },
                { id: 'debit_card', icon: '🏦', name: 'Debit Card', desc: 'All Indian banks' },
                { id: 'wallet', icon: '👛', name: 'Digital Wallet', desc: 'Paytm, Amazon Pay' }
              ].map((method) => (
                <div
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  style={{
                    padding: 'var(--spacing-lg)',
                    border: paymentMethod === method.id ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: paymentMethod === method.id ? 'rgba(0, 198, 255, 0.1)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-base)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-lg)'
                  }}
                >
                  <span style={{ fontSize: '1.8rem' }}>{method.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{method.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>{method.desc}</div>
                  </div>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.3)',
                    backgroundColor: paymentMethod === method.id ? 'var(--primary)' : 'transparent'
                  }} />
                </div>
              ))}
            </div>

            <button
              onClick={handlePayment}
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? '⏳ Processing Payment...' : `Pay ₹${bookingData.amount} 🔐`}
            </button>
          </div>

          {/* Security Info */}
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
            <p>🔒 Your payment is secure and encrypted</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;