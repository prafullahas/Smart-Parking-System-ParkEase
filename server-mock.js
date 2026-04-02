const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();

// Mock data storage
let users = [];
let locations = [
  {
    _id: '1',
    name: 'Downtown Parking',
    address: '123 Main St, City Center',
    city: 'New York',
    type: 'Multi-Level',
    totalSlots: 150,
    availableSlots: 45,
    pricePerHour: { car: 5, bike: 2 }
  },
  {
    _id: '2',
    name: 'Mall Parking',
    address: '456 Shopping Mall, Avenue',
    city: 'New York',
    type: 'Open Lot',
    totalSlots: 300,
    availableSlots: 120,
    pricePerHour: { car: 3, bike: 1 }
  },
  {
    _id: '3',
    name: 'Airport Parking',
    address: '789 Airport Road',
    city: 'New York',
    type: 'Multi-Level',
    totalSlots: 500,
    availableSlots: 89,
    pricePerHour: { car: 8, bike: 4 }
  },
  {
    _id: '4',
    name: 'Hospital Parking',
    address: '321 Medical Center Drive',
    city: 'New York',
    type: 'Open Lot',
    totalSlots: 200,
    availableSlots: 67,
    pricePerHour: { car: 4, bike: 2 }
  },
  {
    _id: '5',
    name: 'University Parking',
    address: '654 Campus Boulevard',
    city: 'New York',
    type: 'Multi-Level',
    totalSlots: 400,
    availableSlots: 178,
    pricePerHour: { car: 2, bike: 1 }
  }
];

let bookings = [];

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
      token,
      user: { id: newUser._id, name, email, phone }
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
      token,
      user: { id: user._id, name: user.name, email, phone: user.phone }
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
  res.json({ success: true, data: location });
});

// ===== SLOTS ROUTES =====
app.get('/api/slots/location/:locationId', (req, res) => {
  const location = locations.find(l => l._id === req.params.locationId);
  if (!location) {
    return res.status(404).json({ success: false, message: 'Location not found' });
  }
  
  const slots = Array.from({ length: location.totalSlots }, (_, i) => ({
    _id: `slot-${location._id}-${i}`,
    slotNumber: `${String.fromCharCode(65 + Math.floor(i / 10))}${(i % 10) + 1}`,
    locationId: location._id,
    vehicleType: i % 3 === 0 ? 'bike' : 'car',
    isAvailable: Math.random() > 0.6,
    floor: Math.floor(i / 30) + 1,
    pricePerHour: location.pricePerHour.car,
    isPremium: i % 15 === 0
  }));
  
  res.json({
    success: true,
    data: {
      slots,
      stats: {
        total: location.totalSlots,
        available: slots.filter(s => s.isAvailable).length,
        booked: slots.filter(s => !s.isAvailable).length,
        handicapped: Math.floor(location.totalSlots * 0.05)
      }
    }
  });
});

// ===== BOOKINGS ROUTES =====
app.post('/api/bookings', authenticateToken, (req, res) => {
  const { locationId, slotId, vehicleType, vehicleNumber, startTime, duration, paymentMethod } = req.body;
  
  const booking = {
    _id: Date.now().toString(),
    userId: req.user.id,
    locationId,
    slotId,
    vehicleType,
    vehicleNumber,
    startTime: new Date(startTime),
    endTime: new Date(new Date(startTime).getTime() + duration * 60 * 60 * 1000),
    duration,
    paymentMethod,
    totalAmount: 50 * duration,
    paymentStatus: 'paid',
    transactionId: `TXN-${Date.now()}`,
    qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + Date.now(),
    createdAt: new Date()
  };
  
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
