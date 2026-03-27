import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import '../App.css';

const BookSlot = () => {
  const [locationData, setLocationData] = useState(null);
  const [floors, setFloors] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [floorDetails, setFloorDetails] = useState(null);
  const [vehicleType, setVehicleType] = useState('car');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [duration, setDuration] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showFloors, setShowFloors] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Get locationId from URL query params
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
        // Fetch location details
        const locationResponse = await api.get(`/locations/${locationId}`);
        setLocationData(locationResponse.data.data);
      } catch (err) {
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [locationId]);

  const handleFloorSelect = async (floor) => {
    setSelectedFloor(floor);
    setSelectedSlot(null);
    try {
      const response = await api.get(`/slots/location/${locationId}/floor/${floor}`);
      setFloorDetails(response.data);
    } catch (err) {
      setError('Failed to load floor details. Please try again.');
    }
  };

  const handleProceedToSelectSlot = async () => {
    // Validate all required fields
    if (!vehicleNumber) {
      alert('Please enter your vehicle number');
      return;
    }
    if (!selectedDate) {
      alert('Please select a date');
      return;
    }

    // Fetch floors when user clicks proceed
    try {
      const floorsResponse = await api.get(`/slots/location/${locationId}/floors`);
      setFloors(floorsResponse.data.data);
      setShowFloors(true);
    } catch (err) {
      setError('Failed to load floors. Please try again.');
    }
  };

  const handleSlotSelect = (slot) => {
    // Only allow selection of available slots matching vehicle type
    if (slot.isAvailable && slot.vehicleType === vehicleType) {
      setSelectedSlot(slot);
    }
  };

  const handleBookSlot = () => {
    if (!selectedSlot) {
      alert('Please select a slot');
      return;
    }

    if (!vehicleNumber) {
      alert('Please enter your vehicle number');
      return;
    }

    // Navigate to payment page with booking details
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

  const getSlotClassName = (slot) => {
    let className = 'parking-slot';
    
    if (!slot.isAvailable) {
      className += ' booked';
    } else if (slot.vehicleType !== vehicleType) {
      className += ' different-vehicle';
    } else if (selectedSlot?._id === slot._id) {
      className += ' selected';
    } else {
      className += ' available';
    }
    
    if (slot.isHandicapped) className += ' handicapped';
    if (slot.isNearEntrance) className += ' near-entrance';
    if (slot.isNearExit) className += ' near-exit';
    if (slot.isPremium) className += ' premium';
    
    return className;
  };

  if (loading) {
    return <div className="loading">Loading slots...</div>;
  }

  return (
    <div className="book-slot-page">
      <header className="book-slot-header">
        <h1>Book Parking Slot</h1>
        <button onClick={() => navigate('/dashboard')} className="back-button">
          Back to Dashboard
        </button>
      </header>

      <main className="book-slot-main">
        {error && <div className="error-message">{error}</div>}
        
        {locationData && (
          <div className="location-info">
            <h2>{locationData.name}</h2>
            <p>{locationData.address}</p>
          </div>
        )}

        <div className="booking-form">
          <div className="form-row">
            <div className="form-group">
              <label>Vehicle Type:</label>
              <select 
                value={vehicleType} 
                onChange={(e) => {
                  setVehicleType(e.target.value);
                  setSelectedSlot(null);
                }}
                disabled={showFloors}
              >
                <option value="car">Car</option>
                <option value="bike">Bike</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Vehicle Number:</label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                placeholder="TN01AB1234"
                disabled={showFloors}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                disabled={showFloors}
              />
            </div>
            
            <div className="form-group">
              <label>Time:</label>
              <select 
                value={selectedTime} 
                onChange={(e) => setSelectedTime(e.target.value)}
                disabled={showFloors}
              >
                {generateTimeSlots().map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Duration (hours):</label>
              <select 
                value={duration} 
                onChange={(e) => setDuration(Number(e.target.value))}
                disabled={showFloors}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((hrs) => (
                  <option key={hrs} value={hrs}>{hrs} hour{hrs > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
          </div>

          {!showFloors && (
            <button onClick={handleProceedToSelectSlot} className="proceed-button" style={{marginTop: '1rem'}}>
              Proceed to Select Slot 🚗
            </button>
          )}

          {showFloors && (
            <button 
              onClick={() => {
                setShowFloors(false);
                setSelectedFloor(null);
                setFloorDetails(null);
                setSelectedSlot(null);
              }} 
              className="back-button-small" 
              style={{marginTop: '1rem'}}
            >
              ← Change Booking Details
            </button>
          )}
        </div>

        {showFloors && !selectedFloor && floors.length > 0 && (
          <div className="floors-section">
            <h3>Select Floor</h3>
            <div className="floors-grid">
              {floors.map((floor) => (
                <div 
                  key={floor} 
                  className="floor-card"
                  onClick={() => handleFloorSelect(floor)}
                >
                  <h4>{floor}</h4>
                  <p>Click to view slots</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {showFloors && selectedFloor && floorDetails && (
          <div className="floor-details-section">
            <div className="floor-header">
              <button 
                className="back-button-small" 
                onClick={() => {
                  setSelectedFloor(null);
                  setFloorDetails(null);
                  setSelectedSlot(null);
                }}
              >
                ← Back to Floors
              </button>
              <h3>{selectedFloor}</h3>
            </div>

            <div className="floor-stats">
              <div className="stat-item">
                <span className="stat-label">Total:</span>
                <span className="stat-value">{floorDetails.stats.total}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Available:</span>
                <span className="stat-value available">{floorDetails.stats.available}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Booked:</span>
                <span className="stat-value booked">{floorDetails.stats.booked}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Handicapped:</span>
                <span className="stat-value">{floorDetails.stats.handicapped}</span>
              </div>
            </div>

            <div className="legend">
              <h4>Legend:</h4>
              <div className="legend-items">
                <div className="legend-item">
                  <span className="legend-box available"></span>
                  <span>Available</span>
                </div>
                <div className="legend-item">
                  <span className="legend-box booked"></span>
                  <span>Booked</span>
                </div>
                <div className="legend-item">
                  <span className="legend-box handicapped"></span>
                  <span>Handicapped</span>
                </div>
                <div className="legend-item">
                  <span className="legend-box near-entrance"></span>
                  <span>Near Entrance</span>
                </div>
                <div className="legend-item">
                  <span className="legend-box near-exit"></span>
                  <span>Near Exit</span>
                </div>
                <div className="legend-item">
                  <span className="legend-box premium"></span>
                  <span>Premium</span>
                </div>
              </div>
            </div>

            <div className="parking-layout">
              {floorDetails.rows.map((row) => (
                <div key={row} className="parking-row">
                  <div className="row-label">{row}</div>
                  <div className="slots-horizontal">
                    {floorDetails.slotsByRow[row].map((slot) => (
                      <div
                        key={slot._id}
                        className={getSlotClassName(slot)}
                        onClick={() => handleSlotSelect(slot)}
                        title={`${slot.slotNumber} - ${slot.vehicleType} - ₹${slot.pricePerHour}/hr${slot.isAvailable ? ' - AVAILABLE' : ' - OCCUPIED'}${slot.isHandicapped ? ' - Handicapped' : ''}${slot.isNearEntrance ? ' - Near Entrance' : ''}${slot.isNearExit ? ' - Near Exit' : ''}${slot.isPremium ? ' - Premium' : ''}`}
                      >
                        <div className="slot-number">{slot.slotNumber}</div>
                        <div className="slot-info">
                          <span className="vehicle-icon">{slot.vehicleType === 'car' ? '🚗' : '🏍️'}</span>
                          {slot.isHandicapped && <span className="handicap-icon">♿</span>}
                          {slot.isPremium && <span className="premium-icon">💎</span>}
                        </div>
                        <div className="slot-price">₹{slot.pricePerHour}/hr</div>
                        <div className="slot-status">
                          {slot.isAvailable ? '✓ Available' : '✗ Occupied'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedSlot && (
          <div className="booking-summary">
            <h3>Booking Summary</h3>
            <p>Slot: {selectedSlot.slotNumber} ({selectedSlot.floor} Floor)</p>
            <p>Vehicle: {vehicleType} - {vehicleNumber}</p>
            <p>Date: {selectedDate || 'Not selected'}</p>
            <p>Time: {selectedTime}</p>
            <p>Duration: {duration} hour{duration > 1 ? 's' : ''}</p>
            <p className="total-amount">Total Amount: ₹{selectedSlot.pricePerHour * duration}</p>
            <button onClick={handleBookSlot} className="proceed-button">
              Proceed to Payment
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default BookSlot;