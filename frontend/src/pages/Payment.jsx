import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import '../App.css';

// Initialize Stripe (only if key is configured)
const stripeConfigured = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY && import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY !== 'pk_test_your_stripe_publishable_key_here';
const stripePromise = stripeConfigured ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) : null;

const PaymentForm = () => {
  const [paymentMethod, setPaymentMethod] = useState(stripeConfigured ? 'card' : 'netbanking');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const bookingData = location.state;
  const stripe = useStripe();
  const elements = useElements();
  const stripeEnabled = stripeConfigured;

  const normalizePaymentMethod = (method) => {
    if (method === 'card') return 'credit_card';
    if (method === 'netbanking') return 'netbanking';
    return method;
  };

  const createPaymentIntent = useCallback(async () => {
    try {
      const response = await api.post('/bookings/create-payment-intent', {
        amount: bookingData.amount,
        paymentMethod: normalizePaymentMethod(paymentMethod)
      });

      if (response.data.success) {
        setClientSecret(response.data.clientSecret);
      } else {
        setError('Failed to initialize payment. Please try again.');
      }
    } catch {
      setError('Failed to initialize payment. Please try again.');
    }
  }, [bookingData?.amount, paymentMethod]);

  useEffect(() => {
    if (!bookingData) {
      navigate('/dashboard');
      return;
    }

    // Create payment intent when component mounts or payment method changes
    createPaymentIntent();
  }, [bookingData, navigate, paymentMethod, createPaymentIntent]);

  const handlePayment = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError('');

    try {
      // Handle "Pay Later" option - no payment processing needed
      if (paymentMethod === 'later') {
        await createBooking(null);
        return;
      }

      // If Stripe is configured, only card payment is supported in this flow
      if (stripeEnabled && paymentMethod !== 'card') {
        setError('Stripe is enabled in this app, so please select Credit/Debit Card payment.');
        setLoading(false);
        return;
      }

      // Use Stripe card payment when available
      if (stripe && elements && paymentMethod === 'card') {
        const cardElement = elements.getElement(CardElement);

        const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: 'Customer Name', // You can get this from user profile
            },
          }
        });

        if (paymentError) {
          setError(paymentError.message);
          setLoading(false);
          return;
        }

        if (paymentIntent.status === 'succeeded') {
          // Create booking after successful payment
          await createBooking(paymentIntent.id);
          return;
        }

        setError('Payment did not complete. Please try again.');
        setLoading(false);
        return;
      }

      // Use mock payment for development or non-Stripe mode
      console.log('Using mock payment flow');
      await new Promise(resolve => setTimeout(resolve, 1500));
      await createBooking(`MOCK_${Date.now()}`);
    } catch {
      setError('Payment failed. Please try again.');
      setLoading(false);
    }
  };

  const createBooking = async (transactionId) => {
    try {
      const response = await api.post('/bookings', {
        locationId: bookingData.location._id,
        slotId: bookingData.slot._id,
        vehicleType: bookingData.vehicleType,
        vehicleNumber: bookingData.vehicleNumber,
        startTime: new Date(`${bookingData.date}T${bookingData.time}:00`).toISOString(),
        duration: bookingData.duration,
        paymentMethod: normalizePaymentMethod(paymentMethod),
        transactionId
      });

      if (response.data.success) {
        navigate(`/receipt?bookingId=${response.data.data._id}`, { state: response.data.data });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
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
              marginBottom: 'var(--spacing-lg)',
              color: 'var(--danger)',
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
                { id: 'later', icon: '⏰', name: 'Pay Later', desc: 'Pay at parking entrance' },
                { id: 'card', icon: '💳', name: 'Card (Mock Razorpay)', desc: 'Visa, Mastercard, Rupay' },
                { id: 'upi', icon: '📱', name: 'UPI (Mock Razorpay)', desc: 'Google Pay, PhonePe, Paytm' },
                { id: 'netbanking', icon: '🏦', name: 'Net Banking (Mock Razorpay)', desc: 'All Indian banks' }
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

            {/* Card Input - only show if Stripe is available */}
            {paymentMethod === 'card' && stripe && (
              <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-md)', fontWeight: '600' }}>
                  Card Details
                </label>
                <div style={{
                  padding: 'var(--spacing-lg)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'rgba(255,255,255,0.05)'
                }}>
                  <CardElement options={cardStyle} />
                </div>
              </div>
            )}

            {stripeEnabled && paymentMethod !== 'card' && (
              <div style={{
                padding: 'var(--spacing-lg)',
                backgroundColor: 'rgba(248, 113, 113, 0.1)',
                border: '1px solid rgba(248, 113, 113, 0.2)',
                color: '#f87171',
                borderRadius: 'var(--radius-lg)',
                marginBottom: 'var(--spacing-lg)'
              }}>
                ⚠️ Stripe is enabled, so only Credit/Debit Card payment is supported in this flow.
              </div>
            )}

            {!stripeConfigured && (
              <div style={{
                padding: 'var(--spacing-lg)',
                backgroundColor: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                color: '#38bdf8',
                borderRadius: 'var(--radius-lg)',
                marginBottom: 'var(--spacing-lg)'
              }}>
                ℹ️ Stripe is not configured. This demo uses a Razorpay-style mock payment flow and will still create your booking.
              </div>
            )}

            {/* Mock payment notice */}
            {!stripe && (
              <div style={{
                padding: 'var(--spacing-lg)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid var(--accent)',
                borderRadius: 'var(--radius-lg)',
                marginBottom: 'var(--spacing-lg)',
                textAlign: 'center'
              }}>
                <p style={{ color: 'var(--accent)', margin: 0, fontWeight: '600' }}>
                  🔧 Development Mode
                </p>
                <p style={{ color: 'rgba(255,255,255,0.7)', margin: 'var(--spacing-sm) 0 0 0', fontSize: '0.9rem' }}>
                  Using mock Razorpay-style payment system. Configure Stripe for production.
                </p>
              </div>
            )}

            <button
              onClick={handlePayment}
              disabled={loading || (paymentMethod !== 'later' && !clientSecret) || (stripeEnabled && paymentMethod !== 'card' && paymentMethod !== 'later') || (stripeEnabled && !stripe && paymentMethod !== 'later')}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', opacity: (loading || (paymentMethod !== 'later' && !clientSecret) || (stripeEnabled && paymentMethod !== 'card' && paymentMethod !== 'later') || (stripeEnabled && !stripe && paymentMethod !== 'later')) ? 0.6 : 1, cursor: (loading || (paymentMethod !== 'later' && !clientSecret) || (stripeEnabled && paymentMethod !== 'card' && paymentMethod !== 'later') || (stripeEnabled && !stripe && paymentMethod !== 'later')) ? 'not-allowed' : 'pointer' }}
            >
              {loading ? '⏳ Processing...' : paymentMethod === 'later' ? 'Confirm Booking (Pay Later) 🎫' : `Pay ₹${bookingData.amount} 🔐`}
            </button>
          </div>

          {/* Security Info */}
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
            <p>🔒 Your payment is secure and encrypted</p>
            <p>Powered by Stripe</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Payment = () => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm />
    </Elements>
  );
};

export default Payment;