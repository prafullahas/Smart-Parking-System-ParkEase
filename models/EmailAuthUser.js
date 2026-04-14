const mongoose = require('mongoose');

const emailAuthUserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
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
  { timestamps: true }
);

module.exports = mongoose.model('EmailAuthUser', emailAuthUserSchema);
