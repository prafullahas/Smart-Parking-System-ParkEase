import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';

const EmailOtpAuth = () => {
  const [searchParams] = useSearchParams();
  const prefilledEmail = (searchParams.get('email') || '').trim().toLowerCase();
  const [email, setEmail] = useState(prefilledEmail);
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(
    searchParams.get('from') === 'signup' && Boolean(prefilledEmail) ? 2 : 1
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const isFromSignup = searchParams.get('from') === 'signup';

  const isValidEmail = /^[\w-.+]+@[\w-]+\.[\w-.]+$/.test(email.trim().toLowerCase());

  const handleSendOtp = async () => {
    try {
      setLoading(true);
      setMessage('');
      const res = await api.post('/auth/send-email-otp', { email: email.trim().toLowerCase() });
      setStep(2);
      setMessage(res.data?.message || 'OTP sent to email');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setLoading(true);
      setMessage('');
      const res = await api.post('/auth/verify-email-otp', {
        email: email.trim().toLowerCase(),
        otp
      });
      const token = res.data?.token;
      if (token) {
        localStorage.setItem('token', token);
      }
      const linkedUser = res.data?.data?.user;
      if (linkedUser) {
        localStorage.setItem('user', JSON.stringify(linkedUser));
        setTimeout(() => navigate(linkedUser.role === 'admin' ? '/admin-dashboard' : '/dashboard'), 600);
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setMessage('Account not found. Please sign up first.');
      }
      setMessage('Verified');
    } catch (error) {
      setMessage(error.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setLoading(true);
      setMessage('');
      const res = await api.post('/auth/resend-email-otp', { email: email.trim().toLowerCase() });
      setMessage(res.data?.message || 'OTP sent to email');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0f172a', color: '#fff' }}>
      <div style={{ width: '100%', maxWidth: 440, background: '#111827', padding: 24, borderRadius: 12, border: '1px solid #334155' }}>
        <h2 style={{ marginTop: 0 }}>Email OTP Authentication</h2>
        <p style={{ marginTop: -6, marginBottom: 14 }}>
          Admin login with password?{' '}
          <Link to="/password-login" style={{ color: '#93c5fd' }}>
            Use password login
          </Link>
        </p>
        {isFromSignup && (
          <p style={{ marginTop: -8, marginBottom: 14, color: '#86efac' }}>
            Account created. Verify your email with OTP to continue.
          </p>
        )}

        {step === 1 && (
          <>
            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: 10, marginBottom: 12, borderRadius: 8, border: '1px solid #475569' }}
            />
            <button
              onClick={handleSendOtp}
              disabled={loading || !isValidEmail}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff' }}
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              style={{ width: '100%', padding: 10, marginBottom: 12, borderRadius: 8, border: '1px solid #475569' }}
            />
            <button
              onClick={handleVerifyOtp}
              disabled={loading || otp.length !== 6 || !isValidEmail}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', marginBottom: 10 }}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              onClick={handleResendOtp}
              disabled={loading || !isValidEmail}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #64748b', background: 'transparent', color: '#fff' }}
            >
              Resend OTP
            </button>
          </>
        )}

        {message && <p style={{ marginTop: 12, color: '#93c5fd' }}>{message}</p>}
      </div>
    </div>
  );
};

export default EmailOtpAuth;
