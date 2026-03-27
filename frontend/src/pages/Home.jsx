import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

const Home = () => {
  const [stats, setStats] = useState({
    locations: 0,
    slots: 0,
    bookings: 0
  });

  const [testimonials] = useState([
    { id: 1, name: "Alex Johnson", text: "Saved me so much time! Found parking in seconds." },
    { id: 2, name: "Maria Garcia", text: "The easiest parking system I've ever used!" },
    { id: 3, name: "David Smith", text: "QR code entry makes everything seamless." }
  ]);

  useEffect(() => {
    // Simulate loading stats
    setTimeout(() => {
      setStats({
        locations: 15,
        slots: 240,
        bookings: 1280
      });
    }, 1000);
  }, []);

  return (
    <div className="home-page">
      <header className="home-header">
        <h1>🚗 Smart Parking Management System</h1>
        <nav className="home-nav">
          <Link to="/login" className="nav-button">Login</Link>
          <Link to="/signup" className="nav-button">Sign Up</Link>
        </nav>
      </header>

      <main className="home-main">
        <section className="hero-section">
          <div className="hero-content">
            <h2>Find & Book Parking Slots in Seconds ⏱️</h2>
            <p>Your smart solution for hassle-free parking</p>
            <div className="hero-buttons">
              <Link to="/signup" className="cta-button primary">Get Started 🚀</Link>
              <Link to="/login" className="cta-button secondary">Learn More ℹ️</Link>
            </div>
          </div>
          
          {/* 3D Isometric Illustration */}
          <div className="isometric-illustration">
            <div className="iso-scene">
              {/* Mobile Phone */}
              <div className="iso-phone">
                <div className="phone-screen">
                  <div className="phone-app">
                    <div className="app-header">🅿️ Smart Parking</div>
                    <div className="app-slots">
                      <div className="mini-slot available"></div>
                      <div className="mini-slot available"></div>
                      <div className="mini-slot booked"></div>
                      <div className="mini-slot available"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Parking Grid */}
              <div className="iso-parking-grid">
                {/* Parking Slots */}
                <div className="iso-slot highlighted">
                  <div className="slot-marker">P1</div>
                </div>
                <div className="iso-slot">
                  <div className="slot-marker">P2</div>
                </div>
                <div className="iso-slot occupied">
                  <div className="parked-car">🚗</div>
                </div>
                <div className="iso-slot">
                  <div className="slot-marker">P4</div>
                </div>
              </div>

              {/* Moving Car */}
              <div className="iso-car-moving">
                <div className="car-3d">🚙</div>
                <div className="car-arrow">→</div>
              </div>

              {/* QR Code Scanner */}
              <div className="iso-qr-scanner">
                <div className="qr-code">
                  <div className="qr-pattern">
                    <div className="qr-corner"></div>
                    <div className="qr-corner"></div>
                    <div className="qr-corner"></div>
                    <div className="qr-corner"></div>
                  </div>
                </div>
                <div className="scan-line"></div>
                <div className="scan-text">✓ VERIFIED</div>
              </div>

              {/* Connecting Lines */}
              <div className="connection-line line-1"></div>
              <div className="connection-line line-2"></div>
              <div className="connection-line line-3"></div>

              {/* Floating Icons */}
              <div className="floating-icon icon-1">📱</div>
              <div className="floating-icon icon-2">🅿️</div>
              <div className="floating-icon icon-3">✓</div>
            </div>
          </div>
        </section>

        <section className="stats-section">
          <div className="stats-container">
            <div className="stat-item">
              <h3>{stats.locations}+</h3>
              <p>Locations</p>
            </div>
            <div className="stat-item">
              <h3>{stats.slots}+</h3>
              <p>Parking Slots</p>
            </div>
            <div className="stat-item">
              <h3>{stats.bookings}+</h3>
              <p>Happy Customers</p>
            </div>
          </div>
        </section>

        <section className="info-section">
          <h2>How It Works 🚀</h2>
          <div className="premium-steps">
            <div className="premium-step-card">
              <div className="step-badge">1</div>
              <div className="step-icon-premium">👤</div>
              <h3>Sign Up</h3>
              <p>Create your account in seconds and join thousands of happy parkers</p>
              <div className="card-glow glow-1"></div>
            </div>
            <div className="premium-step-card">
              <div className="step-badge">2</div>
              <div className="step-icon-premium">📍</div>
              <h3>Find Location</h3>
              <p>Search and select from our vast network of premium parking spots</p>
              <div className="card-glow glow-2"></div>
            </div>
            <div className="premium-step-card">
              <div className="step-badge">3</div>
              <div className="step-icon-premium">🅿️</div>
              <h3>Book Your Slot</h3>
              <p>Pick your perfect spot with real-time availability updates</p>
              <div className="card-glow glow-3"></div>
            </div>
            <div className="premium-step-card">
              <div className="step-badge">4</div>
              <div className="step-icon-premium">✓</div>
              <h3>Park & Go</h3>
              <p>Complete payment, get QR code, and enjoy hassle-free parking</p>
              <div className="card-glow glow-4"></div>
            </div>
          </div>
        </section>

        <section className="features-section">
          <h2>FEATURES</h2>
          <div className="premium-features-grid">
            <div className="premium-feature-card">
              <div className="feature-glow-bg glow-blue"></div>
              <div className="feature-icon-modern">
                <div className="icon-wrapper icon-realtime">
                  <span className="icon-emoji">⏱️</span>
                  <div className="icon-pulse"></div>
                </div>
              </div>
              <h3>Real-time Availability</h3>
              <p>See live updates of available parking spots with instant notifications and smart recommendations</p>
              <div className="feature-border-glow"></div>
            </div>
            
            <div className="premium-feature-card">
              <div className="feature-glow-bg glow-purple"></div>
              <div className="feature-icon-modern">
                <div className="icon-wrapper icon-payment">
                  <span className="icon-emoji">💳</span>
                  <div className="icon-pulse"></div>
                </div>
              </div>
              <h3>Secure Payments</h3>
              <p>Multiple payment options with bank-grade security, instant confirmations, and digital receipts</p>
              <div className="feature-border-glow"></div>
            </div>
            
            <div className="premium-feature-card">
              <div className="feature-glow-bg glow-green"></div>
              <div className="feature-icon-modern">
                <div className="icon-wrapper icon-mobile">
                  <span className="icon-emoji">📱</span>
                  <div className="icon-pulse"></div>
                </div>
              </div>
              <h3>Mobile Friendly</h3>
              <p>Seamless experience on any device, anywhere, anytime with responsive design and offline support</p>
              <div className="feature-border-glow"></div>
            </div>
            
            <div className="premium-feature-card">
              <div className="feature-glow-bg glow-pink"></div>
              <div className="feature-icon-modern">
                <div className="icon-wrapper icon-location">
                  <span className="icon-emoji">🅿️</span>
                  <div className="icon-pulse"></div>
                </div>
              </div>
              <h3>Multiple Locations</h3>
              <p>Park at various convenient locations across the city with smart navigation and availability maps</p>
              <div className="feature-border-glow"></div>
            </div>
          </div>
        </section>

        <section className="testimonials-section">
          <h2>What Our Users Say 💬</h2>
          <div className="testimonials-container">
            {testimonials.map(testimonial => (
              <div key={testimonial.id} className="testimonial-card">
                <p>"{testimonial.text}"</p>
                <h4>- {testimonial.name}</h4>
              </div>
            ))}
          </div>
        </section>

        <section className="cta-section">
          <h2>Ready to Simplify Your Parking? 🎯</h2>
          <p>Join thousands of satisfied users today!</p>
          <Link to="/signup" className="cta-button large">Start Parking Now 🚗</Link>
        </section>
      </main>

      <footer className="home-footer">
        <p>&copy; 2025 Smart Parking Management System. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;