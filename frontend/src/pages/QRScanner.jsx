import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import '../App.css';

const QRScanner = () => {
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [remainingMs, setRemainingMs] = useState(0);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const bookingId = searchParams.get('bookingId') || searchParams.get('booking_id');
    const userId = searchParams.get('userId') || searchParams.get('user_id');
    const slotId = searchParams.get('slotId') || searchParams.get('slot_id');

    if (bookingId) {
      fetchBooking(bookingId, userId, slotId);
    } else if (userId && slotId) {
      // If QR contains userId and slotId, find the active booking
      fetchBookingByUserAndSlot(userId, slotId);
    } else {
      setError('Invalid QR code data');
      setLoading(false);
    }
  }, [searchParams]);

  const fetchBooking = async (bookingId, expectedUserId, expectedSlotId) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/bookings/public/${bookingId}`);
      if (response.data.success) {
        const ticket = response.data.data;
        const userMatch = !expectedUserId || String(ticket.userId?._id || ticket.userId) === String(expectedUserId);
        const slotMatch = !expectedSlotId || String(ticket.slotId?._id || ticket.slotId) === String(expectedSlotId);
        if (!userMatch || !slotMatch) {
          setError('QR data mismatch. Ticket could not be validated.');
          return;
        }
        setBookingData(ticket);
      } else {
        setError('Unable to load booking information');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load booking information');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingByUserAndSlot = async () => {
    setLoading(false);
    setError('Invalid QR payload. Please scan a booking QR containing a booking ID.');
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCountdown = (ms) => {
    if (ms <= 0) return 'Expired';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  useEffect(() => {
    if (!bookingData?.endTime) return undefined;
    const tick = () => {
      setRemainingMs(new Date(bookingData.endTime).getTime() - Date.now());
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [bookingData?.endTime]);

  const isExpired =
    bookingData &&
    (bookingData.status === 'expired' ||
      bookingData.status === 'cancelled' ||
      bookingData.status === 'completed' ||
      new Date(bookingData.endTime).getTime() <= Date.now());
  const statusText = isExpired ? 'Expired' : 'Valid';
  const statusColor = isExpired ? '#ef4444' : '#22c55e';
  const statusBg = isExpired ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)';
  const mapsQuery = encodeURIComponent(bookingData?.locationId?.address || bookingData?.locationId?.name || 'Parking Location');
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  if (loading) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <div className="page-content">
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              border: '4px solid rgba(255,255,255,0.2)',
              borderTopColor: '#22c55e',
              margin: '0 auto 1rem',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{ fontSize: '1.05rem' }}>Loading booking details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <div className="page-content">
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#ef4444',
              padding: '2rem',
              borderRadius: '1rem',
              marginBottom: '2rem'
            }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>❌ Invalid QR Code</h2>
              <p>{error}</p>
            </div>
            <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
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
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '18px',
            boxShadow: '0 12px 40px rgba(2, 6, 23, 0.12)',
            padding: '1.2rem',
            marginBottom: '1rem',
            color: '#0f172a'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>Booking Confirmed ✅</div>
              <span style={{
                background: statusBg,
                color: statusColor,
                padding: '0.4rem 0.7rem',
                borderRadius: 999,
                fontSize: '0.82rem',
                fontWeight: 700
              }}>
                {statusText}
              </span>
            </div>
            <div style={{
              background: statusBg,
              border: `1px solid ${statusColor}40`,
              borderRadius: 12,
              padding: '0.7rem 0.85rem',
              marginBottom: '0.75rem',
              fontWeight: 600,
              color: statusColor
            }}>
              Remaining validity: {formatCountdown(remainingMs)}
            </div>

            <div style={{ display: 'grid', gap: '0.55rem' }}>
              {[
                ['Booking ID', bookingData._id],
                ['User Name', bookingData.userId?.name || 'N/A'],
                ['Parking Location', bookingData.locationId?.name || 'N/A'],
                ['Slot Number', bookingData.slotId?.slotNumber || 'N/A'],
                ['Vehicle Number', bookingData.vehicleNumber || 'N/A'],
                ['Booking Date', formatDate(bookingData.bookingTime || bookingData.createdAt || bookingData.startTime)],
                ['Start Time', formatDateTime(bookingData.startTime)],
                ['End Time', formatDateTime(bookingData.endTime)],
                ['Booking Validity Status', statusText]
              ].map(([label, value]) => (
                <div key={label} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '0.65rem 0.75rem',
                  flexWrap: 'wrap'
                }}>
                  <span style={{ color: '#475569', fontWeight: 600 }}>{label}</span>
                  <span style={{ color: label === 'Booking Validity Status' ? statusColor : '#0f172a', fontWeight: 700 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {bookingData.qrCode && (
            <div style={{
              background: '#ffffff',
              borderRadius: '18px',
              boxShadow: '0 12px 40px rgba(2, 6, 23, 0.12)',
              padding: '1.2rem',
              marginBottom: '1rem',
              color: '#0f172a',
              textAlign: 'center'
            }}>
              <h3 style={{ marginBottom: '0.7rem' }}>QR Preview</h3>
              <img src={bookingData.qrCode} alt="Booking QR" style={{ width: 160, maxWidth: '100%', borderRadius: 12 }} />
            </div>
          )}

          <div style={{
            background: '#ffffff',
            borderRadius: '18px',
            boxShadow: '0 12px 40px rgba(2, 6, 23, 0.12)',
            padding: '1rem',
            color: '#0f172a',
            display: 'flex',
            gap: '0.6rem',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => window.open(mapsUrl, '_blank')}
              className="btn"
              style={{ background: '#16a34a', color: '#fff', flex: 1, minWidth: 180 }}
            >
              Navigate to Parking
            </button>
            <button
              onClick={() => window.print()}
              className="btn btn-outline"
              style={{ flex: 1, minWidth: 140 }}
            >
              Print Ticket
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn btn-outline"
              style={{ flex: 1, minWidth: 140 }}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;