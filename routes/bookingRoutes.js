const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  checkInBooking,
  checkOutBooking,
  getAllBookings
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

// All booking routes require authentication
router.post('/', protect, createBooking);
router.get('/my-bookings', protect, getMyBookings);
router.get('/:id', protect, getBookingById);
router.put('/:id/cancel', protect, cancelBooking);
router.put('/:id/checkin', protect, checkInBooking);
router.put('/:id/checkout', protect, checkOutBooking);

// Admin route
router.get('/', protect, getAllBookings);

module.exports = router;
