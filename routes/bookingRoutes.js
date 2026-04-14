const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  extendBooking,
  checkInBooking,
  checkOutBooking,
  markArrivalFromCv,
  getAllBookings,
  getPublicBookingTicket,
  getPublicBookingTicketView
} = require('../controllers/bookingController');
const { completeExpiredBookings } = require('../utils/scheduler');
const { protect, admin } = require('../middleware/authMiddleware');

// All booking routes require authentication
router.post('/create-payment-intent', protect, createPaymentIntent);
router.post('/', protect, createBooking);
router.get('/', protect, admin, getAllBookings);
router.get('/my-bookings', protect, getMyBookings);
router.get('/public/:id/view', getPublicBookingTicketView);
router.get('/public/:id', getPublicBookingTicket);
router.post('/cv/arrival', markArrivalFromCv);
router.get('/:id', getBookingById);
router.put('/:id/cancel', protect, cancelBooking);
router.put('/:id/extend', protect, extendBooking);
router.put('/:id/checkin', protect, checkInBooking);
router.put('/:id/checkout', protect, checkOutBooking);

// Admin route for manual slot release (for testing)
router.post('/complete-expired', protect, completeExpiredBookings);

module.exports = router;
