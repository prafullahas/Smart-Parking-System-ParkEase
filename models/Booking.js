const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: [true, 'Location ID is required']
  },
  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Slot',
    required: [true, 'Slot ID is required']
  },
  vehicleType: {
    type: String,
    required: [true, 'Vehicle type is required'],
    enum: ['car']
  },
  vehicleNumber: {
    type: String,
    required: [true, 'Vehicle number is required'],
    trim: true,
    uppercase: true
  },
  bookingTime: {
    type: Date,
    default: Date.now
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required']
  },
  duration: {
    type: Number, // Duration in hours
    required: [true, 'Duration is required'],
    min: 1
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
    default: 'PENDING'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'card', 'upi', 'netbanking', 'cash', 'wallet', 'later'],
    default: 'upi'
  },
  transactionId: {
    type: String,
    default: null
  },
  qrCode: {
    type: String, // Store QR code data URI or URL
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'expired'],
    default: 'active'
  },
  expiredAt: {
    type: Date,
    default: null
  },
  checkInTime: {
    type: Date,
    default: null
  },
  checkOutTime: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  reminderFlags: {
    paymentReminderSent: { type: Boolean, default: false },
    late5MinSent: { type: Boolean, default: false },
    late10MinSent: { type: Boolean, default: false },
    noShowSent: { type: Boolean, default: false }
  },
  notificationLog: [{
    type: {
      type: String,
      required: true
    },
    channel: {
      type: String,
      enum: ['email', 'phone', 'whatsapp'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['sent', 'failed'],
      default: 'sent'
    },
    provider: {
      type: String,
      default: 'unknown'
    },
    attempts: {
      type: Number,
      default: 1
    },
    error: {
      type: String,
      default: null
    }
  }]
});

// Index for faster queries
bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ locationId: 1, slotId: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
