import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import '../App.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [slots, setSlots] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingDuration, setBookingDuration] = useState(1);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const navigate = useNavigate();

  // Initialize slots and fetch bookings
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        const savedSlots = JSON.parse(localStorage.getItem('mmcoe_parking_slots'));
        
        if (!userData) {
          navigate('/login');
          return;
        }
        setUser(userData);

        // Initialize 6 parking slots with saved state
        const initialSlots = [
          { id: 'A1', number: 'A1', booked: false, bookedUntil: null, bookedBy: null, bookedFor: null },
          { id: 'A2', number: 'A2', booked: false, bookedUntil: null, bookedBy: null, bookedFor: null },
          { id: 'A3', number: 'A3', booked: false, bookedUntil: null, bookedBy: null, bookedFor: null },
          { id: 'B1', number: 'B1', booked: false, bookedUntil: null, bookedBy: null, bookedFor: null },
          { id: 'B2', number: 'B2', booked: false, bookedUntil: null, bookedBy: null, bookedFor: null },
          { id: 'B3', number: 'B3', booked: false, bookedUntil: null, bookedBy: null, bookedFor: null }
        ];

        // Use saved slots if available
        const slotsToUse = savedSlots || initialSlots;
        setSlots(slotsToUse);
        setLoading(false);
      } catch (err) {
        console.error('Error:', err);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

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
    if (!slot.booked) {
      setSelectedSlot(slot);
      setShowBookingModal(true);
      setVehicleNumber('');
      setBookingDuration(1);
    }
  };

  const handleBookSlot = () => {
    if (!vehicleNumber.trim()) {
      alert('Please enter vehicle number');
      return;
    }

    const bookedUntil = new Date(Date.now() + bookingDuration * 60 * 60 * 1000);

    const updatedSlots = slots.map(slot => {
      if (slot.id === selectedSlot.id) {
        return {
          ...slot,
          booked: true,
          bookedUntil: bookedUntil,
          bookedBy: vehicleNumber,
          bookedFor: bookingDuration
        };
      }
      return slot;
    });

    setSlots(updatedSlots);
    // Save to localStorage
    localStorage.setItem('mmcoe_parking_slots', JSON.stringify(updatedSlots));

    setShowBookingModal(false);
    setSelectedSlot(null);
    setVehicleNumber('');
    setBookingDuration(1);
  };

  const handleCancelBooking = (slotId) => {
    const updatedSlots = slots.map(slot => {
      if (slot.id === slotId) {
        return {
          ...slot,
          booked: false,
          bookedUntil: null,
          bookedBy: null,
          bookedFor: null
        };
      }
      return slot;
    });

    setSlots(updatedSlots);
    // Save to localStorage
    localStorage.setItem('mmcoe_parking_slots', JSON.stringify(updatedSlots));
  };

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

          {/* Light/Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{
              padding: '0.75rem 1.5rem',
              background: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              border: `1px solid ${cardBorder}`,
              borderRadius: '50px',
              color: textColor,
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = darkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
              e.target.style.transform = 'scale(1)';
            }}
          >
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>

        {/* Parking Slots Grid */}
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
          {/* Section Title */}
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: textColor,
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            🚗 Car Parking Slots (6 Available)
          </h2>

          {/* 6 Slots in Horizontal Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {slots.map((slot) => (
              <div
                key={slot.id}
                onClick={() => handleSlotClick(slot)}
                style={{
                  background: slot.booked
                    ? 'rgba(239, 68, 68, 0.15)'
                    : 'rgba(34, 197, 94, 0.15)',
                  border: `2px solid ${slot.booked ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)'}`,
                  borderRadius: '1.2rem',
                  padding: '1.5rem 1rem',
                  cursor: slot.booked ? 'default' : 'pointer',
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
                  opacity: slot.booked ? 0.8 : 1
                }}
                onMouseEnter={(e) => {
                  if (!slot.booked) {
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
                  color: slot.booked ? '#ef4444' : '#22c55e'
                }}>
                  {slot.number}
                </div>

                {/* Status Badge */}
                <div style={{
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '20px',
                  background: slot.booked ? 'rgba(239, 68, 68, 0.25)' : 'rgba(34, 197, 94, 0.25)',
                  color: slot.booked ? '#ef4444' : '#22c55e',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {slot.booked ? 'BOOKED' : 'VACANT'}
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

                    {/* Cancel Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelBooking(slot.id);
                      }}
                      style={{
                        marginTop: '0.5rem',
                        padding: '0.35rem 0.75rem',
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        borderRadius: '6px',
                        color: '#ef4444',
                        fontSize: '0.65rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(239, 68, 68, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                      }}
                    >
                      CANCEL
                    </button>
                  </>
                )}

                {/* Click to Book Message for Vacant */}
                {!slot.booked && (
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
            ))}
          </div>

          {/* Stats Summary */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
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
                {slots.filter(s => !s.booked).length}
              </div>
              <p style={{
                color: darkMode ? 'var(--gray-400)' : '#666',
                fontSize: '0.9rem',
                margin: '0.5rem 0 0 0'
              }}>
                Available Slots
              </p>
            </div>

            <div style={{
              textAlign: 'center',
              padding: '1rem'
            }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: '800',
                color: '#ef4444'
              }}>
                {slots.filter(s => s.booked).length}
              </div>
              <p style={{
                color: darkMode ? 'var(--gray-400)' : '#666',
                fontSize: '0.9rem',
                margin: '0.5rem 0 0 0'
              }}>
                Booked Slots
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
                {Math.round((slots.filter(s => !s.booked).length / 6) * 100)}%
              </div>
              <p style={{
                color: darkMode ? 'var(--gray-400)' : '#666',
                fontSize: '0.9rem',
                margin: '0.5rem 0 0 0'
              }}>
                Availability
              </p>
            </div>
          </div>
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
            ℹ️ Click on VACANT slots to book • Set duration and vehicle number • Shows remaining booking time
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
                marginBottom: '1.5rem'
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
                  Booking until: <strong>{new Date(Date.now() + bookingDuration * 60 * 60 * 1000).toLocaleTimeString()}</strong>
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
                  ✅ Confirm Booking
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