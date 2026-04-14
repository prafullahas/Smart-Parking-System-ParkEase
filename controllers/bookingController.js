const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const Location = require('../models/Location');
const User = require('../models/User');
const QRCode = require('qrcode');
//const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const mongoose = require('mongoose');
const os = require('os');
const { sendNotification } = require('../utils/notificationService');

const formatDateTime = (value) => new Date(value).toLocaleString('en-IN');

const getUserName = (user) => user?.name || 'User';

const buildBookingSummaryHtml = ({ user, booking, slotNumber, locationName, reason = '', extraLine = '' }) => {
  return `
    <div style="font-family:Arial,sans-serif;color:#0f172a">
      <h2>ParkEase Booking Update</h2>
      <p>Hello ${getUserName(user)},</p>
      <p>${extraLine || 'Please find your booking details below.'}</p>
      <ul>
        <li><strong>Booking ID:</strong> ${booking?._id || 'N/A'}</li>
        <li><strong>Slot:</strong> ${slotNumber || 'N/A'}</li>
        <li><strong>Location:</strong> ${locationName || 'N/A'}</li>
        <li><strong>Vehicle:</strong> ${booking?.vehicleNumber || 'N/A'}</li>
        <li><strong>Start:</strong> ${booking?.startTime ? formatDateTime(booking.startTime) : 'N/A'}</li>
        <li><strong>End:</strong> ${booking?.endTime ? formatDateTime(booking.endTime) : 'N/A'}</li>
        <li><strong>Payment Status:</strong> ${booking?.paymentStatus || 'N/A'}</li>
      </ul>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
    </div>
  `;
};

const resolveLocalIPv4 = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
};

// Process payment with Stripe or mock payment for development
const processPayment = async (amount, paymentMethod, paymentMethodId) => {
  try {
    // Check if Stripe is properly configured
    if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_your_stripe_secret_key_here') {
      // Use real Stripe payment
      //const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

      // Convert amount to cents (Stripe expects amounts in smallest currency unit)
      const amountInCents = Math.round(amount * 100);

      let paymentIntent;

      if (paymentMethodId) {
        // Confirm existing payment intent
        paymentIntent = await stripe.paymentIntents.confirm(paymentMethodId, {
          return_url: `${process.env.FRONTEND_URL}/payment/success`,
        });
      } else {
        // Create new payment intent
        paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: 'inr',
          payment_method_types: ['card', 'upi', 'netbanking'],
          metadata: {
            paymentMethod: paymentMethod
          }
        });
      }

      return {
        success: paymentIntent.status === 'succeeded',
        transactionId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        message: paymentIntent.status === 'succeeded' ? 'Payment successful' : 'Payment processing'
      };
    } else {
      // Use mock payment for development
      console.log('Using mock payment (Stripe not configured)');

      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Always succeed for demo purposes
      return {
        success: true,
        transactionId: `RZP_MOCK_TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        clientSecret: 'mock_client_secret_' + Date.now(),
        message: 'Mock Razorpay-style payment successful'
      };
    }
  } catch (error) {
    console.error('Payment error:', error);
    return {
      success: false,
      transactionId: null,
      message: error.message || 'Payment failed'
    };
  }
};

// Generate QR Code for booking
const generateQRCode = async (bookingData) => {
  try {
    const localIp = resolveLocalIPv4();
    const defaultFrontend = localIp ? `http://${localIp}:5173` : 'http://localhost:5173';
    const frontendBase =
      process.env.QR_PUBLIC_BASE_URL ||
      process.env.FRONTEND_PUBLIC_URL ||
      process.env.FRONTEND_URL ||
      defaultFrontend;
    const qrData = `${frontendBase}/booking/${bookingData._id}`;

    // Generate QR code as data URI
    const qrCodeDataURI = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrCodeDataURI;
  } catch (error) {
    console.error('QR Code generation error:', error);
    return null;
  }
};

// @desc    Booking verification payload for QR page
// @route   GET /api/booking/:id
// @access  Public
const getBookingVerificationById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('locationId', 'name address')
      .populate('slotId', 'slotNumber')
      .populate('userId', 'name');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Invalid QR Code'
      });
    }

    const currentTime = new Date();
    const isExpired = currentTime > new Date(booking.endTime);

    return res.json({
      success: true,
      bookingId: booking._id,
      userName: booking.userId?.name || 'N/A',
      location: booking.locationId?.name || 'N/A',
      slotNumber: booking.slotId?.slotNumber || 'N/A',
      vehicleNumber: booking.vehicleNumber,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: isExpired ? 'expired' : 'valid'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch booking verification details',
      error: error.message
    });
  }
};

// @desc    Create payment intent
// @route   POST /api/bookings/create-payment-intent
// @access  Private
const createPaymentIntent = async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    const paymentResult = await processPayment(amount, paymentMethod);

    res.json({
      success: true,
      clientSecret: paymentResult.clientSecret,
      transactionId: paymentResult.transactionId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment intent',
      error: error.message
    });
  }
};

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
  try {
    if (req.user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account is blocked from placing new bookings.'
      });
    }

    const { locationId, slotId, vehicleNumber, startTime, duration, paymentMethod, transactionId } = req.body;

    if (!locationId || !slotId || !vehicleNumber || !startTime || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    if (req.body.vehicleType && req.body.vehicleType !== 'car') {
      return res.status(400).json({
        success: false,
        message: 'Only car parking is supported'
      });
    }

    const vehicleType = 'car';

    let location = await Location.findById(locationId);
    if (!location) {
      if (locationId === 'mock-location-1') {
        const mockLocation = {
          _id: 'mock-location-1',
          name: 'Mock Parking Location',
          address: 'Mock Address',
          save: async () => mockLocation,
          availableSlots: 6
        };
        location = mockLocation;
      } else {
        return res.status(404).json({
          success: false,
          message: 'Location not found'
        });
      }
    }

    let slot = await Slot.findById(slotId);
    if (!slot) {
      if (slotId.startsWith('A') || slotId.startsWith('B')) {
        const mockSlot = {
          _id: slotId,
          slotNumber: slotId,
          vehicleType: 'car',
          pricePerHour: 50,
          isAvailable: true,
          save: async () => mockSlot
        };
        slot = mockSlot;
      } else {
        return res.status(404).json({
          success: false,
          message: 'Slot not found'
        });
      }
    }

    const now = new Date();
    const activeSlotBooking = await Booking.findOne({
      slotId: slot._id,
      status: 'active',
      endTime: { $gt: now }
    });

    if (activeSlotBooking) {
      const alternatives = await Slot.find({
        locationId,
        isAvailable: true,
        vehicleType: 'car',
        _id: { $ne: slot._id }
      }).sort({ slotNumber: 1 }).limit(3);
      const alternativesText = alternatives.length
        ? alternatives.map((s) => s.slotNumber).join(', ')
        : 'No alternatives currently available';
      await sendNotification({
        user: req.user,
        type: 'SLOT_UNAVAILABLE',
        message: `Selected slot is unavailable. Alternative slots: ${alternativesText}.`,
        smsMessage: '❌ Selected slot is unavailable. Please choose another slot.',
        whatsappMessage: `❌ Selected slot ${slot.slotNumber} is unavailable. Try: ${alternativesText}`,
        emailSubject: 'Slot Unavailable - ParkEase',
        emailHtml: `
          <div style="font-family:Arial,sans-serif">
            <h3>Selected slot is unavailable</h3>
            <p>Hello ${getUserName(req.user)}, slot <strong>${slot.slotNumber}</strong> is already booked.</p>
            <p>Suggested alternatives: <strong>${alternativesText}</strong></p>
          </div>
        `
      });
      return res.status(409).json({
        success: false,
        message: 'Slot is currently booked for this time window'
      });
    }

    const totalAmount = slot.pricePerHour * duration;
    const start = new Date(startTime);
    const end = new Date(start.getTime() + duration * 60 * 60 * 1000);
    const normalizedVehicleNumber = vehicleNumber.toUpperCase().trim();

    const latestSensorRecord = await mongoose.connection
      .collection('bookings')
      .find({ slot_id: slot.slotNumber })
      .sort({ timestamp: -1 })
      .limit(1)
      .toArray();

    if (latestSensorRecord.length > 0) {
      const sensor = latestSensorRecord[0];
      if (sensor.is_parked === true) {
        await sendNotification({
          user: req.user,
          type: 'SLOT_UNAVAILABLE',
          message: `Slot ${slot.slotNumber} is occupied. Please choose another slot.`
        });
        return res.status(409).json({
          success: false,
          message: `Sensor shows slot ${slot.slotNumber} is occupied. Please choose another slot.`
        });
      }

      const sensorVehicle = (sensor.vehicle_number || '').toString().trim().toUpperCase();
      if (sensorVehicle && sensorVehicle !== normalizedVehicleNumber) {
        return res.status(409).json({
          success: false,
          message: `Vehicle number does not match sensor input for slot ${slot.slotNumber}.`
        });
      }
    }

    const conflictConditions = [{ vehicleNumber: normalizedVehicleNumber }];
    if (slot._id) {
      conflictConditions.push({ slotId: slot._id });
    }

    const conflictingBooking = await Booking.findOne({
      status: 'active',
      startTime: { $lt: end },
      endTime: { $gt: start },
      $or: conflictConditions
    });

    if (conflictingBooking) {
      return res.status(409).json({
        success: false,
        message: 'Booking conflict with live sensor data. Please choose another slot or time.'
      });
    }

    let paymentResult = { success: true, transactionId: null, message: 'Pay Later selected' };
    let finalPaymentStatus = 'PENDING';
    const normalizedPaymentMethod = paymentMethod || 'later';

    if (normalizedPaymentMethod !== 'later') {
      paymentResult = await processPayment(totalAmount, normalizedPaymentMethod, transactionId);
      finalPaymentStatus = paymentResult.success ? 'COMPLETED' : 'FAILED';
    }

    if (!paymentResult.success && normalizedPaymentMethod !== 'later') {
      return res.status(400).json({
        success: false,
        message: 'Payment failed. Please try again.',
        error: paymentResult.message
      });
    }

    const booking = await Booking.create({
      userId: req.user._id,
      locationId,
      slotId,
      vehicleType,
      vehicleNumber: normalizedVehicleNumber,
      startTime: start,
      endTime: end,
      duration,
      totalAmount,
      paymentStatus: finalPaymentStatus,
      paymentMethod: normalizedPaymentMethod,
      transactionId: paymentResult.transactionId,
      status: 'active'
    });

    const qrCodeData = await generateQRCode({
      _id: booking._id,
      userId: req.user._id,
      slotId: slot._id,
      locationId,
      locationName: location.name,
      slotNumber: slot.slotNumber,
      vehicleType,
      vehicleNumber: normalizedVehicleNumber,
      startTime: start,
      endTime: end,
      duration,
      totalAmount,
      paymentStatus: finalPaymentStatus,
      transactionId: paymentResult.transactionId,
      bookingTime: booking.bookingTime,
      status: 'active'
    });

    booking.qrCode = qrCodeData;
    await booking.save();

    if (slot.save && typeof slot.save === 'function') {
      slot.isAvailable = false;
      slot.slotState = 'BOOKED';
      await slot.save();
    }

    if (location.save && typeof location.save === 'function') {
      location.availableSlots -= 1;
      await location.save();
    }

    await User.findByIdAndUpdate(req.user._id, {
      $push: { bookings: booking._id }
    });

    await sendNotification({
      user: req.user,
      type: 'BOOKING_CONFIRMED',
      message: `Booking confirmed for slot ${slot.slotNumber} at ${location.name}.`,
      smsMessage: `✅ Your parking slot is confirmed! Slot ${slot.slotNumber} at ${location.name}. Time: ${formatDateTime(start)} - ${formatDateTime(end)}.`,
      whatsappMessage: `✅ Booking confirmed! ID: ${booking._id}, Slot ${slot.slotNumber}, ${location.name}, ${formatDateTime(start)} - ${formatDateTime(end)}.`,
      emailSubject: 'Booking Confirmed - ParkEase',
      emailHtml: buildBookingSummaryHtml({
        user: req.user,
        booking,
        slotNumber: slot.slotNumber,
        locationName: location.name,
        extraLine: 'Your parking slot is confirmed.'
      }),
      booking
    });

    if (finalPaymentStatus === 'PENDING') {
      await sendNotification({
        user: req.user,
        type: 'PAYMENT_REMINDER',
        message: `Payment for booking ${booking._id} is pending. Please complete it before arrival.`,
        smsMessage: '💳 Complete your payment to confirm your parking slot.',
        whatsappMessage: `💳 Payment pending for booking ${booking._id}. Complete payment to avoid cancellation.`,
        emailSubject: 'Payment Reminder - ParkEase',
        emailHtml: `
          <div style="font-family:Arial,sans-serif">
            <h3>Payment Pending</h3>
            <p>Hello ${getUserName(req.user)}, payment for booking <strong>${booking._id}</strong> is still pending.</p>
            <p>Please complete payment here: <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/receipt?bookingId=${booking._id}">Complete Payment</a></p>
          </div>
        `,
        booking
      });
      booking.reminderFlags.paymentReminderSent = true;
      await booking.save();
    }

    let populatedBooking;
    try {
      populatedBooking = await Booking.findById(booking._id)
        .populate('locationId', 'name address coordinates')
        .populate('slotId', 'slotNumber floor')
        .populate('userId', 'name email phone');
    } catch (populateError) {
      populatedBooking = {
        ...booking.toObject(),
        locationId: locationId === 'mock-location-1'
          ? { name: 'MMCOE Campus Parking', address: 'MMCOE College Campus, Pune' }
          : booking.locationId,
        slotId: { slotNumber: slot.slotNumber, floor: 'Ground' },
        userId: { name: req.user.name, email: req.user.email, phone: req.user.phone }
      };
    }

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
    if (booking.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
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

    booking.status = 'cancelled';
    booking.paymentStatus = booking.paymentStatus === 'COMPLETED' ? 'REFUNDED' : 'FAILED';
    await booking.save();

    let locationNameForNotification = 'Parking Location';
    const slot = await Slot.findById(booking.slotId);
    if (slot) {
      slot.isAvailable = true;
      slot.slotState = 'NOT_BOOKED';
      await slot.save();

      const location = await Location.findById(booking.locationId);
      if (location) {
        locationNameForNotification = location.name;
        location.availableSlots += 1;
        await location.save();
      }
    }

    await sendNotification({
      user: req.user,
      type: 'CANCELLATION_ALERT',
      message: `Booking ${booking._id} was cancelled successfully.`,
      smsMessage: `⚠️ Your booking ${booking._id} has been cancelled.`,
      whatsappMessage: `⚠️ Booking ${booking._id} cancelled. ${booking.paymentStatus === 'REFUNDED' ? 'Refund has been initiated.' : 'No refund applicable.'}`,
      emailSubject: 'Booking Cancelled - ParkEase',
      emailHtml: buildBookingSummaryHtml({
        user: req.user,
        booking,
        slotNumber: slot?.slotNumber,
        locationName: locationNameForNotification,
        reason: 'Cancelled by user request',
        extraLine: booking.paymentStatus === 'REFUNDED'
          ? 'Your booking has been cancelled and refund is being processed.'
          : 'Your booking has been cancelled.'
      }),
      booking
    });

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

// @desc    Extend an active booking
// @route   PUT /api/bookings/:id/extend
// @access  Private
const extendBooking = async (req, res) => {
  try {
    const { extraHours } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to extend this booking' });
    }

    if (booking.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Only active bookings can be extended' });
    }

    if (!extraHours || extraHours < 1) {
      return res.status(400).json({ success: false, message: 'Please provide extra hours to extend' });
    }

    const slot = await Slot.findById(booking.slotId);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }

    const newEnd = new Date(booking.endTime.getTime() + extraHours * 60 * 60 * 1000);
    const overlap = await Booking.findOne({
      _id: { $ne: booking._id },
      slotId: booking.slotId,
      status: 'active',
      startTime: { $lt: newEnd },
      endTime: { $gt: booking.endTime }
    });

    if (overlap) {
      return res.status(409).json({ success: false, message: 'Slot is not available for the extension period' });
    }

    booking.endTime = newEnd;
    booking.duration += extraHours;
    booking.totalAmount += slot.pricePerHour * extraHours;
    booking.paymentStatus = booking.paymentStatus === 'COMPLETED' ? 'COMPLETED' : 'PENDING';
    await booking.save();

    console.log(`NOTIFICATION: ${req.user.email} - Booking ${booking._id} extended by ${extraHours} hour(s).`);

    res.json({ success: true, message: 'Booking extended successfully', data: booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error extending booking', error: error.message });
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

    const slotDoc = await Slot.findById(booking.slotId);
    if (slotDoc) {
      slotDoc.slotState = 'ARRIVED';
      await slotDoc.save();
    }

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
      slot.slotState = 'NOT_BOOKED';
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

// @desc    Get booking ticket for QR scanner (public demo)
// @route   GET /api/bookings/public/:id
// @access  Public
const getPublicBookingTicket = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('locationId', 'name address')
      .populate('slotId', 'slotNumber floor')
      .populate('userId', 'name email phone');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    return res.json({ success: true, data: booking });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching booking ticket',
      error: error.message
    });
  }
};

// @desc    Render booking ticket page for QR scan
// @route   GET /api/bookings/public/:id/view
// @access  Public
const getPublicBookingTicketView = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('locationId', 'name address')
      .populate('slotId', 'slotNumber floor')
      .populate('userId', 'name email phone');

    if (!booking) {
      return res.status(404).send('<h2>Booking not found</h2>');
    }

    const format = (v) => new Date(v).toLocaleString('en-IN');
    return res.send(`
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>ParkEase Ticket</title>
        <style>
          body{font-family:Arial,sans-serif;background:#f5f8ff;padding:16px}
          .card{max-width:560px;margin:0 auto;background:#fff;border-radius:14px;padding:20px;box-shadow:0 6px 20px rgba(0,0,0,.08)}
          h1{margin:0 0 10px;color:#0f172a}
          .row{display:flex;justify-content:space-between;border-bottom:1px solid #eef2ff;padding:10px 0}
          .k{color:#475569;font-weight:600}
          .v{color:#0f172a}
        </style>
      </head>
      <body>
        <div class="card">
          <h1>ParkEase Ticket</h1>
          <div class="row"><span class="k">Booking ID</span><span class="v">${booking._id}</span></div>
          <div class="row"><span class="k">User</span><span class="v">${booking.userId?.name || 'N/A'}</span></div>
          <div class="row"><span class="k">Slot</span><span class="v">${booking.slotId?.slotNumber || 'N/A'}</span></div>
          <div class="row"><span class="k">Location</span><span class="v">${booking.locationId?.name || 'N/A'}</span></div>
          <div class="row"><span class="k">Vehicle</span><span class="v">${booking.vehicleNumber}</span></div>
          <div class="row"><span class="k">Start</span><span class="v">${format(booking.startTime)}</span></div>
          <div class="row"><span class="k">End</span><span class="v">${format(booking.endTime)}</span></div>
          <div class="row"><span class="k">Booking Status</span><span class="v">${booking.status}</span></div>
          <div class="row"><span class="k">Payment</span><span class="v">${booking.paymentStatus}</span></div>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error(error);
    return res.status(500).send('<h2>Unable to load ticket</h2>');
  }
};

module.exports = {
  createPaymentIntent,
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  checkInBooking,
  checkOutBooking,
  extendBooking,
  getAllBookings,
  getBookingVerificationById,
  getPublicBookingTicket,
  getPublicBookingTicketView
};
