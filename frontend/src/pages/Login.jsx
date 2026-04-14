import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import '../App.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const darkMode = true;
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    if (!password) {
      setError('Please enter your password');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/login', { email: email.trim().toLowerCase(), password });
      
      if (response.data.success) {
        setSuccess('Login successful! Redirecting...');
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data));
        
        setTimeout(() => {
          // Redirect based on user role
          if (response.data.data.role === 'admin') {
            navigate('/admin-dashboard');
          } else {
            navigate('/dashboard');
          }
        }, 500);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Login failed. Please try again.';
      setError(errorMessage);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: darkMode
        ? 'linear-gradient(135deg, #0f172a 0%, #1a2744 50%, #0a0e27 100%)'
        : 'linear-gradient(135deg, #f5f7fa 0%, #e8eef5 50%, #f0f4f9 100%)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      transition: 'background 0.6s ease'
    }}>
      <Navbar />
      
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem'
      }}>
        {/* Login Container */}
        <div style={{
          background: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
          border: `1px solid ${darkMode ? 'rgba(0, 198, 255, 0.2)' : 'rgba(0, 198, 255, 0.3)'}`,
          borderRadius: '1.5rem',
          padding: '3rem 2rem',
          maxWidth: '500px',
          width: '100%',
          backdropFilter: 'blur(10px)',
          boxShadow: darkMode
            ? '0 8px 32px rgba(0, 0, 0, 0.3)'
            : '0 8px 32px rgba(0, 0, 0, 0.1)',
          animation: 'fadeInUp 0.6s ease'
        }}>
          {/* Header */}
          <h2 style={{
            fontSize: '2rem',
            fontWeight: '800',
            color: darkMode ? 'var(--gray-100)' : '#1a2744',
            marginBottom: '0.5rem',
            textAlign: 'center',
            letterSpacing: '-0.5px'
          }}>
            🔑 Login
          </h2>
          <p style={{
            color: darkMode ? 'var(--gray-400)' : '#666',
            textAlign: 'center',
            fontSize: '0.95rem',
            marginBottom: '2rem',
            margin: '0 0 2rem 0'
          }}>
            Welcome back! Sign in to your account
          </p>

          {/* Error Message */}
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#ef4444',
              padding: '0.875rem 1rem',
              borderRadius: '0.75rem',
              marginBottom: '1.5rem',
              fontSize: '0.9rem',
              fontWeight: '500',
              animation: 'slideInDown 0.3s ease'
            }}>
              ✕ {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              color: '#22c55e',
              padding: '0.875rem 1rem',
              borderRadius: '0.75rem',
              marginBottom: '1.5rem',
              fontSize: '0.9rem',
              fontWeight: '500',
              animation: 'slideInDown 0.3s ease'
            }}>
              ✓ {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Email Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{
                color: darkMode ? 'var(--gray-300)' : '#333',
                fontWeight: '600',
                fontSize: '0.95rem'
              }}>
                📧 Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={loading}
                autoComplete="email"
                style={{
                  padding: '0.875rem 1rem',
                  borderRadius: '0.75rem',
                  border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                  background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  color: darkMode ? 'var(--gray-100)' : '#1a2744',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.border = '1px solid rgba(0, 198, 255, 0.5)';
                  e.target.style.background = darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
                }}
                onBlur={(e) => {
                  e.target.style.border = `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`;
                  e.target.style.background = darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
                }}
              />
            </div>

            {/* Password Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{
                color: darkMode ? 'var(--gray-300)' : '#333',
                fontWeight: '600',
                fontSize: '0.95rem'
              }}>
                🔐 Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                disabled={loading}
                minLength="6"
                autoComplete="current-password"
                style={{
                  padding: '0.875rem 1rem',
                  borderRadius: '0.75rem',
                  border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                  background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  color: darkMode ? 'var(--gray-100)' : '#1a2744',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.border = '1px solid rgba(0, 198, 255, 0.5)';
                  e.target.style.background = darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
                }}
                onBlur={(e) => {
                  e.target.style.border = `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`;
                  e.target.style.background = darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
                }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.95rem 1.5rem',
                background: 'linear-gradient(135deg, #00c6ff, #667eea)',
                border: 'none',
                borderRadius: '0.75rem',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.3s ease',
                marginTop: '0.5rem'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 10px 20px rgba(0, 198, 255, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              {loading ? '🔄 Logging in...' : '✓ Login'}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            margin: '2rem 0',
            color: darkMode ? 'var(--gray-400)' : '#999'
          }}>
            <div style={{ flex: 1, height: '1px', background: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}></div>
            <span style={{ fontSize: '0.85rem' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}></div>
          </div>

          {/* Signup Link */}
          <div style={{
            textAlign: 'center'
          }}>
            <p style={{
              color: darkMode ? 'var(--gray-400)' : '#666',
              fontSize: '0.95rem',
              margin: '0 0 1rem 0'
            }}>
              Don't have an account?
            </p>
            <Link
              to="/phone-auth"
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                background: darkMode ? 'rgba(22, 163, 74, 0.2)' : 'rgba(22, 163, 74, 0.15)',
                border: '1px solid rgba(22, 163, 74, 0.45)',
                borderRadius: '0.75rem',
                color: darkMode ? '#86efac' : '#166534',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '0.95rem',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                marginBottom: '0.9rem'
              }}
            >
              Login with OTP
            </Link>
            <br />
            <Link
              to="/signup"
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                background: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                border: `1px solid ${darkMode ? 'rgba(0, 198, 255, 0.3)' : 'rgba(0, 198, 255, 0.3)'}`,
                borderRadius: '0.75rem',
                color: darkMode ? 'var(--primary)' : '#0066ff',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '0.95rem',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = darkMode ? 'rgba(0, 198, 255, 0.15)' : 'rgba(0, 198, 255, 0.15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Create Account →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;