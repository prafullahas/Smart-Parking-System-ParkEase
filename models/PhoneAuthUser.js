const mongoose = require('mongoose');

const phoneAuthUserSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    otp: {
      type: String,
      default: null
    },
    otpExpiry: {
      type: Date,
      default: null
    },
    otpAttempts: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('PhoneAuthUser', phoneAuthUserSchema);
