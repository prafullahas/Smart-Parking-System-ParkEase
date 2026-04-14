import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
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
      return <span style={{ display: 'inline-block', padding: '0.375rem 0.75rem', backgroundColor: 'rgba(102, 126, 234, 0.2)', color: 'var(--secondary)', borderRadius: 'var(--radius-full)', fontSize: '0.85rem', fontWeight: '500' }}>📅 Upcoming</span>;
    } else if (now >= startTime && now <= endTime) {
      return <span style={{ display: 'inline-block', padding: '0.375rem 0.75rem', backgroundColor: 'rgba(34, 197, 94, 0.2)', color: 'var(--accent)', borderRadius: 'var(--radius-full)', fontSize: '0.85rem', fontWeight: '500' }}>✓ Active</span>;
    } else {
      return <span style={{ display: 'inline-block', padding: '0.375rem 0.75rem', backgroundColor: 'rgba(107, 114, 128, 0.2)', color: 'rgba(255,255,255,0.8)', borderRadius: 'var(--radius-full)', fontSize: '0.85rem', fontWeight: '500' }}>✓ Completed</span>;
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.6)' }}>Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
          {/* Header */}
          <div style={{ marginBottom: 'var(--spacing-3xl)' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-lg)', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>📋 My Parking Bookings</h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.05rem', margin: 0 }}>Manage and view all your parking reservations</p>
          </div>

          {error && (
            <div style={{ 
              padding: 'var(--spacing-lg)', 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid var(--danger)',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--danger)',
              marginBottom: 'var(--spacing-2xl)'
            }}>
              {error}
            </div>
          )}

          {bookings.length === 0 ? (
            <div className="card card-glass" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: 'var(--spacing-lg)' }}>🅿️</div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-md)' }}>No Bookings Yet</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 'var(--spacing-2xl)' }}>You haven't made any parking reservations yet. Start booking your first spot now!</p>
              <button onClick={() => navigate('/dashboard')} className="btn btn-primary btn-lg">
                🚗 Browse Parking Locations
              </button>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-lg)' }}>Your Reservations ({bookings.length})</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 'var(--spacing-xl)' }}>
                {bookings.map((booking) => (
                  <div key={booking._id} className="card card-glass" style={{ display: 'flex', flexDirection: 'column' }}>
                    {(() => {
                      const latestNotification = booking.notificationLog?.length
                        ? booking.notificationLog[booking.notificationLog.length - 1]
                        : null;
                      return latestNotification ? (
                        <div style={{
                          marginBottom: 'var(--spacing-md)',
                          padding: '0.65rem',
                          borderRadius: '0.75rem',
                          background: latestNotification.status === 'failed'
                            ? 'rgba(239,68,68,0.12)'
                            : 'rgba(34,197,94,0.12)',
                          border: `1px solid ${latestNotification.status === 'failed' ? 'rgba(239,68,68,0.35)' : 'rgba(34,197,94,0.35)'}`
                        }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                            Notification Status: {latestNotification.status === 'failed' ? 'Delivery failed' : 'Delivered'}
                          </div>
                          <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                            Last alert via {latestNotification.channel} ({latestNotification.provider})
                          </div>
                        </div>
                      ) : null;
                    })()}
                    {/* Status Badge */}
                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                      {getStatusBadge(booking)}
                    </div>

                    {/* Booking Header */}
                    <h3 style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>{booking.locationId?.name || 'Unknown Location'}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: 'var(--spacing-lg)' }}>ID: {booking._id.slice(-8).toUpperCase()}</p>

                    {/* Details Grid */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-md)' }}>
                        <span style={{ fontSize: '1.25rem' }}>📍</span>
                        <div>
                          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', margin: '0 0 0.25rem 0' }}>Location</p>
                          <p style={{ margin: 0, fontWeight: '500' }}>{booking.locationId?.address || 'N/A'}</p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-md)' }}>
                        <span style={{ fontSize: '1.25rem' }}>🅿️</span>
                        <div>
                          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', margin: '0 0 0.25rem 0' }}>Slot Number</p>
                          <p style={{ margin: 0, fontWeight: '500' }}>{booking.slotId?.slotNumber || 'N/A'}</p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-md)' }}>
                        <span style={{ fontSize: '1.25rem' }}>🚗</span>
                        <div>
                          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', margin: '0 0 0.25rem 0' }}>Vehicle</p>
                          <p style={{ margin: 0, fontWeight: '500' }}>{booking.vehicleNumber}</p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-md)' }}>
                        <span style={{ fontSize: '1.25rem' }}>📅</span>
                        <div>
                          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', margin: '0 0 0.25rem 0' }}>Check-in</p>
                          <p style={{ margin: 0, fontWeight: '500', fontSize: '0.9rem' }}>{new Date(booking.startTime).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-md)' }}>
                        <span style={{ fontSize: '1.25rem' }}>⏰</span>
                        <div>
                          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', margin: '0 0 0.25rem 0' }}>Duration</p>
                          <p style={{ margin: 0, fontWeight: '500' }}>{booking.duration} hour{booking.duration > 1 ? 's' : ''}</p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-md)' }}>
                        <span style={{ fontSize: '1.25rem' }}>💰</span>
                        <div>
                          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', margin: '0 0 0.25rem 0' }}>Total Amount</p>
                          <p style={{ margin: 0, fontWeight: '600', color: 'var(--primary)', fontSize: '1.1rem' }}>₹{booking.amount}</p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-md)' }}>
                        <span style={{ fontSize: '1.25rem' }}>💳</span>
                        <div>
                          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', margin: '0 0 0.25rem 0' }}>Payment Status</p>
                          <p style={{ margin: 0, fontWeight: '500', color: booking.paymentStatus === 'paid' ? 'var(--accent)' : 'rgba(255,255,255,0.7)' }}>
                            {booking.paymentStatus === 'paid' ? '✓ Paid' : 'Pending'}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-md)' }}>
                        <span style={{ fontSize: '1.25rem' }}>🔔</span>
                        <div style={{ width: '100%' }}>
                          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', margin: '0 0 0.25rem 0' }}>Notification History</p>
                          <p style={{ margin: '0 0 0.25rem 0', fontWeight: '500' }}>
                            {booking.notificationLog?.length || 0} updates sent
                          </p>
                          {booking.notificationLog?.slice(-2).reverse().map((n, idx) => (
                            <p key={`${booking._id}-notif-${idx}`} style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
                              {n.type} via {n.channel} ({n.status}) - {new Date(n.sentAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    {booking.qrCode && (
                      <button 
                        onClick={() => navigate(`/receipt?bookingId=${booking._id}`, { state: booking })}
                        className="btn btn-outline btn-lg"
                        style={{ width: '100%' }}
                      >
                        📄 View Receipt & QR
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyBookings;
