import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import '../App.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const darkMode = true;
  const [slots, setSlots] = useState([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingDuration, setBookingDuration] = useState(1);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [showSlotsView, setShowSlotsView] = useState(false);
  const [filterDuration, setFilterDuration] = useState(1);
  const navigate = useNavigate();

  const bookingEndTime = (() => {
    const start = new Date(`${selectedDate}T${selectedTime}`);
    if (Number.isNaN(start.getTime())) return '--';
    start.setHours(start.getHours() + bookingDuration);
    return start.toLocaleTimeString();
  })();

  const slotVisual = (state) => {
    if (state === 'NOT_BOOKED') {
      return {
        bg: 'rgba(34, 197, 94, 0.15)',
        border: 'rgba(34, 197, 94, 0.4)',
        num: '#22c55e',
        badgeBg: 'rgba(34, 197, 94, 0.25)',
        badgeText: '#22c55e',
        label: 'OPEN'
      };
    }

    return {
      bg: 'rgba(107, 114, 128, 0.12)',
      border: 'rgba(107, 114, 128, 0.25)',
      num: '#6b7280',
      badgeBg: 'rgba(107, 114, 128, 0.18)',
      badgeText: '#9ca3af',
      label: 'UNAVAILABLE'
    };
  };

  // Initialize slots and fetch bookings
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        
        if (!userData) {
          navigate('/login');
          return;
        }
        setUser(userData);

        // Fetch locations and slots from API
        const locationsRes = await api.get('/locations');
        if (locationsRes.data.success && locationsRes.data.data.length > 0) {
          const firstLocation = locationsRes.data.data[0];
          
          // Fetch detailed location with slots
          const locationRes = await api.get(`/locations/${firstLocation._id}`);
          if (locationRes.data.success) {
            const slotsData = locationRes.data.data.slots || [];
            
            // Transform API slots to component format
            const formattedSlots = slotsData.map(slot => {
              const st = slot.slotState || (slot.isAvailable ? 'NOT_BOOKED' : 'BOOKED');
              return {
                id: slot._id,
                number: slot.slotNumber,
                slotState: st,
                booked: st !== 'NOT_BOOKED',
                bookedUntil: slot.currentBooking?.endTime || null,
                bookedBy: null,
                bookedFor: null,
                pricePerHour: slot.pricePerHour || 50,
                vehicleType: slot.vehicleType || 'car',
                locationId: firstLocation._id,
                locationName: firstLocation.name
              };
            });
            
            setSlots(formattedSlots);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        // Fallback to mock data if API fails
        const initialSlots = [
          { id: 'A1', number: 'A1', slotState: 'NOT_BOOKED', booked: false, bookedUntil: null, bookedBy: null, bookedFor: null, pricePerHour: 50, vehicleType: 'car', locationId: 'mock-location-1', locationName: 'Mock Parking Location' },
          { id: 'A2', number: 'A2', slotState: 'NOT_BOOKED', booked: false, bookedUntil: null, bookedBy: null, bookedFor: null, pricePerHour: 50, vehicleType: 'car', locationId: 'mock-location-1', locationName: 'Mock Parking Location' },
          { id: 'A3', number: 'A3', slotState: 'NOT_BOOKED', booked: false, bookedUntil: null, bookedBy: null, bookedFor: null, pricePerHour: 50, vehicleType: 'car', locationId: 'mock-location-1', locationName: 'Mock Parking Location' },
          { id: 'B1', number: 'B1', slotState: 'NOT_BOOKED', booked: false, bookedUntil: null, bookedBy: null, bookedFor: null, pricePerHour: 50, vehicleType: 'car', locationId: 'mock-location-1', locationName: 'Mock Parking Location' },
          { id: 'B2', number: 'B2', slotState: 'NOT_BOOKED', booked: false, bookedUntil: null, bookedBy: null, bookedFor: null, pricePerHour: 50, vehicleType: 'car', locationId: 'mock-location-1', locationName: 'Mock Parking Location' },
          { id: 'B3', number: 'B3', slotState: 'NOT_BOOKED', booked: false, bookedUntil: null, bookedBy: null, bookedFor: null, pricePerHour: 50, vehicleType: 'car', locationId: 'mock-location-1', locationName: 'Mock Parking Location' }
        ];
        setSlots(initialSlots);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  // Auto-release expired bookings every 30 seconds
  useEffect(() => {
    const releaseExpiredBookings = () => {
      setSlots((prevSlots) => {
        const now = new Date();
        let updated = prevSlots.map((slot) => {
          if (slot.booked && slot.bookedUntil && new Date(slot.bookedUntil) <= now) {
            return {
              ...slot,
              slotState: 'NOT_BOOKED',
              booked: false,
              bookedUntil: null,
              bookedBy: null,
              bookedFor: null
            };
          }
          return slot;
        });

        return updated;
      });
    };

    releaseExpiredBookings();
    const interval = setInterval(releaseExpiredBookings, 30000);
    return () => clearInterval(interval);
  }, []);

  const getBookingDuration = (endTime) => {
    if (!endTime) return '';
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;

    if (diff < 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  };

  const handleSlotClick = (slot) => {
    const st = slot.slotState || 'NOT_BOOKED';
    if (st === 'NOT_BOOKED') {
      setSelectedSlot(slot);
      setShowBookingModal(true);
      setVehicleNumber('');
      setBookingDuration(filterDuration); // Set initial duration to the selected filter duration
    }
  };

  const handleBookSlot = () => {
    if (!vehicleNumber.trim()) {
      alert('Please enter vehicle number');
      return;
    }

    if (!selectedSlot) {
      alert('Please select a slot');
      return;
    }

    const bookingPayload = {
      location: {
        _id: selectedSlot.locationId,
        name: selectedSlot.locationName || 'Parking Location',
        address: 'Parking Location Address'
      },
      slot: {
        _id: selectedSlot.id,
        slotNumber: selectedSlot.number,
        vehicleType: selectedSlot.vehicleType || 'car',
        pricePerHour: selectedSlot.pricePerHour || 50
      },
      vehicleType: 'car',
      vehicleNumber,
      date: selectedDate,
      time: selectedTime,
      duration: bookingDuration,
      amount: (selectedSlot.pricePerHour || 50) * bookingDuration
    };

    setShowBookingModal(false);
    setSelectedSlot(null);
    setVehicleNumber('');
    setBookingDuration(1);
    setSelectedDate(new Date().toISOString().slice(0, 10));
    setSelectedTime('09:00');

    navigate('/payment', { state: bookingPayload });
  };

  const handleShowSlots = (duration) => {
    setFilterDuration(duration);
    setShowSlotsView(true);
  };

  const handleBackToOverview = () => {
    setShowSlotsView(false);
    setFilterDuration(1);
  };

  useEffect(() => {
    const refreshSlots = async () => {
      try {
        const locationsRes = await api.get('/locations');
        if (!locationsRes.data.success || !locationsRes.data.data.length) return;
        const firstLocation = locationsRes.data.data[0];
        const locationRes = await api.get(`/locations/${firstLocation._id}`);
        if (!locationRes.data.success) return;
        const slotsData = locationRes.data.data.slots || [];
        const formattedSlots = slotsData.map((slot) => {
          const st = slot.slotState || (slot.isAvailable ? 'NOT_BOOKED' : 'BOOKED');
          return {
            id: slot._id,
            number: slot.slotNumber,
            slotState: st,
            booked: st !== 'NOT_BOOKED',
            bookedUntil: slot.currentBooking?.endTime || null,
            bookedBy: null,
            bookedFor: null,
            pricePerHour: slot.pricePerHour || 50,
            vehicleType: slot.vehicleType || 'car',
            locationId: firstLocation._id,
            locationName: firstLocation.name
          };
        });
        setSlots(formattedSlots);
      } catch (err) {
        console.error('Failed to auto-refresh slots:', err);
      }
    };

    const interval = setInterval(refreshSlots, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          color: 'var(--gray-300)',
          fontSize: '1.2rem',
          fontWeight: '500'
        }}>
          Loading parking slots...
        </div>
      </>
    );
  }

  const bgColor = darkMode
    ? 'linear-gradient(135deg, #0f172a 0%, #1a2744 50%, #0a0e27 100%)'
    : 'linear-gradient(135deg, #f5f7fa 0%, #e8eef5 50%, #f0f4f9 100%)';

  const textColor = darkMode ? 'var(--gray-100)' : '#1a2744';
  const cardBg = darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';
  const cardBorder = darkMode ? 'rgba(0, 198, 255, 0.2)' : 'rgba(0, 198, 255, 0.3)';

  return (
    <div style={{
      background: bgColor,
      minHeight: '100vh',
      transition: 'background 0.6s ease',
      paddingBottom: '3rem'
    }}>
      <Navbar />

      {/* Page Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1.5rem'
      }}>
        {/* Header with Theme Toggle */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '3rem',
          flexWrap: 'wrap',
          gap: '2rem'
        }}>
          <div>
            <h1 style={{
              fontSize: '3rem',
              fontWeight: '800',
              color: textColor,
              margin: '0 0 0.5rem 0',
              letterSpacing: '-1px',
              background: darkMode ? 'linear-gradient(135deg, #00c6ff, #667eea)' : 'linear-gradient(135deg, #0066ff, #667eea)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              🅿️ MMCOE PARKING
            </h1>
            <p style={{
              color: darkMode ? 'var(--gray-400)' : '#333',
              fontSize: '0.95rem',
              margin: '0'
            }}>
              Welcome back, <strong>{user?.name}</strong>! Find and book your parking slot.
            </p>
          </div>

        </div>

        {/* Main Content - Overview or Slots View */}
        {!showSlotsView ? (
          /* Overview View */
          <div style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: '1.5rem',
            padding: '3rem 2.5rem',
            backdropFilter: 'blur(10px)',
            boxShadow: darkMode
              ? '0 8px 32px rgba(0, 0, 0, 0.3)'
              : '0 8px 32px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s ease'
          }}>
            {/* Welcome Message */}
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h2 style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: textColor,
                marginBottom: '1rem'
              }}>
                🅿️ Parking Overview
              </h2>
              <p style={{
                color: darkMode ? 'var(--gray-400)' : '#666',
                fontSize: '1.1rem',
                margin: '0'
              }}>
                Select booking duration to view available slots
              </p>
            </div>

            {/* Duration Selection */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2rem',
              marginBottom: '3rem'
            }}>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: textColor,
                  marginBottom: '1rem'
                }}>
                  ⏱️ How long do you want to park?
                </h3>
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'center',
                  flexWrap: 'wrap'
                }}>
                  {[1, 2, 3, 4, 6, 8, 12, 24].map((hours) => (
                    <button
                      key={hours}
                      onClick={() => handleShowSlots(hours)}
                      style={{
                        padding: '1rem 1.5rem',
                        background: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                        border: `1px solid ${cardBorder}`,
                        borderRadius: '1rem',
                        color: textColor,
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        minWidth: '80px'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(0, 198, 255, 0.1)';
                        e.target.style.border = '1px solid rgba(0, 198, 255, 0.3)';
                        e.target.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';
                        e.target.style.border = `1px solid ${cardBorder}`;
                        e.target.style.transform = 'translateY(0)';
                      }}
                    >
                      {hours}h
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Current Statistics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '2rem',
              paddingTop: '2rem',
              borderTop: `1px solid ${cardBorder}`
            }}>
              <div style={{
                textAlign: 'center',
                padding: '2rem 1rem',
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                borderRadius: '1rem'
              }}>
                <div style={{
                  fontSize: '3rem',
                  fontWeight: '800',
                  color: '#22c55e',
                  marginBottom: '0.5rem'
                }}>
                  {slots.filter(s => (s.slotState || 'NOT_BOOKED') === 'NOT_BOOKED').length}
                </div>
                <p style={{
                  color: darkMode ? 'var(--gray-300)' : '#333',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  margin: '0 0 0.5rem 0'
                }}>
                  Available Slots
                </p>
                <p style={{
                  color: darkMode ? 'var(--gray-400)' : '#666',
                  fontSize: '0.9rem',
                  margin: '0'
                }}>
                  Ready for booking
                </p>
              </div>

              <div style={{
                textAlign: 'center',
                padding: '2rem 1rem',
                background: 'rgba(234, 179, 8, 0.1)',
                border: '1px solid rgba(234, 179, 8, 0.2)',
                borderRadius: '1rem'
              }}>
                <div style={{
                  fontSize: '3rem',
                  fontWeight: '800',
                  color: '#eab308',
                  marginBottom: '0.5rem'
                }}>
                  {slots.filter(s => (s.slotState || '') === 'BOOKED').length}
                </div>
                <p style={{
                  color: darkMode ? 'var(--gray-300)' : '#333',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  margin: '0 0 0.5rem 0'
                }}>
                  Currently Booked
                </p>
                <p style={{
                  color: darkMode ? 'var(--gray-400)' : '#666',
                  fontSize: '0.9rem',
                  margin: '0'
                }}>
                  Reserved slots
                </p>
              </div>

              <div style={{
                textAlign: 'center',
                padding: '2rem 1rem',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '1rem'
              }}>
                <div style={{
                  fontSize: '3rem',
                  fontWeight: '800',
                  color: '#3b82f6',
                  marginBottom: '0.5rem'
                }}>
                  {slots.filter(s => (s.slotState || '') === 'ARRIVED').length}
                </div>
                <p style={{
                  color: darkMode ? 'var(--gray-300)' : '#333',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  margin: '0 0 0.5rem 0'
                }}>
                  Vehicles Parked
                </p>
                <p style={{
                  color: darkMode ? 'var(--gray-400)' : '#666',
                  fontSize: '0.9rem',
                  margin: '0'
                }}>
                  Occupied slots
                </p>
              </div>

              <div style={{
                textAlign: 'center',
                padding: '2rem 1rem',
                background: 'rgba(0, 198, 255, 0.1)',
                border: '1px solid rgba(0, 198, 255, 0.2)',
                borderRadius: '1rem'
              }}>
                <div style={{
                  fontSize: '3rem',
                  fontWeight: '800',
                  color: '#00c6ff',
                  marginBottom: '0.5rem'
                }}>
                  {Math.round(((slots.filter(s => (s.slotState || 'NOT_BOOKED') === 'NOT_BOOKED').length) / Math.max(slots.length, 1)) * 100)}%
                </div>
                <p style={{
                  color: darkMode ? 'var(--gray-300)' : '#333',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  margin: '0 0 0.5rem 0'
                }}>
                  Availability
                </p>
                <p style={{
                  color: darkMode ? 'var(--gray-400)' : '#666',
                  fontSize: '0.9rem',
                  margin: '0'
                }}>
                  Parking utilization
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Slots View */
          <div style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: '1.5rem',
            padding: '2.5rem',
            backdropFilter: 'blur(10px)',
            boxShadow: darkMode
              ? '0 8px 32px rgba(0, 0, 0, 0.3)'
              : '0 8px 32px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s ease'
          }}>
            {/* Back Button and Title */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <button
                  onClick={handleBackToOverview}
                  style={{
                    padding: '0.5rem 1rem',
                    background: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    border: `1px solid ${cardBorder}`,
                    borderRadius: '0.5rem',
                    color: textColor,
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = darkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
                  }}
                >
                  ← Back to Overview
                </button>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: textColor,
                  margin: '0 0 0.5rem 0'
                }}>
                  🚗 Available for {filterDuration} Hour{filterDuration !== 1 ? 's' : ''}
                </h2>
                <p style={{
                  color: darkMode ? 'var(--gray-400)' : '#666',
                  fontSize: '0.9rem',
                  margin: '0'
                }}>
                  {slots.filter(s => (s.slotState || 'NOT_BOOKED') === 'NOT_BOOKED').length} slots available
                </p>
              </div>
            </div>

            {/* 6 Slots in Horizontal Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              {slots.map((slot) => {
                const st = slot.slotState || 'NOT_BOOKED';
                const v = slotVisual(st);
                const isOpen = st === 'NOT_BOOKED';
                return (
                <div
                  key={slot.id}
                  onClick={() => handleSlotClick(slot)}
                  style={{
                    background: v.bg,
                    border: `2px solid ${v.border}`,
                    borderRadius: '1.2rem',
                    padding: '1.5rem 1rem',
                    cursor: isOpen ? 'pointer' : 'default',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    position: 'relative',
                    overflow: 'hidden',
                    animation: 'fadeInUp 0.5s ease backwards',
                    aspectRatio: '1 / 1.1',
                    opacity: isOpen ? 1 : 0.88
                  }}
                  onMouseEnter={(e) => {
                    if (isOpen) {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = darkMode
                        ? '0 12px 24px rgba(34, 197, 94, 0.3)'
                        : '0 12px 24px rgba(34, 197, 94, 0.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Slot Number */}
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: '900',
                    color: v.num
                  }}>
                    {slot.number}
                  </div>

                  {/* Status Badge */}
                  <div style={{
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '20px',
                    background: v.badgeBg,
                    color: v.badgeText,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {v.label}
                  </div>

                  {/* Booking Duration */}
                  {slot.booked && slot.bookedUntil && (
                    <>
                      <div style={{
                        fontSize: '0.75rem',
                        color: darkMode ? 'var(--gray-400)' : '#333',
                        fontWeight: '500',
                        textAlign: 'center',
                        marginTop: '0.25rem'
                      }}>
                        ⏱️ {getBookingDuration(slot.bookedUntil)}
                      </div>

                      {/* Vehicle Number */}
                      {slot.bookedBy && (
                        <div style={{
                          fontSize: '0.7rem',
                          color: darkMode ? 'var(--gray-400)' : '#333',
                          fontWeight: '500',
                          marginTop: '0.25rem'
                        }}>
                          🚗 {slot.bookedBy}
                        </div>
                      )}

                      {/* Booked Duration Info */}
                      {slot.bookedFor && (
                        <div style={{
                          fontSize: '0.7rem',
                          color: darkMode ? 'var(--gray-500)' : '#888',
                          fontWeight: '400',
                          marginTop: '0.25rem'
                        }}>
                          Booked for {slot.bookedFor}h
                        </div>
                      )}

                      <div style={{ marginTop: '0.5rem', fontSize: '0.65rem', color: '#fca5a5' }}>
                        Manage cancellations from ticket page
                      </div>
                    </>
                  )}

                  {/* Click to Book Message for Vacant */}
                  {isOpen && (
                    <p style={{
                      fontSize: '0.7rem',
                      color: darkMode ? 'var(--gray-400)' : '#666',
                      margin: '0.25rem 0 0 0',
                      fontStyle: 'italic'
                    }}>
                      Click to book
                    </p>
                  )}
                </div>
                );
              })}
            </div>

            {/* Stats Summary */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '1rem',
              paddingTop: '1.5rem',
              borderTop: `1px solid ${cardBorder}`
            }}>
              <div style={{
                textAlign: 'center',
                padding: '1rem'
              }}>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: '800',
                  color: '#22c55e'
                }}>
                  {slots.filter(s => (s.slotState || 'NOT_BOOKED') === 'NOT_BOOKED').length}
                </div>
                <p style={{
                  color: darkMode ? 'var(--gray-400)' : '#666',
                  fontSize: '0.9rem',
                  margin: '0.5rem 0 0 0'
                }}>
                  Open
                </p>
              </div>

              <div style={{
                textAlign: 'center',
                padding: '1rem'
              }}>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: '800',
                  color: '#eab308'
                }}>
                  {slots.filter(s => (s.slotState || '') === 'BOOKED').length}
                </div>
                <p style={{
                  color: darkMode ? 'var(--gray-400)' : '#666',
                  fontSize: '0.9rem',
                  margin: '0.5rem 0 0 0'
                }}>
                  Booked
                </p>
              </div>

              <div style={{
                textAlign: 'center',
                padding: '1rem'
              }}>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: '800',
                  color: '#3b82f6'
                }}>
                  {slots.filter(s => (s.slotState || '') === 'ARRIVED').length}
                </div>
                <p style={{
                  color: darkMode ? 'var(--gray-400)' : '#666',
                  fontSize: '0.9rem',
                  margin: '0.5rem 0 0 0'
                }}>
                  Arrived
                </p>
              </div>

              <div style={{
                textAlign: 'center',
                padding: '1rem'
              }}>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: '800',
                  color: '#00c6ff'
                }}>
                  {Math.round(((slots.filter(s => (s.slotState || 'NOT_BOOKED') === 'NOT_BOOKED').length) / Math.max(slots.length, 1)) * 100)}%
                </div>
                <p style={{
                  color: darkMode ? 'var(--gray-400)' : '#666',
                  fontSize: '0.9rem',
                  margin: '0.5rem 0 0 0'
                }}>
                  Open %
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Current Bookings Table */}
        <div style={{
          marginTop: '2rem',
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: '1.5rem',
          padding: '1.5rem'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            color: textColor,
            marginBottom: '1rem'
          }}>
            📋 Booked Slots
          </h3>
          {slots.filter(slot => slot.booked).length === 0 ? (
            <p style={{ color: darkMode ? 'var(--gray-400)' : '#555', margin: 0 }}>
              No active bookings right now.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: `1px solid ${cardBorder}` }}>
                    <th style={{ padding: '0.75rem 0' }}>Slot</th>
                    <th style={{ padding: '0.75rem 0' }}>State</th>
                    <th style={{ padding: '0.75rem 0' }}>Vehicle</th>
                    <th style={{ padding: '0.75rem 0' }}>Duration</th>
                    <th style={{ padding: '0.75rem 0' }}>Expires In</th>
                  </tr>
                </thead>
                <tbody>
                  {slots.filter(slot => slot.booked).map((slot) => (
                    <tr key={slot.id} style={{ borderBottom: `1px solid ${cardBorder}` }}>
                      <td style={{ padding: '0.75rem 0' }}>{slot.number}</td>
                      <td style={{ padding: '0.75rem 0' }}>{slot.slotState || 'BOOKED'}</td>
                      <td style={{ padding: '0.75rem 0' }}>{slot.bookedBy || '-'}</td>
                      <td style={{ padding: '0.75rem 0' }}>{slot.bookedFor}h</td>
                      <td style={{ padding: '0.75rem 0' }}>{getBookingDuration(slot.bookedUntil)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: '1rem',
          textAlign: 'center',
          backdropFilter: 'blur(10px)'
        }}>
          <p style={{
            color: darkMode ? 'var(--gray-400)' : '#666',
            fontSize: '0.9rem',
            margin: '0',
            fontStyle: 'italic'
          }}>
            ℹ️ {!showSlotsView 
              ? 'Select a parking duration above to view available slots • Choose how long you want to park'
              : 'Click on open (green) slots to book • Amber = booked, blue = arrived • Set duration and vehicle number'
            }
          </p>
        </div>

        {/* Booking Modal */}
        {showBookingModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{
              background: darkMode ? '#0f172a' : '#f5f7fa',
              border: `1px solid ${cardBorder}`,
              borderRadius: '1.5rem',
              padding: '2rem',
              maxWidth: '500px',
              width: '90%',
              boxShadow: darkMode
                ? '0 20px 60px rgba(0, 0, 0, 0.4)'
                : '0 20px 60px rgba(0, 0, 0, 0.15)',
              animation: 'fadeInUp 0.3s ease'
            }}>
              {/* Modal Header */}
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: textColor,
                marginBottom: '1.5rem',
                margin: '0 0 1.5rem 0'
              }}>
                📍 Book Slot {selectedSlot?.number}
              </h2>

              {/* Vehicle Number Input */}
              <div style={{
                marginBottom: '1rem'
              }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: textColor,
                  fontWeight: '600',
                  fontSize: '0.95rem'
                }}>
                  🚘 Vehicle Type
                </label>
                <input
                  value="Car"
                  readOnly
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.75rem',
                    border: `1px solid ${cardBorder}`,
                    background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    color: textColor,
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{
                marginBottom: '1rem'
              }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: textColor,
                  fontWeight: '600',
                  fontSize: '0.95rem'
                }}>
                  🚗 Vehicle Number
                </label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  placeholder="e.g., MH-01-AB-1234"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.75rem',
                    border: `1px solid ${cardBorder}`,
                    background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    color: textColor,
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.border = `1px solid rgba(0, 198, 255, 0.5)`;
                    e.target.style.background = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
                  }}
                  onBlur={(e) => {
                    e.target.style.border = `1px solid ${cardBorder}`;
                    e.target.style.background = darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
                  }}
                />
              </div>

              {/* Date & Time Inputs */}
              <div style={{
                marginBottom: '1rem'
              }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: textColor,
                  fontWeight: '600',
                  fontSize: '0.95rem'
                }}>
                  📅 Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.75rem',
                    border: `1px solid ${cardBorder}`,
                    background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    color: textColor,
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s ease'
                  }}
                />
              </div>

              <div style={{
                marginBottom: '1.5rem'
              }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: textColor,
                  fontWeight: '600',
                  fontSize: '0.95rem'
                }}>
                  ⏰ Time</label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.75rem',
                    border: `1px solid ${cardBorder}`,
                    background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    color: textColor,
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s ease'
                  }}
                />
              </div>

              {/* Duration Input */}
              <div style={{
                marginBottom: '1.5rem'
              }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: textColor,
                  fontWeight: '600',
                  fontSize: '0.95rem'
                }}>
                  ⏱️ Booking Duration
                </label>
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'center'
                }}>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={bookingDuration}
                    onChange={(e) => setBookingDuration(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{
                      flex: 1,
                      padding: '0.75rem 1rem',
                      borderRadius: '0.75rem',
                      border: `1px solid ${cardBorder}`,
                      background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                      color: textColor,
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.border = `1px solid rgba(0, 198, 255, 0.5)`;
                      e.target.style.background = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
                    }}
                    onBlur={(e) => {
                      e.target.style.border = `1px solid ${cardBorder}`;
                      e.target.style.background = darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
                    }}
                  />
                  <span style={{
                    color: darkMode ? 'var(--gray-400)' : '#666',
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    whiteSpace: 'nowrap'
                  }}>
                    {bookingDuration === 1 ? 'Hour' : 'Hours'}
                  </span>
                </div>
                <p style={{
                  color: darkMode ? 'var(--gray-500)' : '#888',
                  fontSize: '0.85rem',
                  margin: '0.5rem 0 0 0'
                }}>
                  Booking until: <strong>{bookingEndTime}</strong>
                </p>
              </div>

              {/* Price Display */}
              <div style={{
                marginBottom: '2rem',
                padding: '1rem',
                background: `rgba(0, 198, 255, 0.1)`,
                border: `1px solid rgba(0, 198, 255, 0.2)`,
                borderRadius: '0.75rem',
                textAlign: 'center'
              }}>
                <p style={{
                  color: darkMode ? 'var(--gray-400)' : '#666',
                  fontSize: '0.9rem',
                  margin: '0 0 0.5rem 0'
                }}>
                  Estimated Cost
                </p>
                <p style={{
                  color: '#00c6ff',
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  margin: '0'
                }}>
                  ₹{bookingDuration * 50}
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '1rem'
              }}>
                <button
                  onClick={handleBookSlot}
                  style={{
                    flex: 1,
                    padding: '0.85rem 1.5rem',
                    background: 'linear-gradient(135deg, #00c6ff, #667eea)',
                    border: 'none',
                    borderRadius: '0.75rem',
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = darkMode
                      ? '0 10px 20px rgba(0, 198, 255, 0.3)'
                      : '0 10px 20px rgba(0, 198, 255, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  ✅ Proceed to Payment
                </button>
                <button
                  onClick={() => setShowBookingModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.85rem 1.5rem',
                    background: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    border: `1px solid ${cardBorder}`,
                    borderRadius: '0.75rem',
                    color: textColor,
                    fontSize: '1rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.background = darkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.background = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
                  }}
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;