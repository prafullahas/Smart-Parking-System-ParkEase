# Smart Parking Management System - API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer harshitabande@2603.1302.2505:@uktiwbwyfaimysmlmllmsMmMx
```

---

## 1. Authentication Endpoints

### 1.1 Sign Up
**POST** `/auth/signup`

Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "9876543210",
  "currentLocation": {
    "coordinates": [80.2707, 13.0827]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "65abc123...",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 1.2 Login
**POST** `/auth/login`

Authenticate user and get token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "65abc123...",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 1.3 Get Profile
**GET** `/auth/profile`

Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "65abc123...",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "currentLocation": {
      "type": "Point",
      "coordinates": [80.2707, 13.0827]
    },
    "bookings": []
  }
}
```

### 1.4 Update Profile
**PUT** `/auth/profile`

Update user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "John Updated",
  "phone": "9876543211",
  "currentLocation": {
    "coordinates": [80.2800, 13.0900]
  }
}
```

### 1.5 Logout
**POST** `/auth/logout`

Logout user (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

---

## 2. Location Endpoints

### 2.1 Get All Locations
**GET** `/locations`

Get all parking locations.

**Query Parameters:**
- `type` (optional): Filter by location type (mall/hospital/theatre)
- `search` (optional): Search by name or address

**Example:**
```
GET /locations?type=mall
GET /locations?search=phoenix
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "65abc...",
      "name": "Phoenix Mall Parking",
      "address": "142, Velachery Road, Chennai",
      "coordinates": {
        "lat": 12.9716,
        "long": 80.2595
      },
      "totalSlots": 100,
      "availableSlots": 85,
      "type": "mall",
      "pricePerHour": {
        "car": 50,
        "bike": 20
      }
    }
  ]
}
```

### 2.2 Get Location by ID
**GET** `/locations/:id`

Get detailed information about a specific location.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "65abc...",
    "name": "Phoenix Mall Parking",
    "address": "142, Velachery Road, Chennai",
    "coordinates": {
      "lat": 12.9716,
      "long": 80.2595
    },
    "totalSlots": 100,
    "availableSlots": 85,
    "type": "mall",
    "pricePerHour": {
      "car": 50,
      "bike": 20
    },
    "slots": [...],
    "actualAvailableSlots": 85
  }
}
```

### 2.3 Get Nearby Locations
**GET** `/locations/nearby`

Get parking locations near a specific coordinate.

**Query Parameters:**
- `lat` (required): Latitude
- `long` (required): Longitude
- `radius` (optional): Search radius in km (default: 10)

**Example:**
```
GET /locations/nearby?lat=13.0827&long=80.2707&radius=5
```

### 2.4 Create Location
**POST** `/locations`

Create a new parking location (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "New Mall Parking",
  "address": "123 Street, Chennai",
  "coordinates": {
    "lat": 13.0827,
    "long": 80.2707
  },
  "totalSlots": 50,
  "type": "mall",
  "pricePerHour": {
    "car": 60,
    "bike": 25
  }
}
```

---

## 3. Slot Endpoints

### 3.1 Get Slots by Location
**GET** `/slots/location/:locationId`

Get all slots for a specific location.

**Query Parameters:**
- `vehicleType` (optional): Filter by vehicle type (car/bike)
- `available` (optional): Filter by availability (true/false)

**Example:**
```
GET /slots/location/65abc123?vehicleType=car&available=true
```

**Response:**
```json
{
  "success": true,
  "count": 45,
  "data": [
    {
      "_id": "65def...",
      "locationId": {
        "_id": "65abc...",
        "name": "Phoenix Mall Parking",
        "address": "142, Velachery Road, Chennai"
      },
      "slotNumber": "C001",
      "isAvailable": true,
      "vehicleType": "car",
      "pricePerHour": 50,
      "floor": "Ground"
    }
  ]
}
```

### 3.2 Get Available Slots
**GET** `/slots/location/:locationId/available`

Get only available slots for a location.

**Query Parameters:**
- `vehicleType` (optional): Filter by vehicle type

**Example:**
```
GET /slots/location/65abc123/available?vehicleType=car
```

### 3.3 Create Slot
**POST** `/slots`

Create a new parking slot (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "locationId": "65abc123...",
  "slotNumber": "C100",
  "vehicleType": "car",
  "pricePerHour": 50,
  "floor": "Ground"
}
```

### 3.4 Create Bulk Slots
**POST** `/slots/bulk`

Create multiple slots at once (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "locationId": "65abc123...",
  "slotPrefix": "C",
  "startNumber": 1,
  "endNumber": 50,
  "vehicleType": "car",
  "pricePerHour": 50,
  "floor": "Ground"
}
```

---

## 4. Booking Endpoints

### 4.1 Create Booking
**POST** `/bookings`

Create a new parking booking (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "locationId": "65abc123...",
  "slotId": "65def456...",
  "vehicleType": "car",
  "vehicleNumber": "TN01AB1234",
  "startTime": "2024-01-15T10:00:00Z",
  "duration": 3,
  "paymentMethod": "upi"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "_id": "65ghi...",
    "userId": {...},
    "locationId": {
      "name": "Phoenix Mall Parking",
      "address": "142, Velachery Road, Chennai"
    },
    "slotId": {
      "slotNumber": "C001",
      "floor": "Ground"
    },
    "vehicleType": "car",
    "vehicleNumber": "TN01AB1234",
    "startTime": "2024-01-15T10:00:00Z",
    "endTime": "2024-01-15T13:00:00Z",
    "duration": 3,
    "totalAmount": 150,
    "paymentStatus": "success",
    "transactionId": "TXN1234567890",
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
    "status": "active"
  }
}
```

### 4.2 Get My Bookings
**GET** `/bookings/my-bookings`

Get all bookings for the logged-in user (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): Filter by status (active/completed/cancelled)

**Example:**
```
GET /bookings/my-bookings?status=active
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "65ghi...",
      "locationId": {
        "name": "Phoenix Mall Parking",
        "address": "142, Velachery Road, Chennai",
        "type": "mall"
      },
      "slotId": {
        "slotNumber": "C001",
        "floor": "Ground",
        "vehicleType": "car"
      },
      "vehicleNumber": "TN01AB1234",
      "startTime": "2024-01-15T10:00:00Z",
      "endTime": "2024-01-15T13:00:00Z",
      "totalAmount": 150,
      "paymentStatus": "success",
      "qrCode": "data:image/png;base64,...",
      "status": "active"
    }
  ]
}
```

### 4.3 Get Booking by ID
**GET** `/bookings/:id`

Get detailed information about a specific booking (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

### 4.4 Cancel Booking
**PUT** `/bookings/:id/cancel`

Cancel a booking (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {
    "_id": "65ghi...",
    "status": "cancelled",
    "paymentStatus": "refunded"
  }
}
```

### 4.5 Check-in to Booking
**PUT** `/bookings/:id/checkin`

Check-in to a booking (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

### 4.6 Check-out from Booking
**PUT** `/bookings/:id/checkout`

Check-out from a booking (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

---

## Error Responses

All endpoints return error responses in the following format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

### Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

---

## Testing with Postman/Thunder Client

1. **Sign up** a new user
2. **Login** to get the JWT token
3. Copy the token and use it in the Authorization header for protected routes
4. **Create locations** and **slots** (or use the seed data)
5. **Create a booking**
6. **View your bookings** to see the QR code

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Phone numbers should be 10 digits
- Vehicle numbers are stored in uppercase
- Payment is mocked and has a 90% success rate
- QR codes are generated as base64 data URIs
- Passwords are hashed using bcrypt
- JWT tokens expire after 30 days
