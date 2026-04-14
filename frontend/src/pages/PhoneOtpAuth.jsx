import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';

const PhoneOtpAuth = () => {
  const [searchParams] = useSearchParams();
  const prefilledPhone = (searchParams.get('phone') || '').replace(/\D/g, '').slice(0, 10);
  const [phone, setPhone] = useState(prefilledPhone);
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(
    searchParams.get('from') === 'signup' && prefilledPhone.length === 10 ? 2 : 1
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const isFromSignup = searchParams.get('from') === 'signup';

  const normalizedPhone = phone.replace(/\D/g, '').slice(0, 10);

  const handleSendOtp = async () => {
    try {
      setLoading(true);
      setMessage('');
      const res = await api.post('/auth/send-otp', { phone: normalizedPhone });
      setStep(2);
      setMessage(res.data?.message || 'OTP sent successfully (check console)');
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
      const res = await api.post('/auth/verify-otp', { phone: normalizedPhone, otp });
      const token = res.data?.token;
      if (token) {
        localStorage.setItem('token', token);
      }
      const linkedUser = res.data?.data?.user;
      if (linkedUser) {
        localStorage.setItem('user', JSON.stringify(linkedUser));
      } else {
        localStorage.setItem(
          'user',
          JSON.stringify({
            name: `User ${normalizedPhone.slice(-4)}`,
            phone: normalizedPhone,
            role: 'user'
          })
        );
      }
      setMessage('Verification success');
      setTimeout(() => navigate('/dashboard'), 800);
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
      const res = await api.post('/auth/resend-otp', { phone: normalizedPhone });
      setMessage(res.data?.message || 'OTP resent successfully (check console)');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0f172a', color: '#fff' }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#111827', padding: 24, borderRadius: 12, border: '1px solid #334155' }}>
        <h2 style={{ marginTop: 0 }}>Phone OTP Authentication</h2>
        {isFromSignup && (
          <p style={{ marginTop: -8, marginBottom: 14, color: '#86efac' }}>
            Account created. Verify your phone with OTP to continue.
          </p>
        )}
        <p style={{ marginTop: -8, marginBottom: 14 }}>
          Prefer password login? <a href="/password-login" style={{ color: '#93c5fd' }}>Use password login</a>
        </p>

        {step === 1 && (
          <>
            <input
              type="tel"
              placeholder="Enter 10-digit phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ width: '100%', padding: 10, marginBottom: 12, borderRadius: 8, border: '1px solid #475569' }}
            />
            <button
              onClick={handleSendOtp}
              disabled={loading || normalizedPhone.length !== 10}
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
              disabled={loading || otp.length !== 6}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', marginBottom: 10 }}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              onClick={handleResendOtp}
              disabled={loading}
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

export default PhoneOtpAuth;
