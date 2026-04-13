const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();

// Mock data storage
let users = [];
let locations = [
  {
    _id: 'dashboard-location',
    name: 'MMCOE Campus Parking',
    address: 'MMCOE College Campus, Pune',
    city: 'Pune',
    type: 'Campus Parking',
    totalSlots: 6,
    availableSlots: 6,
    pricePerHour: { car: 50 }
  }
];

let slots = [
  { _id: 'A1', slotNumber: 'A1', locationId: 'dashboard-location', vehicleType: 'car', isAvailable: true, slotState: 'NOT_BOOKED', floor: 'Ground Floor', pricePerHour: 50, row: 'A', position: 1, isPremium: false },
  { _id: 'A2', slotNumber: 'A2', locationId: 'dashboard-location', vehicleType: 'car', isAvailable: true, slotState: 'NOT_BOOKED', floor: 'Ground Floor', pricePerHour: 50, row: 'A', position: 2, isPremium: false },
  { _id: 'A3', slotNumber: 'A3', locationId: 'dashboard-location', vehicleType: 'car', isAvailable: true, slotState: 'NOT_BOOKED', floor: 'Ground Floor', pricePerHour: 50, row: 'A', position: 3, isPremium: false },
  { _id: 'B1', slotNumber: 'B1', locationId: 'dashboard-location', vehicleType: 'car', isAvailable: true, slotState: 'NOT_BOOKED', floor: 'Ground Floor', pricePerHour: 50, row: 'B', position: 1, isPremium: false },
  { _id: 'B2', slotNumber: 'B2', locationId: 'dashboard-location', vehicleType: 'car', isAvailable: true, slotState: 'NOT_BOOKED', floor: 'Ground Floor', pricePerHour: 50, row: 'B', position: 2, isPremium: false },
  { _id: 'B3', slotNumber: 'B3', locationId: 'dashboard-location', vehicleType: 'car', isAvailable: true, slotState: 'NOT_BOOKED', floor: 'Ground Floor', pricePerHour: 50, row: 'B', position: 3, isPremium: false }
];

let bookings = [];

// Generate QR Code with booking details
const generateQRCode = (bookingData) => {
  const qrData = JSON.stringify({
    bookingId: bookingData.bookingId,
    location: bookingData.location,
    slot: bookingData.slot,
    vehicle: bookingData.vehicle,
    startTime: bookingData.startTime,
    endTime: bookingData.endTime,
    duration: bookingData.duration,
    amount: bookingData.amount,
    timestamp: new Date().toISOString()
  });
  
  // Use QR Server API to generate QR code
  return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}`;
};

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token' });
  
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secure-jwt-secret-key');
    req.user = user;
    next();
  } catch (err) {
    res.status(403).json({ success: false, message: 'Invalid token' });
  }
};

// ===== AUTH ROUTES =====
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password, phone } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields required' });
  }
  
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'Email already exists' });
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    _id: Date.now().toString(),
    name,
    email,
    passwordHash: hashedPassword,
    phone: phone || '',
    createdAt: new Date()
  };
  
  users.push(newUser);
  const token = jwt.sign({ id: newUser._id, email }, process.env.JWT_SECRET || 'your-super-secure-jwt-secret-key');
  
  res.json({
    success: true,
    data: {
      _id: newUser._id,
      name,
      email,
      phone,
      vehicle: newUser.vehicle || {},
      token
    }
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }
  
  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
  
  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
  
  const token = jwt.sign({ id: user._id, email }, process.env.JWT_SECRET || 'your-super-secure-jwt-secret-key');
  
  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email,
      phone: user.phone,
      vehicle: user.vehicle || {},
      token
    }
  });
});

// ===== LOCATIONS ROUTES =====
app.get('/api/locations', (req, res) => {
  res.json({
    success: true,
    data: locations
  });
});

app.get('/api/locations/:id', (req, res) => {
  const location = locations.find(l => l._id === req.params.id);
  if (!location) {
    return res.status(404).json({ success: false, message: 'Location not found' });
  }
  const locationSlots = slots.filter(slot => slot.locationId === location._id);
  res.json({
    success: true,
    data: {
      ...location,
      slots: locationSlots,
      actualAvailableSlots: locationSlots.filter(slot => slot.isAvailable).length
    }
  });
});

// ===== SLOTS ROUTES =====
app.get('/api/slots/location/:locationId', (req, res) => {
  const location = locations.find(l => l._id === req.params.locationId);
  if (!location) {
    return res.status(404).json({ success: false, message: 'Location not found' });
  }
  const locationSlots = slots.filter(slot => slot.locationId === location._id);

  res.json({
    success: true,
    data: {
      slots: locationSlots,
      stats: {
        total: location.totalSlots,
        available: locationSlots.filter(s => s.isAvailable).length,
        booked: locationSlots.filter(s => !s.isAvailable).length,
        handicapped: 0
      }
    }
  });
});

// ===== BOOKINGS ROUTES =====
app.post('/api/bookings', authenticateToken, (req, res) => {
  const { locationId, slotId, vehicleNumber, startTime, duration, paymentMethod } = req.body;
  if (req.body.vehicleType && req.body.vehicleType !== 'car') {
    return res.status(400).json({ success: false, message: 'Only car parking is supported' });
  }
  const vehicleType = 'car';
  
  let location = locations.find(l => l._id === locationId);
  
  const amount = location ? location.pricePerHour?.[vehicleType] * duration : 50 * duration;
  
  const slot = slots.find(s => s._id === slotId && s.locationId === locationId);
  if (!location || !slot) {
    return res.status(404).json({ success: false, message: 'Location or slot not found' });
  }

  if (!slot.isAvailable) {
    return res.status(400).json({ success: false, message: 'Slot is not available' });
  }

  const slotNumber = slot.slotNumber;
  const vehicleTypeForSlot = slot.vehicleType;
  const booking = {
    _id: Date.now().toString(),
    userId: req.user.id,
    locationId: { _id: location._id, name: location.name, address: location.address },
    slotId: { _id: slotId, slotNumber: slotNumber, vehicleType: vehicleTypeForSlot },
    vehicleType,
    vehicleNumber,
    startTime: new Date(startTime),
    endTime: new Date(new Date(startTime).getTime() + duration * 60 * 60 * 1000),
    duration,
    paymentMethod,
    totalAmount: amount,
    paymentStatus: 'success',
    transactionId: `TXN-${Date.now()}`,
    qrCode: generateQRCode({
      bookingId: Date.now().toString(),
      location: location?.name || 'Parking Location',
      slot: slotNumber,
      vehicle: vehicleNumber,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(new Date(startTime).getTime() + duration * 60 * 60 * 1000).toISOString(),
      duration: duration,
      amount: amount
    }),
    createdAt: new Date(),
    status: 'active'
  };

  slot.isAvailable = false;
  slot.slotState = 'BOOKED';
  location.availableSlots = Math.max(0, slots.filter(s => s.locationId === locationId && s.isAvailable).length);
  bookings.push(booking);

  res.json({
    success: true,
    data: booking
  });
});

app.get('/api/bookings/my-bookings', authenticateToken, (req, res) => {
  const userBookings = bookings.filter(b => b.userId === req.user.id);
  res.json({
    success: true,
    data: userBookings
  });
});

app.put('/api/bookings/:id/cancel', authenticateToken, (req, res) => {
  const booking = bookings.find(b => b._id === req.params.id && b.userId === req.user.id);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }
  
  if (booking.status === 'cancelled') {
    return res.status(400).json({ success: false, message: 'Booking is already cancelled' });
  }
  
  booking.status = 'cancelled';
  booking.cancelledAt = new Date();

  const slot = slots.find(s => s._id === booking.slotId._id);
  if (slot) {
    slot.isAvailable = true;
    slot.slotState = 'NOT_BOOKED';
  }

  const location = locations.find(l => l._id === booking.locationId._id);
  if (location) {
    location.availableSlots = slots.filter(s => s.locationId === location._id && s.isAvailable).length;
  }
  
  res.json({
    success: true,
    message: 'Booking cancelled successfully',
    data: booking
  });
});

app.get('/api/bookings/:id', authenticateToken, (req, res) => {
  const booking = bookings.find(b => b._id === req.params.id && b.userId === req.user.id);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }
  
  // Ensure locationId and slotId are properly populated
  if (booking.locationId && typeof booking.locationId === 'object' && !booking.locationId.name) {
    if (booking.locationId._id === 'dashboard-location') {
      booking.locationId = {
        _id: 'dashboard-location',
        name: 'MMCOE Campus Parking',
        address: 'MMCOE Campus, Pune'
      };
    }
  }
  
  if (booking.slotId && typeof booking.slotId === 'object' && !booking.slotId.slotNumber) {
    booking.slotId = {
      _id: booking.slotId._id,
      slotNumber: booking.slotId._id,
      vehicleType: 'car'
    };
  }
  
  res.json({
    success: true,
    data: booking
  });
});

// Create payment intent (mock)
app.post('/api/bookings/create-payment-intent', authenticateToken, (req, res) => {
  const { amount, paymentMethod } = req.body;
  
  // Mock payment intent
  const mockClientSecret = `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substring(2)}`;
  
  res.json({
    success: true,
    clientSecret: mockClientSecret,
    amount: amount,
    paymentMethod: paymentMethod
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'API Health Check: OK', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n✅ Mock API Server running on port ${PORT}`);
  console.log(`📍 Frontend URL: http://localhost:5173`);
  console.log(`🔍 API Health: http://localhost:${PORT}/api/health`);
  console.log(`\n⚠️  Using Mock Database (No MongoDB Required)\n`);
});
