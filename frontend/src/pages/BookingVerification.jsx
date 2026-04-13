import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';

const BookingVerification = () => {
  const { bookingId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState(null);
  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    const fetchBooking = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/booking/${bookingId}`);
        if (!response.data?.success) {
          setError('Invalid QR Code');
          return;
        }
        setBooking(response.data);
      } catch (err) {
        setError(err?.response?.status === 404 ? 'Invalid QR Code' : 'Unable to load booking details');
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBooking();
    } else {
      setLoading(false);
      setError('Invalid QR Code');
    }
  }, [bookingId]);

  useEffect(() => {
    if (!booking?.endTime) return undefined;
    const tick = () => {
      setRemainingMs(new Date(booking.endTime).getTime() - Date.now());
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [booking?.endTime]);

  const isExpired = useMemo(() => {
    if (!booking?.endTime) return false;
    return Date.now() > new Date(booking.endTime).getTime() || booking.status === 'expired';
  }, [booking]);

  const formatDateTime = (value) => new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const formatCountdown = (ms) => {
    if (ms <= 0) return '00:00:00';
    const total = Math.floor(ms / 1000);
    const h = String(Math.floor(total / 3600)).padStart(2, '0');
    const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
    const s = String(total % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: '4px solid #cbd5e1',
            borderTopColor: '#16a34a',
            margin: '0 auto 0.75rem',
            animation: 'spin 0.9s linear infinite'
          }} />
          <p style={{ margin: 0, color: '#334155', fontWeight: 600 }}>Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '1rem' }}>
        <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 18, padding: '1.1rem', boxShadow: '0 12px 40px rgba(2,6,23,0.12)', textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ef4444', marginBottom: '0.6rem' }}>Invalid QR Code</div>
          <p style={{ margin: 0, color: '#64748b' }}>{error || 'Booking not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.9rem' }}>
      <div style={{
        width: '100%',
        maxWidth: 460,
        background: '#fff',
        borderRadius: 20,
        padding: '1rem',
        boxShadow: '0 16px 48px rgba(2,6,23,0.13)',
        opacity: isExpired ? 0.85 : 1,
        pointerEvents: isExpired ? 'none' : 'auto'
      }}>
        <div style={{
          display: 'inline-block',
          padding: '0.45rem 0.75rem',
          borderRadius: 999,
          fontWeight: 800,
          marginBottom: '0.75rem',
          color: isExpired ? '#dc2626' : '#15803d',
          background: isExpired ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
          border: `1px solid ${isExpired ? 'rgba(239,68,68,0.35)' : 'rgba(34,197,94,0.35)'}`
        }}>
          {isExpired ? 'EXPIRED ❌' : 'VALID ✅'}
        </div>

        <h1 style={{ margin: '0 0 0.7rem', fontSize: '1.2rem', color: '#0f172a' }}>Smart Parking Booking</h1>

        <div style={{
          marginBottom: '0.75rem',
          padding: '0.7rem',
          borderRadius: 12,
          background: isExpired ? 'rgba(239,68,68,0.08)' : 'rgba(22,163,74,0.08)',
          color: isExpired ? '#b91c1c' : '#166534',
          fontWeight: 700
        }}>
          Remaining Validity: {isExpired ? 'Booking No Longer Valid' : formatCountdown(remainingMs)}
        </div>

        <div style={{ display: 'grid', gap: '0.55rem' }}>
          {[
            ['Booking ID', booking.bookingId],
            ['User Name', booking.userName],
            ['Parking Location', booking.location],
            ['Slot Number', booking.slotNumber],
            ['Vehicle Number', booking.vehicleNumber],
            ['Start Time', formatDateTime(booking.startTime)],
            ['End Time', formatDateTime(booking.endTime)]
          ].map(([label, value]) => (
            <div key={label} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.65rem 0.75rem' }}>
              <div style={{ fontSize: '0.76rem', color: '#64748b', marginBottom: '0.15rem' }}>{label}</div>
              <div style={{ fontSize: '0.95rem', color: '#0f172a', fontWeight: 700, wordBreak: 'break-word' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export default BookingVerification;
