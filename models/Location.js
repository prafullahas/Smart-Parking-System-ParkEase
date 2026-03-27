const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a location name'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Please provide an address'],
    trim: true
  },
  coordinates: {
    lat: {
      type: Number,
      required: [true, 'Please provide latitude']
    },
    long: {
      type: Number,
      required: [true, 'Please provide longitude']
    }
  },
  totalSlots: {
    type: Number,
    required: [true, 'Please provide total slots'],
    min: 0
  },
  availableSlots: {
    type: Number,
    required: [true, 'Please provide available slots'],
    min: 0
  },
  floors: {
    type: Number,
    required: [true, 'Please provide number of floors'],
    min: 1
  },
  type: {
    type: String,
    required: [true, 'Please provide location type'],
    enum: ['mall', 'hospital', 'theatre', 'airport', 'stadium', 'other']
  },
  pricePerHour: {
    car: {
      type: Number,
      default: 50
    },
    bike: {
      type: Number,
      default: 20
    }
  },
  operatingHours: {
    open: {
      type: String,
      default: '00:00'
    },
    close: {
      type: String,
      default: '23:59'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for geospatial queries
locationSchema.index({ 'coordinates.lat': 1, 'coordinates.long': 1 });

module.exports = mongoose.model('Location', locationSchema);