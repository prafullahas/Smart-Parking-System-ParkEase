const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const Location = require('../models/Location');
const User = require('../models/User');
const QRCode = require('qrcode');

// Mock payment gateway
const processPayment = async (amount, paymentMethod) => {
  // Simulate payment processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 90% success rate for demo purposes
  const success = Math.random() > 0.1;
  
  return {
    success,
    transactionId: success ? `TXN${Date.now()}${Math.floor(Math.random() * 1000)}` : null,
    message: success ? 'Payment successful' : 'Payment failed'
  };
};

// Generate QR Code for booking
const generateQRCode = async (bookingData) => {
  try {
    const qrData = JSON.stringify({
      bookingId: bookingData._id,
      userId: bookingData.userId,
      locationId: bookingData.locationId,
      slotNumber: bookingData.slotNumber,
      vehicleNumber: bookingData.vehicleNumber,
      startTime: bookingData.startTime,
      endTime: bookingData.endTime,
      amount: bookingData.totalAmount
    });

    // Generate QR code as data URI
    const qrCodeDataURI = await QRCode.toDataURL(qrData);
    return qrCodeDataURI;
  } catch (error) {
    console.error('QR Code generation error:', error);
    return null;
  }
};

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
  try {
    const { locationId, slotId, vehicleType, vehicleNumber, startTime, duration, paymentMethod } = req.body;

    // Validate required fields
    if (!locationId || !slotId || !vehicleType || !vehicleNumber || !startTime || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if location exists
    const location = await Location.findById(locationId);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    // Check if slot exists and is available
    const slot = await Slot.findById(slotId);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Slot not found'
      });
    }

    if (!slot.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Slot is not available'
      });
    }

    // Validate vehicle type matches slot
    if (slot.vehicleType !== vehicleType) {
      return res.status(400).json({
        success: false,
        message: `This slot is only available for ${slot.vehicleType}`
      });
    }

    // Calculate total amount
    const totalAmount = slot.pricePerHour * duration;

    // Calculate end time
    const start = new Date(startTime);
    const end = new Date(start.getTime() + duration * 60 * 60 * 1000);

    // Process payment
    const paymentResult = await processPayment(totalAmount, paymentMethod || 'upi');

    if (!paymentResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Payment failed. Please try again.',
        error: paymentResult.message
      });
    }

    // Create booking
    const booking = await Booking.create({
      userId: req.user._id,
      locationId,
      slotId,
      vehicleType,
      vehicleNumber: vehicleNumber.toUpperCase(),
      startTime: start,
      endTime: end,
      duration,
      totalAmount,
      paymentStatus: 'success',
      paymentMethod: paymentMethod || 'upi',
      transactionId: paymentResult.transactionId,
      status: 'active'
    });

    // Generate QR Code
    const qrCodeData = await generateQRCode({
      _id: booking._id,
      userId: req.user._id,
      locationId,
      slotNumber: slot.slotNumber,
      vehicleNumber: vehicleNumber.toUpperCase(),
      startTime: start,
      endTime: end,
      totalAmount
    });

    // Update booking with QR code
    booking.qrCode = qrCodeData;
    await booking.save();

    // Update slot availability
    slot.isAvailable = false;
    await slot.save();

    // Update location available slots
    location.availableSlots -= 1;
    await location.save();

    // Add booking to user's bookings array
    await User.findByIdAndUpdate(req.user._id, {
      $push: { bookings: booking._id }
    });

    // Populate booking data
    const populatedBooking = await Booking.findById(booking._id)
      .populate('locationId', 'name address coordinates')
      .populate('slotId', 'slotNumber floor')
      .populate('userId', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: populatedBooking
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking',
      error: error.message
    });
  }
};

// @desc    Get all bookings for logged-in user
// @route   GET /api/bookings/my-bookings
// @access  Private
const getMyBookings = async (req, res) => {
  try {
    const { status } = req.query;
    let query = { userId: req.user._id };

    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('locationId', 'name address coordinates type')
      .populate('slotId', 'slotNumber floor vehicleType')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('locationId', 'name address coordinates type')
      .populate('slotId', 'slotNumber floor vehicleType')
      .populate('userId', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking belongs to the user
    if (booking.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this booking'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking',
      error: error.message
    });
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking belongs to the user
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    // Check if booking is already cancelled or completed
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed booking'
      });
    }

    // Update booking status
    booking.status = 'cancelled';
    booking.paymentStatus = 'refunded';
    await booking.save();

    // Release the slot
    const slot = await Slot.findById(booking.slotId);
    if (slot) {
      slot.isAvailable = true;
      await slot.save();

      // Update location available slots
      const location = await Location.findById(booking.locationId);
      if (location) {
        location.availableSlots += 1;
        await location.save();
      }
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error.message
    });
  }
};

// @desc    Check-in to booking
// @route   PUT /api/bookings/:id/checkin
// @access  Private
const checkInBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking belongs to the user
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to check-in to this booking'
      });
    }

    if (booking.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Booking is not active'
      });
    }

    if (booking.checkInTime) {
      return res.status(400).json({
        success: false,
        message: 'Already checked in'
      });
    }

    booking.checkInTime = new Date();
    await booking.save();

    res.json({
      success: true,
      message: 'Checked in successfully',
      data: booking
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error checking in',
      error: error.message
    });
  }
};

// @desc    Check-out from booking
// @route   PUT /api/bookings/:id/checkout
// @access  Private
const checkOutBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking belongs to the user
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to check-out from this booking'
      });
    }

    if (booking.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Booking is not active'
      });
    }

    if (!booking.checkInTime) {
      return res.status(400).json({
        success: false,
        message: 'Please check-in first'
      });
    }

    if (booking.checkOutTime) {
      return res.status(400).json({
        success: false,
        message: 'Already checked out'
      });
    }

    booking.checkOutTime = new Date();
    booking.status = 'completed';
    await booking.save();

    // Release the slot
    const slot = await Slot.findById(booking.slotId);
    if (slot) {
      slot.isAvailable = true;
      await slot.save();

      // Update location available slots
      const location = await Location.findById(booking.locationId);
      if (location) {
        location.availableSlots += 1;
        await location.save();
      }
    }

    res.json({
      success: true,
      message: 'Checked out successfully',
      data: booking
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error checking out',
      error: error.message
    });
  }
};

// @desc    Get all bookings (Admin)
// @route   GET /api/bookings
// @access  Private/Admin
const getAllBookings = async (req, res) => {
  try {
    const { status, locationId, startDate, endDate } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }

    if (locationId) {
      query.locationId = locationId;
    }

    if (startDate || endDate) {
      query.bookingTime = {};
      if (startDate) {
        query.bookingTime.$gte = new Date(startDate);
      }
      if (endDate) {
        query.bookingTime.$lte = new Date(endDate);
      }
    }

    const bookings = await Booking.find(query)
      .populate('locationId', 'name address')
      .populate('slotId', 'slotNumber floor')
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  checkInBooking,
  checkOutBooking,
  getAllBookings
};
