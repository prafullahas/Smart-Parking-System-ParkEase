import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
      <div className="receipt-page">
        <div className="receipt-container">
          <h2>No booking data found</h2>
          <button onClick={() => navigate('/dashboard')} className="back-button">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="receipt-page">
      <div className="receipt-container">
        <header className="receipt-header">
          <h1>🚗 Smart Parking</h1>
          <h2>Parking Receipt</h2>
        </header>

        <div className="receipt-details">
          <div className="detail-section">
            <h3>Booking Information</h3>
            <div className="detail-row">
              <span>Booking ID:</span>
              <span>{bookingData._id}</span>
            </div>
            <div className="detail-row">
              <span>Name:</span>
              <span>{bookingData.userId?.name || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span>Vehicle:</span>
              <span>{bookingData.vehicleType} - {bookingData.vehicleNumber}</span>
            </div>
          </div>

          <div className="detail-section">
            <h3>Location Details</h3>
            <div className="detail-row">
              <span>Location:</span>
              <span>{bookingData.locationId?.name || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span>Address:</span>
              <span>{bookingData.locationId?.address || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span>Slot:</span>
              <span>{bookingData.slotId?.slotNumber || 'N/A'} ({bookingData.slotId?.floor || 'N/A'} Floor)</span>
            </div>
          </div>

          <div className="detail-section">
            <h3>Timing Details</h3>
            <div className="detail-row">
              <span>Start Time:</span>
              <span>{formatDateTime(bookingData.startTime)}</span>
            </div>
            <div className="detail-row">
              <span>End Time:</span>
              <span>{formatDateTime(bookingData.endTime)}</span>
            </div>
            <div className="detail-row">
              <span>Duration:</span>
              <span>{bookingData.duration} hour{bookingData.duration > 1 ? 's' : ''}</span>
            </div>
          </div>

          <div className="detail-section">
            <h3>Payment Details</h3>
            <div className="detail-row">
              <span>Amount:</span>
              <span>₹{bookingData.totalAmount}</span>
            </div>
            <div className="detail-row">
              <span>Payment Status:</span>
              <span className="status-success">{bookingData.paymentStatus}</span>
            </div>
            <div className="detail-row">
              <span>Transaction ID:</span>
              <span>{bookingData.transactionId || 'N/A'}</span>
            </div>
          </div>

          <div className="qr-section">
            <h3>QR Code for Entry</h3>
            {bookingData.qrCode ? (
              <img 
                src={bookingData.qrCode} 
                alt="QR Code" 
                className="qr-code"
              />
            ) : (
              <p>QR code not available</p>
            )}
            <p className="qr-note">Show this QR code at the parking entrance</p>
          </div>
        </div>

        <div className="receipt-actions">
          <button onClick={handleDownloadReceipt} className="download-button">
            Download Receipt
          </button>
          <button onClick={() => navigate('/dashboard')} className="dashboard-button">
            Back to Dashboard
          </button>
        </div>

        <footer className="receipt-footer">
          <p>Thank you for using Smart Parking Management System!</p>
          <p>Have a safe journey!</p>
        </footer>
      </div>
    </div>
  );
};

export default Receipt;