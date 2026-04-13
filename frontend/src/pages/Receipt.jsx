import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import '../App.css';

const Receipt = () => {
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const fetchBooking = async (bookingId) => {
    if (!bookingId) return;
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/bookings/${bookingId}`);
      if (response.data.success) {
        setBookingData(response.data.data);
      } else {
        setError('Unable to load receipt. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load receipt.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location.state) {
      setBookingData(location.state);
      return;
    }

    const bookingId = searchParams.get('bookingId');
    if (bookingId) {
      fetchBooking(bookingId);
      return;
    }

    navigate('/dashboard');
  }, [location.state, searchParams, navigate]);

  // Poll for booking status updates every 30 seconds
  useEffect(() => {
    if (!bookingData?._id) return;

    const pollBookingStatus = async () => {
      try {
        const response = await api.get(`/bookings/${bookingData._id}`);
        if (response.data.success) {
          const updatedBooking = response.data.data;
          const currentStatus = bookingData.status || 'active';
          const updatedStatus = updatedBooking.status || 'active';
          if (currentStatus !== updatedStatus) {
            setBookingData(updatedBooking);
          }
        }
      } catch (err) {
        console.error('Error polling booking status:', err);
      }
    };

    const interval = setInterval(pollBookingStatus, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [bookingData?._id, bookingData?.status]);

  if (loading) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <div className="page-content">
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <p style={{ fontSize: '1.1rem' }}>Loading receipt...</p>
          </div>
        </div>
      </div>
    );
  }

  const handleCancelBooking = async () => {
    if (!bookingData?._id) return;
    
    if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.put(`/bookings/${bookingData._id}/cancel`);
      if (response.data.success) {
        setBookingData(prev => ({ ...prev, status: 'cancelled', cancelledAt: new Date() }));
        alert('Booking cancelled successfully');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = () => {
    // Create a print-friendly receipt
    const printWindow = window.open('', '_blank');
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Parking Receipt - ${bookingData._id}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 20px;
              background: white;
              color: #1a2744;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .receipt-container {
              max-width: 400px;
              width: 100%;
              text-align: center;
              border: 2px solid #00c6ff;
              border-radius: 15px;
              padding: 30px;
              background: white;
              box-shadow: 0 10px 30px rgba(0, 198, 255, 0.2);
            }
            .header {
              margin-bottom: 30px;
            }
            .header h1 {
              font-size: 28px;
              font-weight: 800;
              color: #00c6ff;
              margin: 0 0 10px 0;
              background: linear-gradient(135deg, #00c6ff, #667eea);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
            .header p {
              font-size: 14px;
              color: #666;
              margin: 0;
            }
            .qr-section {
              margin: 30px 0;
            }
            .qr-code {
              max-width: 200px;
              width: 100%;
              border-radius: 10px;
              padding: 10px;
              background: white;
              border: 2px solid #eee;
              margin-bottom: 20px;
            }
            .details {
              text-align: left;
              margin-top: 30px;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #eee;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .detail-label {
              font-weight: 600;
              color: #666;
              font-size: 14px;
            }
            .detail-value {
              font-weight: 500;
              color: #1a2744;
              font-size: 14px;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px solid #00c6ff;
              font-size: 12px;
              color: #666;
            }
            .booking-id {
              background: rgba(0, 198, 255, 0.1);
              padding: 10px;
              border-radius: 8px;
              margin-bottom: 20px;
              font-weight: 600;
              color: #00c6ff;
            }
            @media print {
              body { margin: 0; }
              .receipt-container { box-shadow: none; border: 1px solid #ccc; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <h1>🅿️ ParkEase</h1>
              <p>Digital Parking Ticket</p>
            </div>
            
            <div class="booking-id">
              Booking ID: ${bookingData._id}
            </div>
            
            <div class="qr-section">
              <img src="${bookingData.qrCode}" alt="QR Code" class="qr-code" />
              <p style="font-size: 12px; color: #666; margin: 10px 0;">
                Show this QR code at parking entrance for quick check-in
              </p>
            </div>
            
            <div class="details">
              <div class="detail-row">
                <span class="detail-label">🏢 Location</span>
                <span class="detail-value">${bookingData.locationId?.name || bookingData.location?.name || 'N/A'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">🅿️ Slot Number</span>
                <span class="detail-value">${bookingData.slotId?.slotNumber || bookingData.slot?.slotNumber || 'N/A'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">🚗 Vehicle</span>
                <span class="detail-value">${bookingData.vehicleNumber}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">📅 Check-in</span>
                <span class="detail-value">${formatDateTime(bookingData.startTime)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">📅 Check-out</span>
                <span class="detail-value">${formatDateTime(bookingData.endTime)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">⏰ Duration</span>
                <span class="detail-value">${bookingData.duration} hour${bookingData.duration > 1 ? 's' : ''}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">💳 Amount Paid</span>
                <span class="detail-value">₹${bookingData.totalAmount}</span>
              </div>
            </div>
            
            <div class="footer">
              <p>🎉 Thank you for using ParkEase!</p>
              <p>Valid until: ${formatDateTime(bookingData.endTime)}</p>
              <p style="margin-top: 10px; font-size: 10px;">
                This ticket is electronically generated and valid for parking purposes only.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
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
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Status Header */}
          <div className="card card-glass" style={{ textAlign: 'center', marginBottom: 'var(--spacing-3xl)', position: 'relative' }}>
            <div style={{ fontSize: '4rem', marginBottom: 'var(--spacing-md)', animation: 'scaleIn 0.5s ease-out' }}>
              {bookingData.status === 'cancelled' ? '❌' : (bookingData.status === 'active' || !bookingData.status) ? '✅' : '⏳'}
            </div>
            <h1 style={{ fontSize: '2rem', marginBottom: 'var(--spacing-md)', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {bookingData.status === 'cancelled' ? 'Booking Cancelled' : (bookingData.status === 'active' || !bookingData.status) ? 'Booking Confirmed!' : 'Booking Processing'}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 'var(--spacing-lg)' }}>
              {bookingData.status === 'cancelled' 
                ? 'Your booking has been cancelled successfully' 
                : (bookingData.status === 'active' || !bookingData.status)
                ? 'Your parking slot has been reserved successfully'
                : 'Your booking is being processed'
              }
            </p>
            <div style={{ padding: 'var(--spacing-md)', backgroundColor: bookingData.status === 'cancelled' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', borderRadius: 'var(--radius-lg)', border: `1px solid ${bookingData.status === 'cancelled' ? 'rgba(239, 68, 68, 0.4)' : 'var(--accent)'}` }}>
              <p style={{ fontSize: '0.9rem', color: bookingData.status === 'cancelled' ? '#ef4444' : 'var(--accent)', margin: 0 }}>
                Booking ID: <span style={{ fontWeight: '600' }}>{bookingData._id}</span>
              </p>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', margin: '0.25rem 0 0 0' }}>
                Status: <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>{bookingData.status || 'active'}</span>
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#ef4444',
              padding: '0.875rem 1rem',
              borderRadius: '0.75rem',
              marginBottom: 'var(--spacing-lg)',
              fontSize: '0.9rem',
              fontWeight: '500',
              animation: 'slideInDown 0.3s ease'
            }}>
              ✕ {error}
            </div>
          )}

          {/* Booking Summary Card */}
          <div className="card card-glass" style={{ marginBottom: 'var(--spacing-2xl)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-lg)' }}>📋 Booking Summary</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 'var(--spacing-md)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>🏢 Location</span>
                <span style={{ fontWeight: '500' }}>{bookingData.locationId?.name || bookingData.location?.name || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 'var(--spacing-md)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>🅿️ Slot Number</span>
                <span style={{ fontWeight: '500' }}>{bookingData.slotId?.slotNumber || bookingData.slot?.slotNumber || 'N/A'}</span>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 'var(--spacing-md)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>⏰ Duration</span>
                <span style={{ fontWeight: '500' }}>{bookingData.duration} hour{bookingData.duration > 1 ? 's' : ''}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>📝 Booked on</span>
                <span style={{ fontWeight: '500' }}>{formatDateTime(bookingData.createdAt || bookingData.bookingTime)}</span>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="card card-glass" style={{ marginBottom: 'var(--spacing-2xl)', backgroundColor: 'rgba(34, 197, 94, 0.05)', borderColor: 'rgba(34, 197, 94, 0.2)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-lg)' }}>💳 Payment Details</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 'var(--spacing-md)', borderBottom: '1px solid rgba(34, 197, 94, 0.2)' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>Amount</span>
                <span style={{ fontWeight: '500' }}>₹{bookingData.totalAmount || bookingData.amount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 'var(--spacing-md)', borderBottom: '1px solid rgba(34, 197, 94, 0.2)' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>Status</span>
                <span style={{ fontWeight: '600', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>✓</span> {bookingData.paymentStatus || 'success'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>Transaction ID</span>
                <span style={{ fontWeight: '500', fontSize: '0.85rem', fontFamily: 'monospace' }}>{bookingData.transactionId || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          {bookingData.qrCode && (!bookingData.status || bookingData.status === 'active') && (
            <div className="card card-glass" style={{ textAlign: 'center', marginBottom: 'var(--spacing-2xl)' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-lg)' }}>📱 Digital Parking Ticket</h2>
              <img
                src={bookingData.qrCode}
                alt="QR Code"
                style={{
                  maxWidth: '250px',
                  width: '100%',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--spacing-md)',
                  backgroundColor: 'white',
                  marginBottom: 'var(--spacing-md)',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              />
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', margin: 0, marginBottom: 'var(--spacing-sm)' }}>
                Show this QR code at parking entrance for quick check-in
              </p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', margin: 0 }}>
                Valid until: {formatDateTime(bookingData.endTime)}
              </p>
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
            {(!bookingData.status || bookingData.status === 'active') && (
              <button 
                onClick={handleCancelBooking}
                disabled={loading}
                className="btn btn-danger btn-lg"
                style={{ flex: 1 }}
              >
                {loading ? '⏳ Cancelling...' : '❌ Cancel Booking'}
              </button>
            )}
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