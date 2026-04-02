import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../App.css';

const Receipt = () => {
  const [bookingData, setBookingData] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state) {
      setBookingData(location.state);
    }
  }, [location.state]);

  const handleDownloadReceipt = () => {
    window.print();
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!bookingData) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <div className="page-content">
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <p style={{ fontSize: '1.1rem' }}>No booking data found</p>
            <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ marginTop: 'var(--spacing-lg)' }}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">
        <div className="container-sm" style={{ maxWidth: '650px', margin: '2rem auto' }}>
          {/* Success Header */}
          <div className="card card-glass" style={{ textAlign: 'center', marginBottom: 'var(--spacing-3xl)', position: 'relative' }}>
            <div style={{ fontSize: '4rem', marginBottom: 'var(--spacing-md)', animation: 'scaleIn 0.5s ease-out' }}>✅</div>
            <h1 style={{ fontSize: '2rem', marginBottom: 'var(--spacing-md)',  background: 'linear-gradient(135deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Booking Confirmed!</h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 'var(--spacing-lg)' }}>Your parking slot has been reserved successfully</p>
            <div style={{ padding: 'var(--spacing-md)', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--accent)' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--accent)', margin: 0 }}>Booking ID: <span style={{ fontWeight: '600' }}>{bookingData._id}</span></p>
            </div>
          </div>

          {/* Booking Summary Card */}
          <div className="card card-glass" style={{ marginBottom: 'var(--spacing-2xl)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-lg)' }}>📋 Booking Summary</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 'var(--spacing-md)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>🏢 Location</span>
                <span style={{ fontWeight: '500' }}>{bookingData.locationId?.name || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 'var(--spacing-md)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>🅿️ Slot Number</span>
                <span style={{ fontWeight: '500' }}>{bookingData.slotId?.slotNumber || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 'var(--spacing-md)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>🚗 Vehicle</span>
                <span style={{ fontWeight: '500' }}>{bookingData.vehicleNumber}</span>
              </div>
            </div>
          </div>

          {/* Timing Details */}
          <div className="card card-glass" style={{ marginBottom: 'var(--spacing-2xl)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-lg)' }}>⏱️ Parking Duration</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 'var(--spacing-md)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>📅 Check-in</span>
                <span style={{ fontWeight: '500' }}>{formatDateTime(bookingData.startTime)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 'var(--spacing-md)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>📅 Check-out</span>
                <span style={{ fontWeight: '500' }}>{formatDateTime(bookingData.endTime)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>⏰ Duration</span>
                <span style={{ fontWeight: '500' }}>{bookingData.duration} hour{bookingData.duration > 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="card card-glass" style={{ marginBottom: 'var(--spacing-2xl)', backgroundColor: 'rgba(34, 197, 94, 0.05)', borderColor: 'rgba(34, 197, 94, 0.2)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-lg)' }}>💳 Payment Details</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 'var(--spacing-md)', borderBottom: '1px solid rgba(34, 197, 94, 0.2)' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>Amount</span>
                <span style={{ fontWeight: '500' }}>₹{bookingData.totalAmount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 'var(--spacing-md)', borderBottom: '1px solid rgba(34, 197, 94, 0.2)' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>Status</span>
                <span style={{ fontWeight: '600', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>✓</span> {bookingData.paymentStatus}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>Transaction ID</span>
                <span style={{ fontWeight: '500', fontSize: '0.85rem', fontFamily: 'monospace' }}>{bookingData.transactionId || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          {bookingData.qrCode && (
            <div className="card card-glass" style={{ textAlign: 'center', marginBottom: 'var(--spacing-2xl)' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-lg)' }}>📱 Entry QR Code</h2>
              <img 
                src={bookingData.qrCode} 
                alt="QR Code" 
                style={{ 
                  maxWidth: '200px', 
                  width: '100%',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--spacing-md)',
                  backgroundColor: 'white',
                  marginBottom: 'var(--spacing-md)'
                }}
              />
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', margin: 0 }}>Show this QR code at parking entrance for quick check-in</p>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-3xl)' }}>
            <button 
              onClick={handleDownloadReceipt} 
              className="btn btn-outline btn-lg"
              style={{ flex: 1 }}
            >
              📥 Download Receipt
            </button>
            <button 
              onClick={() => navigate('/dashboard')} 
              className="btn btn-primary btn-lg"
              style={{ flex: 1 }}
            >
              Return Dashboard
            </button>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', paddingTop: 'var(--spacing-2xl)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <p>🎉 Thank you for using ParkEase!</p>
            <p>Have a safe journey! 😊</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Receipt;