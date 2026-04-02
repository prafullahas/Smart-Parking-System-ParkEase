import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import '../App.css';

const BookSlot = () => {
  const [locationData, setLocationData] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [vehicleType, setVehicleType] = useState('car');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [duration, setDuration] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSlots, setShowSlots] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const urlParams = new URLSearchParams(location.search);
  const locationId = urlParams.get('locationId');

  useEffect(() => {
    const fetchData = async () => {
      if (!locationId) {
        setError('No location selected');
        setLoading(false);
        return;
      }

      try {
        const locationResponse = await api.get(`/locations/${locationId}`);
        setLocationData(locationResponse.data.data);
      } catch (err) {
        setError('Failed to load location. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [locationId]);

  const handleProceedToSelectSlot = () => {
    if (!vehicleNumber) {
      setError('Please enter your vehicle number');
      return;
    }
    if (!selectedDate) {
      setError('Please select a date');
      return;
    }
    setError('');
    setShowSlots(true);
  };

  const handleBookSlot = () => {
    if (!selectedSlot) {
      setError('Please select a slot');
      return;
    }

    navigate('/payment', {
      state: {
        location: locationData,
        slot: selectedSlot,
        vehicleType,
        vehicleNumber,
        date: selectedDate,
        time: selectedTime,
        duration,
        amount: selectedSlot.pricePerHour * duration
      }
    });
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading">Loading parking slots...</div>
      </>
    );
  }

  return (
    <div className="booking-page">
      <Navbar />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: 'var(--spacing-xl)' }}>
        <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
          <h1 className="booking-title">🅿️ Select Your Parking Slot</h1>
          <p style={{ color: 'var(--gray-400)', marginTop: 'var(--spacing-md)' }}>
            📍 {locationData?.name} - {locationData?.address}
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Booking Details Form */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(0, 198, 255, 0.2)',
          borderRadius: 'var(--radius-2xl)',
          padding: 'var(--spacing-2xl)',
          marginBottom: 'var(--spacing-2xl)',
          backdropFilter: 'blur(10px)'
        }}>
          <h3 style={{ color: 'var(--white)', marginBottom: 'var(--spacing-lg)' }}>📋 Booking Details</h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--spacing-lg)'
          }}>
            <div className="form-group">
              <label className="form-label">🚗 Vehicle Type</label>
              <select 
                value={vehicleType} 
                onChange={(e) => {
                  setVehicleType(e.target.value);
                  setSelectedSlot(null);
                }}
                disabled={showSlots}
                className="form-input"
              >
                <option value="car">Car</option>
                <option value="bike">Bike</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">📌 Vehicle Number</label>
              <input
                type="text"
                className="form-input"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                placeholder="TN01AB1234"
                disabled={showSlots}
              />
            </div>

            <div className="form-group">
              <label className="form-label">📅 Date</label>
              <input
                type="date"
                className="form-input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                disabled={showSlots}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">🕐 Time</label>
              <select 
                value={selectedTime} 
                onChange={(e) => setSelectedTime(e.target.value)}
                disabled={showSlots}
                className="form-input"
              >
                {generateTimeSlots().map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">⏱️ Duration (hrs)</label>
              <select 
                value={duration} 
                onChange={(e) => setDuration(Number(e.target.value))}
                disabled={showSlots}
                className="form-input"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 12, 24].map((hrs) => (
                  <option key={hrs} value={hrs}>{hrs} {hrs === 1 ? 'hour' : 'hours'}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: 'var(--spacing-lg)', display: 'flex', gap: 'var(--spacing-md)' }}>
            {!showSlots ? (
              <button onClick={handleProceedToSelectSlot} className="btn btn-primary">
                Continue to Slots →
              </button>
            ) : (
              <button 
                onClick={() => {
                  setShowSlots(false);
                  setSelectedSlot(null);
                }} 
                className="btn btn-secondary"
              >
                ← Back to Details
              </button>
            )}
          </div>
        </div>

        {/* Slots Selection Grid */}
        {showSlots && (
          <div>
            <h3 style={{ color: 'var(--white)', marginBottom: 'var(--spacing-lg)' }}>
              Select a Slot (Estimated Cost: ₹{selectedSlot ? selectedSlot.pricePerHour * duration : locationData?.pricePerHour.car * duration})
            </h3>
            
            <div className="booking-grid">
              {locationData?.slots?.filter(s => s.vehicleType === vehicleType && s.isAvailable)?.map((slot) => (
                <div
                  key={slot._id}
                  className={`booking-slot-card ${slot.isAvailable ? 'available' : 'occupied'} ${selectedSlot?._id === slot._id ? 'selected' : ''}`}
                  onClick={() => slot.isAvailable && setSelectedSlot(slot)}
                >
                  <div className="booking-slot-number">{slot.slotNumber}</div>
                  <div className="booking-slot-price">₹{slot.pricePerHour}/hr</div>
                  {slot.isPremium && <div style={{ fontSize: '0.8rem', color: 'var(--warning)' }}>⭐ Premium</div>}
                </div>
              ))}
            </div>

            {selectedSlot && (
              <div style={{ marginTop: 'var(--spacing-2xl)', textAlign: 'center' }}>
                <button onClick={handleBookSlot} className="btn btn-accent btn-lg">
                  Confirm Booking ✓
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookSlot;