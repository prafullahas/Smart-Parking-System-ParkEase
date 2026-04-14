const User = require('../models/User');
const PhoneAuthUser = require('../models/PhoneAuthUser');
const EmailAuthUser = require('../models/EmailAuthUser');
const jwt = require('jsonwebtoken');
const { sendNotification } = require('../utils/notificationService');
const nodemailer = require('nodemailer');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

const generatePhoneToken = (phone, userId) => {
  return jwt.sign(
    { phone, id: userId || null },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const normalizePhone = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return digits;
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const mailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
const mailPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
const mailTransporter = mailUser && mailPass
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: mailUser,
        pass: mailPass
      }
    })
  : null;

const sendEmail = async (to, subject, message, html = null) => {
  if (!to) throw new Error('Recipient email is required');
  if (!mailTransporter) {
    console.log(`[EMAIL:MOCK] ${to} | ${subject} | ${message}`);
    return { delivered: false, mode: 'mock' };
  }
  try {
    const info = await mailTransporter.sendMail({
      from: process.env.EMAIL_FROM || mailUser,
      to,
      subject,
      text: message,
      html: html || `<div style="font-family:Arial,sans-serif"><p>${message}</p></div>`
    });
    console.log(`Email sent to: ${to} | subject: ${subject} | messageId: ${info.messageId}`);
    return { delivered: true, mode: 'smtp', messageId: info.messageId };
  } catch (err) {
    console.error('Email error:', err.message);
    return { delivered: false, mode: 'smtp-error', error: err.message };
  }
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
  try {
    const { name, email, password, phone, currentLocation, vehicle } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedPhone = phone?.replace(/\D/g, '');

    // Validate required fields
    if (!name || !normalizedEmail || !password || !normalizedPhone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    if (!/^[\w-.+]+@[\w-]+\.[\w-.]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email'
      });
    }

    if (normalizedPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be 10 digits'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      phone: normalizedPhone,
      currentLocation: currentLocation || { type: 'Point', coordinates: [0, 0] },
      vehicle: vehicle || {}
    });

    if (user) {
      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          vehicle: user.vehicle,
          token: generateToken(user._id)
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Unable to create user. Please try again.'
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    let { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    // Validate fields
    if (!normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email: normalizedEmail });

    if (user && (await user.comparePassword(password))) {
      res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          vehicle: user.vehicle,
          token: generateToken(user._id)
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

// @desc    Send OTP for phone authentication
// @route   POST /api/auth/send-otp
// @access  Public
const sendOtp = async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);

    if (phone.length !== 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit phone number'
      });
    }

    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    const authUser = await PhoneAuthUser.findOneAndUpdate(
      { phone },
      {
        $set: {
          otp,
          otpExpiry,
          otpAttempts: 0
        },
        $setOnInsert: {
          isVerified: false
        }
      },
      {
        new: true,
        upsert: true
      }
    );

    console.log('OTP for', phone, 'is:', otp);

    return res.json({
      success: true,
      message: 'OTP sent successfully (check console)',
      data: {
        phone: authUser.phone
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error sending OTP',
      error: error.message
    });
  }
};

// @desc    Verify OTP for phone authentication
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const otp = String(req.body.otp || '').trim();

    if (phone.length !== 10 || otp.length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid phone and 6-digit OTP'
      });
    }

    const authUser = await PhoneAuthUser.findOne({ phone });
    if (!authUser) {
      return res.status(404).json({
        success: false,
        message: 'Phone number not found. Please request OTP first'
      });
    }

    if (authUser.otpAttempts >= 3) {
      return res.status(429).json({
        success: false,
        message: 'Max attempts reached'
      });
    }

    if (!authUser.otpExpiry || new Date() > authUser.otpExpiry) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired'
      });
    }

    if (authUser.otp !== otp) {
      authUser.otpAttempts += 1;
      await authUser.save();
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    authUser.isVerified = true;
    authUser.otp = null;
    authUser.otpExpiry = null;
    authUser.otpAttempts = 0;
    await authUser.save();

    const linkedUser = await User.findOne({ phone });
    const token = generatePhoneToken(phone, linkedUser?._id);

    return res.json({
      success: true,
      message: 'Verification success',
      token,
      data: {
        phone,
        isVerified: true,
        user: linkedUser
          ? {
              _id: linkedUser._id,
              name: linkedUser.name,
              email: linkedUser.email,
              phone: linkedUser.phone,
              role: linkedUser.role,
              vehicle: linkedUser.vehicle
            }
          : null
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying OTP',
      error: error.message
    });
  }
};

// @desc    Resend OTP for phone authentication
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOtp = async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    if (phone.length !== 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit phone number'
      });
    }

    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await PhoneAuthUser.findOneAndUpdate(
      { phone },
      {
        $set: {
          otp,
          otpExpiry,
          otpAttempts: 0
        },
        $setOnInsert: {
          isVerified: false
        }
      },
      { upsert: true }
    );

    console.log('OTP for', phone, 'is:', otp);

    return res.json({
      success: true,
      message: 'OTP resent successfully (check console)'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error resending OTP',
      error: error.message
    });
  }
};

// @desc    Send OTP for email authentication
// @route   POST /api/auth/send-email-otp
// @access  Public
const sendEmailOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!/^[\w-.+]+@[\w-]+\.[\w-.]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email' });
    }

    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await EmailAuthUser.findOneAndUpdate(
      { email },
      {
        $set: { otp, otpExpiry, otpAttempts: 0 },
        $setOnInsert: { isVerified: false }
      },
      { new: true, upsert: true }
    );

    const emailResult = await sendEmail(email, 'Your OTP Code', `Your OTP is ${otp}`, `
      <div style="font-family:Arial,sans-serif;max-width:560px">
        <h2 style="margin:0 0 12px 0">ParkEase Email OTP</h2>
        <p>Your OTP is <strong style="font-size:20px">${otp}</strong></p>
        <p>This OTP expires in 5 minutes.</p>
      </div>
    `);
    console.log('Email OTP sent:', otp);

    return res.json({
      success: true,
      message: emailResult.delivered ? 'OTP sent to email' : 'OTP generated (email delivery failed, check server console)'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error sending email OTP', error: error.message });
  }
};

// @desc    Verify OTP for email authentication
// @route   POST /api/auth/verify-email-otp
// @access  Public
const verifyEmailOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || '').trim();
    const authUser = await EmailAuthUser.findOne({ email });

    if (!authUser) {
      return res.status(404).json({ success: false, message: 'Email not found. Please request OTP first' });
    }
    if (authUser.otpAttempts >= 3) {
      return res.status(429).json({ success: false, message: 'Max attempts reached' });
    }
    if (!authUser.otpExpiry || new Date() > authUser.otpExpiry) {
      return res.status(400).json({ success: false, message: 'Expired OTP' });
    }
    if (authUser.otp !== otp) {
      authUser.otpAttempts += 1;
      await authUser.save();
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    authUser.isVerified = true;
    authUser.otp = null;
    authUser.otpExpiry = null;
    authUser.otpAttempts = 0;
    await authUser.save();

    const linkedUser = await User.findOne({ email });
    const token = jwt.sign(
      { email, id: linkedUser?._id || null },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
      success: true,
      message: 'Verified',
      token,
      data: {
        email,
        isVerified: true,
        user: linkedUser
          ? {
              _id: linkedUser._id,
              name: linkedUser.name,
              email: linkedUser.email,
              phone: linkedUser.phone,
              role: linkedUser.role,
              vehicle: linkedUser.vehicle
            }
          : null
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error verifying email OTP', error: error.message });
  }
};

// @desc    Resend OTP for email authentication
// @route   POST /api/auth/resend-email-otp
// @access  Public
const resendEmailOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!/^[\w-.+]+@[\w-]+\.[\w-.]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email' });
    }

    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await EmailAuthUser.findOneAndUpdate(
      { email },
      {
        $set: { otp, otpExpiry, otpAttempts: 0 },
        $setOnInsert: { isVerified: false }
      },
      { upsert: true }
    );

    const emailResult = await sendEmail(email, 'Your OTP Code', `Your OTP is ${otp}`, `
      <div style="font-family:Arial,sans-serif;max-width:560px">
        <h2 style="margin:0 0 12px 0">ParkEase Email OTP</h2>
        <p>Your new OTP is <strong style="font-size:20px">${otp}</strong></p>
        <p>This OTP expires in 5 minutes.</p>
      </div>
    `);
    console.log('Email OTP sent:', otp);

    return res.json({
      success: true,
      message: emailResult.delivered ? 'OTP sent to email' : 'OTP generated (email delivery failed, check server console)'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error resending email OTP', error: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('bookings');

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.phone = req.body.phone || user.phone;
      
      if (req.body.currentLocation) {
        user.currentLocation = req.body.currentLocation;
      }
      
      if (req.body.vehicle) {
        user.vehicle = req.body.vehicle;
      }
      
      if (req.body.vehicles) {
        user.vehicles = req.body.vehicles;
      }

      const updatedUser = await user.save();

      res.json({
        success: true,
        data: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          role: updatedUser.role,
          vehicle: updatedUser.vehicle,
          vehicles: updatedUser.vehicles,
          currentLocation: updatedUser.currentLocation
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// @desc    Get all users (Admin)
// @route   GET /api/auth/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching users', error: error.message });
  }
};

// @desc    Block or unblock a user (Admin)
// @route   PUT /api/auth/users/:id/block
// @access  Private/Admin
const blockUser = async (req, res) => {
  try {
    const { blocked } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isBlocked = blocked === true;
    await user.save();

    await sendNotification({
      user,
      type: user.isBlocked ? 'USER_BLOCKED' : 'USER_UNBLOCKED',
      message: `Your booking privileges have been ${user.isBlocked ? 'blocked' : 'restored'}.`
    });

    res.json({ success: true, message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`, data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error updating user status', error: error.message });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    // Since we're using JWT, logout is handled on client side
    // by removing the token from storage
    res.json({
      success: true,
      message: 'User logged out successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error logging out',
      error: error.message
    });
  }
};

module.exports = {
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
};