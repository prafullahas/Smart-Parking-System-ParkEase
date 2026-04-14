import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';

const Receipt = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const bookingId = searchParams.get('bookingId');
  const isScanMode = searchParams.get('scan') === '1' || (!location.state && Boolean(bookingId));

  const apiBaseUrl = useMemo(() => {
    const host = window.location.hostname || 'localhost';
    return `http://${host}:5002`;
  }, []);

  useEffect(() => {
    if (location.state && !isScanMode) {
      setBookingData(location.state);
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        if (!bookingId) {
          setError(isScanMode ? 'Invalid QR Code' : 'Unable to fetch booking details');
          return;
        }
        const response = isScanMode
          ? await axios.get(`${apiBaseUrl}/api/bookings/${bookingId}`)
          : await api.get(`/bookings/${bookingId}`);
        if (!response.data?.success || !response.data?.data) {
          setError(isScanMode ? 'Invalid QR Code' : 'Unable to fetch booking details');
          return;
        }
        setBookingData(response.data.data);
      } catch (err) {
        if (isScanMode && err.response?.status === 404) {
          setError('Invalid QR Code');
        } else if (err.response?.status === 404) {
          setError('Unable to fetch booking details');
        } else {
          setError('Unable to fetch booking details');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [apiBaseUrl, bookingId, isScanMode, location.state]);

  const formatDateTime = (value) => {
    if (!value) return 'N/A';
    return new Date(value).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePrintReceipt = () => {
    if (!bookingData) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Booking Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 24px; color: #0f172a; background: #fff; }
            .card { max-width: 640px; margin: 0 auto; border: 1px solid #dbeafe; border-radius: 14px; padding: 18px; }
            .row { display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px solid #e5e7eb; flex-wrap: wrap; }
            .row:last-child { border-bottom: none; }
            .k { color: #475569; font-weight: 600; }
            .v { color: #0f172a; font-weight: 700; }
            .qr { text-align: center; margin-top: 16px; }
            img { max-width: 180px; border-radius: 10px; border: 1px solid #e5e7eb; padding: 6px; background: #fff; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>ParkEase Booking Receipt</h2>
            <div class="row"><span class="k">Booking ID</span><span class="v">${bookingData?._id || 'N/A'}</span></div>
            <div class="row"><span class="k">Location</span><span class="v">${bookingData?.locationId?.name || 'N/A'}</span></div>
            <div class="row"><span class="k">Slot Number</span><span class="v">${bookingData?.slotId?.slotNumber || 'N/A'}</span></div>
            <div class="row"><span class="k">Vehicle Number</span><span class="v">${bookingData?.vehicleNumber || 'N/A'}</span></div>
            <div class="row"><span class="k">Start Time</span><span class="v">${formatDateTime(bookingData?.startTime)}</span></div>
            <div class="row"><span class="k">End Time</span><span class="v">${formatDateTime(bookingData?.endTime)}</span></div>
            <div class="row"><span class="k">Payment Status</span><span class="v">${bookingData?.paymentStatus || 'N/A'}</span></div>
            ${bookingData?.qrCode ? `<div class="qr"><p>QR Ticket</p><img src="${bookingData.qrCode}" alt="Booking QR" /></div>` : ''}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const isExpired = useMemo(() => {
    if (!bookingData) return false;
    const bookingReferenceTime = bookingData.endTime || bookingData.startTime || bookingData.bookingTime || bookingData.createdAt;
    if (!bookingReferenceTime) return false;
    return new Date() > new Date(bookingReferenceTime) ||
      ['expired', 'cancelled', 'completed'].includes((bookingData.status || '').toLowerCase());
  }, [bookingData]);

  const statusText = isExpired ? 'Booking Expired ❌' : 'Booking Valid ✅';

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0f172a', color: '#fff' }}>
        Loading booking details...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0f172a', color: '#fff', padding: '1rem' }}>
        <div style={{ background: '#111827', border: '1px solid #374151', borderRadius: '14px', padding: '1.5rem', maxWidth: 520, width: '100%', textAlign: 'center' }}>
          <h2 style={{ marginTop: 0 }}>{error === 'Invalid QR Code' ? 'Invalid QR Code' : 'Unable to fetch booking details'}</h2>
          <p style={{ color: '#9ca3af', marginBottom: 0 }}>Scan a valid booking QR and try again.</p>
        </div>
      </div>
    );
  }

  if (!isScanMode) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <div className="page-content">
          <div style={{ maxWidth: '760px', margin: '0 auto' }}>
            <div className="card card-glass" style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
              <h1 style={{ marginBottom: '0.4rem' }}>Booking Receipt</h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>Your booking was created successfully.</p>
            </div>

            <div className="card card-glass" style={{ marginBottom: '1.2rem' }}>
              <div style={{ display: 'grid', gap: '0.6rem' }}>
                {[
                  ['Booking ID', bookingData?._id || 'N/A'],
                  ['Location', bookingData?.locationId?.name || 'N/A'],
                  ['Slot Number', bookingData?.slotId?.slotNumber || 'N/A'],
                  ['Vehicle Number', bookingData?.vehicleNumber || 'N/A'],
                  ['Start Time', formatDateTime(bookingData?.startTime)],
                  ['End Time', formatDateTime(bookingData?.endTime)],
                  ['Payment Status', bookingData?.paymentStatus || 'N/A']
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.45rem' }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>{label}</span>
                    <span style={{ fontWeight: 700 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {bookingData?.qrCode && (
              <div className="card card-glass" style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
                <h3 style={{ marginBottom: '0.8rem' }}>QR Ticket</h3>
                <img
                  src={bookingData.qrCode}
                  alt="Booking QR"
                  style={{ width: 210, maxWidth: '100%', borderRadius: 12, background: '#fff', padding: '0.6rem' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <button onClick={handlePrintReceipt} className="btn btn-outline" style={{ flex: 1, minWidth: 140 }}>
                Print Receipt
              </button>
              <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ flex: 1, minWidth: 140 }}>
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0f172a', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 620, background: '#111827', border: '1px solid #334155', borderRadius: '14px', padding: '1.5rem', color: '#fff' }}>
        <h2 style={{ marginTop: 0, marginBottom: '0.4rem' }}>Scan successful - booking verified</h2>
        <div
          style={{
            display: 'inline-block',
            marginBottom: '1rem',
            padding: '0.35rem 0.75rem',
            borderRadius: '999px',
            fontWeight: 700,
            background: isExpired ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)',
            color: isExpired ? '#fca5a5' : '#86efac',
            border: `1px solid ${isExpired ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.4)'}`
          }}
        >
          {statusText}
        </div>

        <div style={{ display: 'grid', gap: '0.65rem' }}>
          {[
            ['Booking ID', bookingData?._id || 'N/A'],
            ['User Email', bookingData?.userId?.email || 'N/A'],
            ['Slot Number', bookingData?.slotId?.slotNumber || 'N/A'],
            ['Vehicle Type', bookingData?.vehicleType || 'N/A'],
            ['Booking Time', formatDateTime(bookingData?.bookingTime || bookingData?.createdAt || bookingData?.startTime)],
            ['Status', (bookingData?.status || (isExpired ? 'EXPIRED' : 'ACTIVE')).toUpperCase()]
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '0.8rem',
                border: '1px solid #334155',
                borderRadius: '10px',
                padding: '0.7rem 0.8rem',
                flexWrap: 'wrap'
              }}
            >
              <span style={{ color: '#9ca3af', fontWeight: 600 }}>{label}</span>
              <span style={{ color: '#e5e7eb', fontWeight: 700 }}>{value}</span>
            </div>
          ))}
        </div>

        {bookingData?.qrCode && (
          <div
            style={{
              marginTop: '1rem',
              border: '1px solid #334155',
              borderRadius: '12px',
              padding: '0.9rem',
              textAlign: 'center'
            }}
          >
            <p style={{ marginTop: 0, color: '#9ca3af', fontWeight: 600 }}>QR Snapshot</p>
            <img
              src={bookingData.qrCode}
              alt="Booking QR"
              style={{ width: 170, maxWidth: '100%', borderRadius: '10px', background: '#fff', padding: '0.5rem' }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Receipt;