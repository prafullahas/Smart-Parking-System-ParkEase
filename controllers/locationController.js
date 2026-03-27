const Location = require('../models/Location');
const Slot = require('../models/Slot');

// @desc    Get all locations
// @route   GET /api/locations
// @access  Public
const getAllLocations = async (req, res) => {
  try {
    const { type, search } = req.query;
    let query = {};

    // Filter by type if provided
    if (type) {
      query.type = type;
    }

    // Search by name or address
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    const locations = await Location.find(query).sort({ name: 1 });

    res.json({
      success: true,
      count: locations.length,
      data: locations
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching locations',
      error: error.message
    });
  }
};

// @desc    Get location by ID
// @route   GET /api/locations/:id
// @access  Public
const getLocationById = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    // Get slots for this location
    const slots = await Slot.find({ locationId: location._id });
    const availableSlots = slots.filter(slot => slot.isAvailable).length;

    res.json({
      success: true,
      data: {
        ...location.toObject(),
        slots: slots,
        actualAvailableSlots: availableSlots
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching location',
      error: error.message
    });
  }
};

// @desc    Create new location (Admin only - can be protected later)
// @route   POST /api/locations
// @access  Private/Admin
const createLocation = async (req, res) => {
  try {
    const { name, address, coordinates, totalSlots, floors, type, pricePerHour } = req.body;

    // Validate required fields
    if (!name || !address || !coordinates || !totalSlots || !floors || !type) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, address, coordinates, totalSlots, floors, type'
      });
    }

    const location = await Location.create({
      name,
      address,
      coordinates,
      totalSlots,
      floors,
      availableSlots: totalSlots,
      type,
      pricePerHour: pricePerHour || { car: 50, bike: 20 }
    });

    res.status(201).json({
      success: true,
      data: location
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error creating location',
      error: error.message
    });
  }
};

// @desc    Update location
// @route   PUT /api/locations/:id
// @access  Private/Admin
const updateLocation = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    const updatedLocation = await Location.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedLocation
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error updating location',
      error: error.message
    });
  }
};

// @desc    Delete location
// @route   DELETE /api/locations/:id
// @access  Private/Admin
const deleteLocation = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    // Delete all slots for this location
    await Slot.deleteMany({ locationId: req.params.id });

    await location.deleteOne();

    res.json({
      success: true,
      message: 'Location deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error deleting location',
      error: error.message
    });
  }
};

// @desc    Get nearby locations based on coordinates
// @route   GET /api/locations/nearby
// @access  Public
const getNearbyLocations = async (req, res) => {
  try {
    const { lat, long, radius = 10 } = req.query;

    if (!lat || !long) {
      return res.status(400).json({
        success: false,
        message: 'Please provide latitude and longitude'
      });
    }

    // Simple distance calculation (can be enhanced with MongoDB geospatial queries)
    const locations = await Location.find();
    
    const nearbyLocations = locations.filter(location => {
      const distance = calculateDistance(
        parseFloat(lat),
        parseFloat(long),
        location.coordinates.lat,
        location.coordinates.long
      );
      return distance <= parseFloat(radius);
    });

    res.json({
      success: true,
      count: nearbyLocations.length,
      data: nearbyLocations
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching nearby locations',
      error: error.message
    });
  }
};

// Helper function to calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

const toRad = (value) => {
  return value * Math.PI / 180;
};

module.exports = {
  getAllLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
  getNearbyLocations
};