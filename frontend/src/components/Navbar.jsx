import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../App.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-brand">
          🅿️ ParkEase
        </Link>

        <div className="navbar-nav">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>Home</Link>
          {isLoggedIn && (
            <>
              <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>Dashboard</Link>
              <Link to="/my-bookings" className={`nav-link ${isActive('/my-bookings') ? 'active' : ''}`}>My Bookings</Link>
            </>
          )}
        </div>

        <div className="navbar-buttons">
          {isLoggedIn ? (
            <>
              <span className="nav-link">Welcome, {user.name}</span>
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
