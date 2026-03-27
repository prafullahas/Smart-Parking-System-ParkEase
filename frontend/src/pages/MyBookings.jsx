import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import '../App.css';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await api.get('/bookings/my-bookings');
        setBookings(response.data.data || []);
      } catch (err) {
        setError('Failed to load bookings. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const getStatusBadge = (booking) => {
    const now = new Date();
    const startTime = new Date(booking.startTime);
    const endTime = new Date(booking.endTime);

    if (now < startTime) {
      return <span className="status-badge upcoming">📅 Upcoming</span>;
    } else if (now >= startTime && now <= endTime) {
      return <span className="status-badge active">✓ Active</span>;
    } else {
      return <span className="status-badge completed">✓ Completed</span>;
    }
  };

  if (loading) {
    return <div className="loading">Loading your bookings...</div>;
  }

  return (
    <div className="my-bookings-page">
      <header className="my-bookings-header">
        <h1>📋 My Bookings</h1>
        <button onClick={() => navigate('/dashboard')} className="back-button">
          ← Back to Dashboard
        </button>
      </header>

      <main className="my-bookings-main">
        {error && <div className="error-message">{error}</div>}

        {bookings.length === 0 ? (
          <div className="no-bookings">
            <div className="no-bookings-icon">🚗</div>
            <h2>No Bookings Yet</h2>
            <p>You haven't made any parking reservations yet.</p>
            <button onClick={() => navigate('/dashboard')} className="browse-locations-button">
              Browse Parking Locations
            </button>
          </div>
        ) : (
          <div className="bookings-container">
            <h2>Your Parking Reservations ({bookings.length})</h2>
            <div className="bookings-grid">
              {bookings.map((booking) => (
                <div key={booking._id} className="booking-card">
                  {getStatusBadge(booking)}
                  
                  <div className="booking-header">
                    <h3>{booking.locationId?.name || 'Unknown Location'}</h3>
                    <p className="booking-id">Booking ID: {booking._id.slice(-8).toUpperCase()}</p>
                  </div>

                  <div className="booking-details">
                    <div className="detail-item">
                      <span className="detail-icon">📍</span>
                      <div>
                        <strong>Location:</strong>
                        <p>{booking.locationId?.address || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="detail-item">
                      <span className="detail-icon">🅿️</span>
                      <div>
                        <strong>Slot:</strong>
                        <p>{booking.slotId?.slotNumber || 'N/A'} - {booking.slotId?.floor || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="detail-item">
                      <span className="detail-icon">🚗</span>
                      <div>
                        <strong>Vehicle:</strong>
                        <p>{booking.vehicleType} - {booking.vehicleNumber}</p>
                      </div>
                    </div>

                    <div className="detail-item">
                      <span className="detail-icon">📅</span>
                      <div>
                        <strong>Date & Time:</strong>
                        <p>{new Date(booking.startTime).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="detail-item">
                      <span className="detail-icon">⏱️</span>
                      <div>
                        <strong>Duration:</strong>
                        <p>{booking.duration} hour{booking.duration > 1 ? 's' : ''}</p>
                      </div>
                    </div>

                    <div className="detail-item">
                      <span className="detail-icon">💰</span>
                      <div>
                        <strong>Amount Paid:</strong>
                        <p className="amount">₹{booking.amount}</p>
                      </div>
                    </div>

                    <div className="detail-item">
                      <span className="detail-icon">💳</span>
                      <div>
                        <strong>Payment:</strong>
                        <p className={`payment-status ${booking.paymentStatus}`}>
                          {booking.paymentStatus === 'paid' ? '✓ Paid' : 'Pending'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {booking.qrCode && (
                    <button 
                      onClick={() => navigate(`/receipt?bookingId=${booking._id}`)}
                      className="view-receipt-button"
                    >
                      📄 View Receipt & QR Code
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyBookings;
