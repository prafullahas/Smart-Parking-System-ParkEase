const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { startScheduler } = require('./utils/scheduler');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

const initServer = () => {
  // Middleware
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5175',
    'http://localhost:3000',
    'http://localhost:5000',
    'http://localhost:5001'
  ].filter(Boolean);

  app.use(cors({
    origin: (origin, callback) => {
      const isPrivateLanOrigin = /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(origin || '');
      if (!origin || allowedOrigins.includes(origin) || origin?.startsWith('http://localhost:') || isPrivateLanOrigin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use('/api/auth', require('./routes/authRoutes'));
  app.use('/api/locations', require('./routes/locationRoutes'));
  app.use('/api/slots', require('./routes/slotRoutes'));
  app.use('/api/bookings', require('./routes/bookingRoutes'));
  app.use('/api/booking', require('./routes/bookingVerificationRoutes'));

  // Health check route
  app.get('/', (req, res) => {
    res.json({ 
      message: 'Smart Parking Management System API',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });

  // API health check
  app.get('/api/health', (req, res) => {
    res.json({ 
      success: true,
      message: 'API is healthy',
      timestamp: new Date().toISOString()
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found',
      path: req.path
    });
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
    });
  });

  const PORT = process.env.PORT || 5002;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Frontend URL: http://localhost:5173`);
    console.log(`API Health: http://localhost:${PORT}/api/health`);

    // Start the booking scheduler
    startScheduler();
  });
};

const startApp = async () => {
  const connected = await connectDB();

  if (!connected) {
    console.error('MongoDB Atlas connection failed. Server startup aborted.');
    process.exit(1);
  }

  initServer();
};

startApp();
