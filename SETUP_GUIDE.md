# Smart Parking Management System - Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed on your system:
- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community)
  - OR use **MongoDB Atlas** (cloud database) - [Sign up](https://www.mongodb.com/cloud/atlas)
- **Git** (optional) - [Download](https://git-scm.com/)

---

## Installation Steps

### Step 1: Navigate to Project Directory
```bash
cd c:\Users\HP\Documents\Parking_System
```

### Step 2: Install Dependencies
```bash
npm install
```

This will install all required packages:
- express
- mongoose
- bcrypt
- jsonwebtoken
- cors
- dotenv
- qrcode
- nodemon (dev dependency)

### Step 3: Configure MongoDB

#### Option A: Local MongoDB
1. Start MongoDB service:
   - Windows: MongoDB should auto-start, or run `mongod` in terminal
   - Mac: `brew services start mongodb-community`
   - Linux: `sudo systemctl start mongod`

2. The default connection string in `.env` is:
   ```
   MONGO_URI=mongodb://localhost:27017/parking_system
   ```

#### Option B: MongoDB Atlas (Cloud)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string
4. Update `.env` file:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/parking_system?retryWrites=true&w=majority
   ```
   Replace `username` and `password` with your credentials

### Step 4: Configure Environment Variables

Open the `.env` file and update if needed:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/parking_system
JWT_SECRET=your_secure_random_secret_key_here
```

**Important:** Change `JWT_SECRET` to a random, secure string for production.

### Step 5: Seed Database (Optional but Recommended)

This will populate your database with sample locations and slots:

```bash
npm run seed
```

You should see output like:
```
MongoDB Connected: localhost
Deleted existing locations and slots
Locations seeded successfully
Created 100 slots for Phoenix Mall Parking
Created 80 slots for Apollo Hospital Parking
...
Database seeded successfully!
```

---

## Running the Application

### Development Mode (with auto-restart)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

You should see:
```
Server running on port 5000
MongoDB Connected: localhost (or your Atlas cluster)
```

---

## Testing the API

### Using Thunder Client (VS Code Extension)

1. Install Thunder Client extension in VS Code
2. Import the API endpoints from `API_DOCUMENTATION.md`
3. Start testing!

### Using Postman

1. Download and install [Postman](https://www.postman.com/downloads/)
2. Create a new collection called "Parking System"
3. Add requests based on `API_DOCUMENTATION.md`

### Quick Test Sequence

1. **Sign Up** - Create a user account
   ```
   POST http://localhost:5000/api/auth/signup
   Body:
   {
     "name": "Test User",
     "email": "test@example.com",
     "password": "password123",
     "phone": "9876543210"
   }
   ```

2. **Login** - Get your JWT token
   ```
   POST http://localhost:5000/api/auth/login
   Body:
   {
     "email": "test@example.com",
     "password": "password123"
   }
   ```
   Copy the `token` from the response.

3. **Get Locations** - View available parking locations
   ```
   GET http://localhost:5000/api/locations
   ```

4. **Get Available Slots** - Find slots for a location
   ```
   GET http://localhost:5000/api/slots/location/{locationId}/available?vehicleType=car
   ```

5. **Create Booking** - Book a parking slot
   ```
   POST http://localhost:5000/api/bookings
   Headers:
   Authorization: Bearer {your_token}
   Body:
   {
     "locationId": "{location_id}",
     "slotId": "{slot_id}",
     "vehicleType": "car",
     "vehicleNumber": "TN01AB1234",
     "startTime": "2024-01-20T10:00:00Z",
     "duration": 2,
     "paymentMethod": "upi"
   }
   ```

6. **View My Bookings** - See your booking with QR code
   ```
   GET http://localhost:5000/api/bookings/my-bookings
   Headers:
   Authorization: Bearer {your_token}
   ```

---

## Project Structure

```
Parking_System/
├── config/
│   └── db.js                 # Database connection
├── controllers/
│   ├── authController.js     # Auth logic
│   ├── bookingController.js  # Booking logic
│   ├── locationController.js # Location logic
│   └── slotController.js     # Slot logic
├── middleware/
│   └── authMiddleware.js     # JWT authentication
├── models/
│   ├── User.js              # User schema
│   ├── Location.js          # Location schema
│   ├── Slot.js              # Slot schema
│   └── Booking.js           # Booking schema
├── routes/
│   ├── authRoutes.js        # Auth routes
│   ├── bookingRoutes.js     # Booking routes
│   ├── locationRoutes.js    # Location routes
│   └── slotRoutes.js        # Slot routes
├── utils/
│   └── seedData.js          # Database seeding script
├── .env                     # Environment variables
├── .gitignore              # Git ignore file
├── package.json            # Dependencies
├── server.js               # Entry point
├── API_DOCUMENTATION.md    # API docs
└── SETUP_GUIDE.md         # This file
```

---

## Common Issues & Solutions

### Issue 1: MongoDB Connection Error
**Error:** `MongoServerError: connect ECONNREFUSED`

**Solution:**
- Ensure MongoDB is running
- Check if the connection string in `.env` is correct
- For Windows, start MongoDB service from Services

### Issue 2: Port Already in Use
**Error:** `EADDRINUSE: address already in use :::5000`

**Solution:**
- Change the PORT in `.env` to a different number (e.g., 5001)
- Or stop the process using port 5000

### Issue 3: JWT Token Invalid
**Error:** `Not authorized, token failed`

**Solution:**
- Ensure you're including the token in the Authorization header
- Format: `Authorization: Bearer <your_token>`
- Make sure the JWT_SECRET in `.env` hasn't changed

### Issue 4: Validation Errors
**Error:** `Please provide all required fields`

**Solution:**
- Check the API documentation for required fields
- Ensure all required fields are included in the request body

---

## Database Schema Overview

### User
- name, email, password (hashed), phone
- currentLocation (coordinates)
- bookings (references)

### Location
- name, address, coordinates
- totalSlots, availableSlots
- type (mall/hospital/theatre)
- pricePerHour (car/bike)

### Slot
- locationId (reference)
- slotNumber, floor
- isAvailable, vehicleType
- pricePerHour

### Booking
- userId, locationId, slotId (references)
- vehicleType, vehicleNumber
- startTime, endTime, duration
- totalAmount, paymentStatus
- qrCode (base64 data URI)
- status (active/completed/cancelled)

---

## Features Implemented

✅ User authentication (signup, login, logout)  
✅ Password hashing with bcrypt  
✅ JWT-based session management  
✅ Location management (CRUD operations)  
✅ Slot management (CRUD operations)  
✅ Booking system with real-time slot availability  
✅ Mock payment integration  
✅ QR code generation for bookings  
✅ User booking history  
✅ Check-in/check-out functionality  
✅ Booking cancellation with refund  
✅ Search locations by type  
✅ Nearby location search  
✅ Filter slots by vehicle type and availability  

---

## Next Steps (Optional Enhancements)

- Add admin role and admin-only routes
- Implement real payment gateway (Razorpay, Stripe)
- Add email notifications for bookings
- Implement booking reminders
- Add real-time slot updates using WebSockets
- Create a frontend application
- Add booking history analytics
- Implement dynamic pricing
- Add reviews and ratings for locations

---

## Support

For issues or questions:
- Check the API_DOCUMENTATION.md
- Review the code comments in controllers
- Ensure all environment variables are set correctly

---

## License

ISC
