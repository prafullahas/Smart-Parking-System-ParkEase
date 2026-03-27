const Slot = require('../models/Slot');
const Location = require('../models/Location');

// @desc    Get all slots for a location
// @route   GET /api/slots/location/:locationId
// @access  Public
const getSlotsByLocation = async (req, res) => {
  try {
    const { locationId } = req.params;
    const { vehicleType, available, floor } = req.query;

    let query = { locationId };

    // Filter by vehicle type if provided
    if (vehicleType) {
      query.vehicleType = vehicleType;
    }

    // Filter by availability if provided
    if (available !== undefined) {
      query.isAvailable = available === 'true';
    }

    // Filter by floor if provided
    if (floor) {
      query.floor = floor;
    }

    const slots = await Slot.find(query)
      .populate('locationId', 'name address')
      .sort({ slotNumber: 1 });

    res.json({
      success: true,
      count: slots.length,
      data: slots
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching slots',
      error: error.message
    });
  }
};

// @desc    Get available slots for a location
// @route   GET /api/slots/location/:locationId/available
// @access  Public
const getAvailableSlots = async (req, res) => {
  try {
    const { locationId } = req.params;
    const { vehicleType, floor } = req.query;

    let query = { locationId, isAvailable: true };

    if (vehicleType) {
      query.vehicleType = vehicleType;
    }

    // Filter by floor if provided
    if (floor) {
      query.floor = floor;
    }

    const slots = await Slot.find(query)
      .populate('locationId', 'name address')
      .sort({ slotNumber: 1 });

    res.json({
      success: true,
      count: slots.length,
      data: slots
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available slots',
      error: error.message
    });
  }
};

// @desc    Get all floors for a location
// @route   GET /api/slots/location/:locationId/floors
// @access  Public
const getFloorsByLocation = async (req, res) => {
  try {
    const { locationId } = req.params;

    // Get distinct floors for this location
    const floors = await Slot.distinct('floor', { locationId })
      .sort();

    res.json({
      success: true,
      count: floors.length,
      data: floors
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching floors',
      error: error.message
    });
  }
};

// @desc    Get floor details with slot layout
// @route   GET /api/slots/location/:locationId/floor/:floorName
// @access  Public
const getFloorDetails = async (req, res) => {
  try {
    const { locationId, floorName } = req.params;

    // Get all slots for this floor
    const slots = await Slot.find({ locationId, floor: floorName })
      .populate('locationId', 'name address')
      .sort({ row: 1, position: 1 });

    if (slots.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No slots found for this floor'
      });
    }

    // Organize slots by row
    const slotsByRow = {};
    const rows = [...new Set(slots.map(slot => slot.row))].sort();
    
    rows.forEach(row => {
      slotsByRow[row] = slots.filter(slot => slot.row === row)
        .sort((a, b) => a.position - b.position);
    });

    // Calculate statistics
    const stats = {
      total: slots.length,
      available: slots.filter(s => s.isAvailable).length,
      booked: slots.filter(s => !s.isAvailable).length,
      handicapped: slots.filter(s => s.isHandicapped).length,
      nearEntrance: slots.filter(s => s.isNearEntrance).length,
      nearExit: slots.filter(s => s.isNearExit).length,
      carSlots: slots.filter(s => s.vehicleType === 'car').length,
      bikeSlots: slots.filter(s => s.vehicleType === 'bike').length
    };

    res.json({
      success: true,
      floor: floorName,
      rows: rows,
      slotsByRow,
      stats,
      data: slots
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching floor details',
      error: error.message
    });
  }
};

// @desc    Get slot by ID
// @route   GET /api/slots/:id
// @access  Public
const getSlotById = async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id)
      .populate('locationId');

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Slot not found'
      });
    }

    res.json({
      success: true,
      data: slot
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching slot',
      error: error.message
    });
  }
};

// @desc    Create new slot (Admin only)
// @route   POST /api/slots
// @access  Private/Admin
const createSlot = async (req, res) => {
  try {
    const { locationId, slotNumber, vehicleType, pricePerHour, floor, row, position, isPremium, isHandicapped, isNearEntrance, isNearExit, isNearLift } = req.body;

    // Validate required fields
    if (!locationId || !slotNumber || !vehicleType || !pricePerHour || !row || !position) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if location exists
    const location = await Location.findById(locationId);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    // Check if slot number already exists for this location
    const existingSlot = await Slot.findOne({ locationId, slotNumber });
    if (existingSlot) {
      return res.status(400).json({
        success: false,
        message: 'Slot number already exists for this location'
      });
    }

    const slot = await Slot.create({
      locationId,
      slotNumber,
      vehicleType,
      pricePerHour,
      floor: floor || 'Ground',
      row,
      position,
      isPremium: isPremium || false,
      isHandicapped: isHandicapped || false,
      isNearEntrance: isNearEntrance || false,
      isNearExit: isNearExit || false,
      isNearLift: isNearLift || false
    });

    res.status(201).json({
      success: true,
      data: slot
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error creating slot',
      error: error.message
    });
  }
};

// @desc    Create multiple slots for a location
// @route   POST /api/slots/bulk
// @access  Private/Admin
const createBulkSlots = async (req, res) => {
  try {
    const { locationId, slotPrefix, startNumber, endNumber, vehicleType, pricePerHour, floor, row, isPremium, isHandicapped, isNearEntrance, isNearExit, isNearLift } = req.body;

    // Validate required fields
    if (!locationId || !slotPrefix || !startNumber || !endNumber || !vehicleType || !pricePerHour || !row) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if location exists
    const location = await Location.findById(locationId);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    const slots = [];
    for (let i = startNumber; i <= endNumber; i++) {
      slots.push({
        locationId,
        slotNumber: `${slotPrefix}${i}`,
        vehicleType,
        pricePerHour,
        floor: floor || 'Ground',
        row,
        position: i,
        isPremium: isPremium || false,
        isHandicapped: isHandicapped || false,
        isNearEntrance: isNearEntrance || false,
        isNearExit: isNearExit || false,
        isNearLift: isNearLift || false
      });
    }

    const createdSlots = await Slot.insertMany(slots);

    res.status(201).json({
      success: true,
      count: createdSlots.length,
      data: createdSlots
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error creating slots',
      error: error.message
    });
  }
};

// @desc    Update slot status
// @route   PUT /api/slots/:id/status
// @access  Private
const updateSlotStatus = async (req, res) => {
  try {
    const { isAvailable } = req.body;

    const slot = await Slot.findById(req.params.id);

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Slot not found'
      });
    }

    slot.isAvailable = isAvailable;
    await slot.save();

    // Update location available slots count
    const location = await Location.findById(slot.locationId);
    if (location) {
      const availableSlots = await Slot.countDocuments({
        locationId: slot.locationId,
        isAvailable: true
      });
      location.availableSlots = availableSlots;
      await location.save();
    }

    res.json({
      success: true,
      data: slot
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error updating slot status',
      error: error.message
    });
  }
};

// @desc    Update slot
// @route   PUT /api/slots/:id
// @access  Private/Admin
const updateSlot = async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id);

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Slot not found'
      });
    }

    const updatedSlot = await Slot.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedSlot
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error updating slot',
      error: error.message
    });
  }
};

// @desc    Delete slot
// @route   DELETE /api/slots/:id
// @access  Private/Admin
const deleteSlot = async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id);

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Slot not found'
      });
    }

    await slot.deleteOne();

    res.json({
      success: true,
      message: 'Slot deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error deleting slot',
      error: error.message
    });
  }
};

module.exports = {
  getSlotsByLocation,
  getAvailableSlots,
  getFloorsByLocation,
  getFloorDetails,
  getSlotById,
  createSlot,
  createBulkSlots,
  updateSlotStatus,
  updateSlot,
  deleteSlot
};