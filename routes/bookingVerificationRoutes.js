const express = require('express');
const router = express.Router();
const { getBookingVerificationById } = require('../controllers/bookingController');

router.get('/:id', getBookingVerificationById);

module.exports = router;
