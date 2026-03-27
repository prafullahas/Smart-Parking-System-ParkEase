import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import '../App.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get user from localStorage
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData) {
          navigate('/login');
          return;
        }
        setUser(userData);
        
        // Fetch locations
        const locationsResponse = await api.get('/locations');
        setLocations(locationsResponse.data.data);
        setFilteredLocations(locationsResponse.data.data);

        // Fetch user's bookings
        try {
          const bookingsResponse = await api.get('/bookings/my-bookings');
          setMyBookings(bookingsResponse.data.data || []);
        } catch (bookingErr) {
          console.log('No bookings found or error fetching bookings');
        }
      } catch (err) {
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredLocations(locations);
    } else {
      const filtered = locations.filter(location =>
        location.name.toLowerCase().includes(query.toLowerCase()) ||
        location.address.toLowerCase().includes(query.toLowerCase()) ||
        location.type.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredLocations(filtered);
    }
  };

  const handleLocationSelect = (locationId) => {
    navigate(`/book-slot?locationId=${locationId}`);
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>ParkEase 🚗</h1>
        <div className="user-info">
          <button 
            onClick={() => navigate('/my-bookings')} 
            className="my-bookings-button"
            title="View My Bookings"
          >
            📋 My Bookings {myBookings.length > 0 && `(${myBookings.length})`}
          </button>
          <span>Welcome, {user?.name}!</span>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Search Bar Section */}
        <section className="search-section">
          <div className="search-container">
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search nearby locations by name, address, or type..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              {searchQuery && (
                <button 
                  className="clear-search-button"
                  onClick={() => handleSearch('')}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="search-results-info">
                Found {filteredLocations.length} location{filteredLocations.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </section>

        <section className="locations-section">
          <h2>Available Parking Locations</h2>
          
          {/* Live Marquee Banner */}
          <div className="live-marquee-banner">
            <div className="marquee-content">
              <span className="marquee-item">
                <span className="marquee-icon">🔥</span>
                City Mall Parking is currently 85% full
              </span>
              <span className="marquee-item">
                <span className="marquee-icon">⚡</span>
                Airport Premium Parking has the lowest bike parking rates today
              </span>
              <span className="marquee-item">
                <span className="marquee-icon">📍</span>
                Grand Cinema Complex is getting busier — 70% slots booked
              </span>
              <span className="marquee-item">
                <span className="marquee-icon">🚗</span>
                Sports Stadium Parking offering 10% discount on bike parking
              </span>
              {/* Duplicate for seamless loop */}
              <span className="marquee-item">
                <span className="marquee-icon">🔥</span>
                City Mall Parking is currently 85% full
              </span>
              <span className="marquee-item">
                <span className="marquee-icon">⚡</span>
                Airport Premium Parking has the lowest bike parking rates today
              </span>
              <span className="marquee-item">
                <span className="marquee-icon">📍</span>
                Grand Cinema Complex is getting busier — 70% slots booked
              </span>
              <span className="marquee-item">
                <span className="marquee-icon">🚗</span>
                Sports Stadium Parking offering 10% discount on bike parking
              </span>
            </div>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          {filteredLocations.length === 0 && searchQuery ? (
            <div className="no-results">
              <p>No locations found matching "{searchQuery}"</p>
              <button onClick={() => handleSearch('')} className="reset-search-button">
                Show All Locations
              </button>
            </div>
          ) : (
            <div className="locations-grid">
              {filteredLocations.map((location) => (
                <div key={location._id} className="location-card">
                  <h3>{location.name}</h3>
                  <p>📍 {location.address}</p>
                  <p>🏢 Type: {location.type}</p>
                  <p>🅿️ Available Slots: {location.availableSlots}/{location.totalSlots}</p>
                  <p>
                    💰 Price: ₹{location.pricePerHour.car}/hr (Car) | 
                    ₹{location.pricePerHour.bike}/hr (Bike)
                  </p>
                  <button 
                    onClick={() => handleLocationSelect(location._id)}
                    className="select-button"
                    disabled={location.availableSlots === 0}
                  >
                    {location.availableSlots === 0 ? 'No Slots Available' : 'Select Location'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;