const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  sendEmailOtp,
  verifyEmailOtp,
  resendEmailOtp,
  sendOtp,
  verifyOtp,
  resendOtp,
  getProfile,
  updateProfile,
  logout,
  getAllUsers,
  blockUser
} = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/send-email-otp', sendEmailOtp);
router.post('/verify-email-otp', verifyEmailOtp);
router.post('/resend-email-otp', resendEmailOtp);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/logout', protect, logout);

// Admin routes
router.get('/users', protect, admin, getAllUsers);
router.put('/users/:id/block', protect, admin, blockUser);

module.exports = router;
