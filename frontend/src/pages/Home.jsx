import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../App.css';

const Home = () => {
  const [stats, setStats] = useState({
    locations: 0,
    slots: 0,
    bookings: 0
  });
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setStats({
        locations: 1,
        slots: 6,
        bookings: 0
      });
    }, 500);
  }, []);

  const features = [
    {
      icon: '⚡',
      title: 'Real-time Availability',
      description: 'Check parking slot availability instantly with live updates',
      color: '#00c6ff'
    },
    {
      icon: '🔐',
      title: 'Secure & Encrypted',
      description: 'Bank-level security for all your transactions and data',
      color: '#667eea'
    },
    {
      icon: '📱',
      title: 'Smart Dashboard',
      description: 'Intuitive interface with dark mode for better experience',
      color: '#22c55e'
    },
    {
      icon: '⏱️',
      title: 'Instant Bookings',
      description: 'Reserve your slot in seconds with one-click booking',
      color: '#f59e0b'
    }
  ];

  const slots = [
    { id: 'A1', status: 'vacant' },
    { id: 'A2', status: 'vacant' },
    { id: 'A3', status: 'vacant' },
    { id: 'B1', status: 'vacant' },
    { id: 'B2', status: 'vacant' },
    { id: 'B3', status: 'vacant' }
  ];

  return (
    <div className="home-page">
      <Navbar />
      
      {/* Futuristic Parking Lot Background Section */}
      <section style={{
        position: 'relative',
        minHeight: '100vh',
        background: `linear-gradient(135deg, rgba(10, 22, 40, 0.75), rgba(15, 35, 71, 0.8)), url(/parking-background.jpg) center/cover`,
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderBottom: '1px solid rgba(0, 198, 255, 0.1)'
      }}>
        {/* Enhanced Blur & Overlay for perfect text readability */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at center, rgba(10, 22, 40, 0.4) 0%, rgba(5, 17, 25, 0.75) 100%)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 1
        }}></div>
        
        {/* Hero Content */}
        <div className="hero-content" style={{ 
          position: 'relative', 
          zIndex: 2, 
          textAlign: 'center',
          maxWidth: '800px',
          padding: '2rem'
        }}>
          <h1 style={{
            fontSize: '4.5rem',
            fontWeight: '900',
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, #00ffff, #00c6ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 0 40px rgba(0, 255, 255, 0.4)',
            letterSpacing: '2px',
            filter: 'drop-shadow(0 0 20px rgba(0, 198, 255, 0.3))'
          }}>
            ParkEase
          </h1>
          <h2 style={{
            fontSize: '2.2rem',
            fontWeight: '700',
            marginBottom: '1.5rem',
            color: '#e0e7ff',
            letterSpacing: '1px',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
          }}>
            Smart Parking Simplified
          </h2>
          <p style={{
            fontSize: '1.2rem',
            color: '#ffffff',
            marginBottom: '2.5rem',
            maxWidth: '650px',
            margin: '0 auto 2.5rem',
            fontWeight: '400',
            letterSpacing: '0.5px',
            lineHeight: '1.8',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)'
          }}>
            Experience the future of parking with intelligent technology, real-time slot availability, and seamless one-click bookings.
          </p>
          <div style={{
            display: 'flex',
            gap: '1.5rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <Link to="/signup" style={{
              padding: '1.1rem 3rem',
              fontSize: '1.1rem',
              borderRadius: '50px',
              background: 'linear-gradient(135deg, #00c6ff, #00ffff)',
              color: '#0a1628',
              textDecoration: 'none',
              fontWeight: '700',
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 32px rgba(0, 198, 255, 0.5), 0 0 20px rgba(0, 255, 255, 0.3)',
              letterSpacing: '0.5px'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-3px)';
              e.target.style.boxShadow = '0 12px 48px rgba(0, 198, 255, 0.7), 0 0 30px rgba(0, 255, 255, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 8px 32px rgba(0, 198, 255, 0.5), 0 0 20px rgba(0, 255, 255, 0.3)';
            }}>
              🚀 Book Slot Now
            </Link>
            <Link to="/dashboard" style={{
              padding: '1.1rem 3rem',
              fontSize: '1.1rem',
              borderRadius: '50px',
              background: 'rgba(102, 126, 234, 0.2)',
              color: '#00ffff',
              textDecoration: 'none',
              fontWeight: '700',
              cursor: 'pointer',
              border: '2px solid rgba(0, 198, 255, 0.6)',
              transition: 'all 0.3s ease',
              letterSpacing: '0.5px',
              boxShadow: '0 4px 16px rgba(0, 198, 255, 0.2)',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(102, 126, 234, 0.35)';
              e.target.style.borderColor = 'rgba(0, 255, 255, 0.8)';
              e.target.style.transform = 'translateY(-3px)';
              e.target.style.boxShadow = '0 8px 32px rgba(0, 198, 255, 0.4), 0 0 20px rgba(0, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(102, 126, 234, 0.2)';
              e.target.style.borderColor = 'rgba(0, 198, 255, 0.6)';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 16px rgba(0, 198, 255, 0.2)';
            }}>
              📊 Dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="stats">
        <div className="stat-card">
          <div className="stat-number">{stats.locations}</div>
          <div className="stat-label">Active Location</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.slots}</div>
          <div className="stat-label">Parking Slots</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.bookings}</div>
          <div className="stat-label">Current Bookings</div>
        </div>
      </section>

      {/* MMCOE Location Preview */}
      <section style={{
        padding: '4rem 2rem',
        background: darkMode ? 'linear-gradient(135deg, rgba(0, 198, 255, 0.05), rgba(102, 126, 234, 0.05))' : 'linear-gradient(135deg, rgba(0, 198, 255, 0.08), rgba(102, 126, 234, 0.08))',
        borderTop: '1px solid rgba(0, 198, 255, 0.1)',
        borderBottom: '1px solid rgba(0, 198, 255, 0.1)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: '700',
            textAlign: 'center',
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #00c6ff, #667eea)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            MMCOE Parking Location
          </h2>
          <p style={{
            textAlign: 'center',
            color: darkMode ? 'var(--gray-400)' : '#666',
            marginBottom: '2rem',
            fontSize: '1rem'
          }}>
            Modern parking management for your convenience
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '1.5rem',
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            {slots.map(slot => (
              <div key={slot.id} style={{
                padding: '1.5rem',
                background: darkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(245, 247, 250, 0.8)',
                border: '1px solid rgba(0, 198, 255, 0.2)',
                borderRadius: '12px',
                textAlign: 'center',
                backdropFilter: 'blur(10px)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: 'translateY(0)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'rgba(0, 198, 255, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(0, 198, 255, 0.2)';
              }}>
                <div style={{
                  fontSize: '1.8rem',
                  fontWeight: 'bold',
                  color: '#00c6ff',
                  marginBottom: '0.5rem'
                }}>
                  Slot {slot.id}
                </div>
                <div style={{
                  fontSize: '0.85rem',
                  color: '#22c55e',
                  fontWeight: '600',
                  letterSpacing: '0.5px'
                }}>
                  ✓ VACANT
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="features">
        <h2 className="section-title">Why Choose ParkEase?</h2>
        <p style={{
          textAlign: 'center',
          color: darkMode ? 'var(--gray-400)' : '#666',
          marginBottom: '3rem',
          fontSize: '1.1rem',
          maxWidth: '600px',
          margin: '0 auto 3rem'
        }}>
          Experience the future of parking with intelligent technology, real-time updates, and seamless booking experience.
        </p>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card" style={{
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                width: '4px',
                height: '100%',
                background: feature.color,
                opacity: '0.6'
              }}></div>
              <div className="feature-icon" style={{
                fontSize: '2.5rem',
                marginBottom: '1rem'
              }}>
                {feature.icon}
              </div>
              <h3 className="feature-title" style={{
                color: darkMode ? 'var(--gray-100)' : '#1a2744',
                fontWeight: '700',
                marginBottom: '0.8rem'
              }}>
                {feature.title}
              </h3>
              <p className="feature-description" style={{
                color: darkMode ? 'var(--gray-400)' : '#555',
                lineHeight: '1.6'
              }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="features" style={{ paddingTop: '4rem', paddingBottom: '4rem', background: darkMode ? 'rgba(0, 198, 255, 0.03)' : 'rgba(0, 198, 255, 0.05)' }}>
        <h2 className="section-title" style={{ marginBottom: '1.5rem' }}>Ready to find parking?</h2>
        <p style={{
          textAlign: 'center',
          color: darkMode ? 'var(--gray-400)' : '#666',
          marginBottom: '2rem',
          fontSize: '1rem'
        }}>
          Join thousands of users enjoying hassle-free parking with ParkEase
        </p>
        <div style={{ textAlign: 'center' }}>
          <Link to="/signup" className="btn btn-primary btn-lg">Get Started Today</Link>
        </div>
      </section>

      <footer style={{ 
        textAlign: 'center', 
        padding: '2rem', 
        borderTop: '1px solid rgba(0, 198, 255, 0.1)',
        color: darkMode ? '#999' : '#666',
        fontSize: '0.9rem'
      }}>
        <p>© 2024 ParkEase. All rights reserved. | Smart Parking Made Simple</p>
      </footer>
    </div>
  );
};

export default Home;