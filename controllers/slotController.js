const Slot = require('../models/Slot');
const Location = require('../models/Location');
const Booking = require('../models/Booking');
const mongoose = require('mongoose');
const { deriveSlotState } = require('../utils/slotState');

const enrichSlotStates = async (slots) => {
  if (!slots || slots.length === 0) return slots;

  const slotIds = slots.map((slot) => slot._id);
  const slotIdStrings = slotIds.map((id) => id.toString());
  const slotNumbers = slots.map((slot) => slot.slotNumber);
  const now = new Date();

  const activeBookings = await Booking.find({
    slotId: { $in: slotIds },
    status: 'active',
    endTime: { $gt: now }
  }).select('slotId checkInTime vehicleNumber');

  const bookingMap = {};
  activeBookings.forEach((booking) => {
    bookingMap[booking.slotId.toString()] = booking;
  });

  const slotNumberById = {};
  slots.forEach((slot) => {
    slotNumberById[slot._id.toString()] = slot.slotNumber;
  });

  const sensorDocs = await mongoose.connection
    .collection('bookings')
    .find({
      is_parked: { $exists: true },
      $or: [
        { slot_number: { $in: slotNumbers } },
        { slot_id: { $in: slotNumbers } },
        { slot_id: { $in: slotIdStrings } },
        { slotId: { $in: slotIdStrings } }
      ]
    })
    .sort({ timestamp: -1 })
    .toArray();

  const latestSensorBySlot = {};
  sensorDocs.forEach((doc) => {
    const sensorSlotKey = String(doc.slot_number || doc.slot_id || doc.slotId || '').trim();
    if (!sensorSlotKey) return;
    const resolvedSlotNumber = slotNumberById[sensorSlotKey] || sensorSlotKey;
    if (!latestSensorBySlot[resolvedSlotNumber]) {
      latestSensorBySlot[resolvedSlotNumber] = doc;
    }
  });

  return slots.map((slot) => {
    const slotObj = slot.toObject ? slot.toObject() : { ...slot };
    const booking = bookingMap[slot._id.toString()];
    const sensorState = latestSensorBySlot[slot.slotNumber];
    const sensorKnown = typeof sensorState?.is_parked === 'boolean';
    const sensorParked = sensorState?.is_parked === true;
    const hasActiveBooking = Boolean(booking);

    // Sensor=true means occupied; otherwise booking reservation controls availability.
    slotObj.isAvailable = sensorKnown ? (!sensorParked && !hasActiveBooking) : !hasActiveBooking;

    slotObj.slotState = deriveSlotState({
      currentSlotState: slotObj.slotState,
      hasActiveBooking,
      checkInTime: booking?.checkInTime || null,
      sensorKnown,
      sensorParked,
      sensorVehicleNumber: sensorState?.vehicle_number || null,
      bookedVehicleNumber: booking?.vehicleNumber || null
    });

    if (sensorState) {
      slotObj.sensorStatus = {
        isParked: sensorState.is_parked === true,
        timestamp: sensorState.timestamp || null,
        vehicleNumber: sensorState.vehicle_number || null
      };
    }

    if (hasActiveBooking) {
      slotObj.currentBooking = {
        checkInTime: booking.checkInTime,
        vehicleNumber: booking.vehicleNumber
      };
    }

    return slotObj;
  });
};

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

    const enrichedSlots = await enrichSlotStates(slots);

    res.json({
      success: true,
      count: enrichedSlots.length,
      data: enrichedSlots
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

    const enrichedSlots = await enrichSlotStates(slots);

    res.json({
      success: true,
      count: enrichedSlots.length,
      data: enrichedSlots
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
    const enrichedSlots = await enrichSlotStates(slots);
    const rows = [...new Set(enrichedSlots.map(slot => slot.row))].sort();
    
    rows.forEach(row => {
      slotsByRow[row] = enrichedSlots.filter(slot => slot.row === row)
        .sort((a, b) => a.position - b.position);
    });

    // Calculate statistics
    const stats = {
      total: enrichedSlots.length,
      available: enrichedSlots.filter(s => s.isAvailable).length,
      booked: enrichedSlots.filter(s => !s.isAvailable).length,
      handicapped: enrichedSlots.filter(s => s.isHandicapped).length,
      nearEntrance: enrichedSlots.filter(s => s.isNearEntrance).length,
      nearExit: enrichedSlots.filter(s => s.isNearExit).length,
      carSlots: enrichedSlots.filter(s => s.vehicleType === 'car').length
    };

    res.json({
      success: true,
      floor: floorName,
      rows: rows,
      slotsByRow,
      stats,
      data: enrichedSlots
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

    const [enrichedSlot] = await enrichSlotStates([slot]);

    res.json({
      success: true,
      data: enrichedSlot
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
    const { locationId, slotNumber, pricePerHour, floor, row, position, isPremium, isHandicapped, isNearEntrance, isNearExit, isNearLift } = req.body;

    // Validate required fields
    if (!locationId || !slotNumber || !pricePerHour || !row || !position) {
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
      vehicleType: 'car',
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
    const { locationId, slotPrefix, startNumber, endNumber, pricePerHour, floor, row, isPremium, isHandicapped, isNearEntrance, isNearExit, isNearLift } = req.body;

    // Validate required fields
    if (!locationId || !slotPrefix || !startNumber || !endNumber || !pricePerHour || !row) {
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
        vehicleType: 'car',
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
    slot.slotState = isAvailable ? 'NOT_BOOKED' : (slot.slotState === 'NOT_BOOKED' ? 'BOOKED' : slot.slotState);
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

    const payload = { ...req.body, vehicleType: 'car' };

    const updatedSlot = await Slot.findByIdAndUpdate(
      req.params.id,
      payload,
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

// @desc    Get all slots overview for admin
// @route   GET /api/slots/admin/overview
// @access  Private/Admin
const getAdminSlotsOverview = async (req, res) => {
  try {
    // Get all locations
    const locations = await Location.find({});

    const overview = [];

    for (const location of locations) {
      // Get all slots for this location
      const slots = await Slot.find({ locationId: location._id });

      // Enrich slots with current state
      const enrichedSlots = await enrichSlotStates(slots);

      // Count slots by state
      const stats = {
        total: enrichedSlots.length,
        notBooked: enrichedSlots.filter(s => s.slotState === 'NOT_BOOKED').length,
        booked: enrichedSlots.filter(s => s.slotState === 'BOOKED').length,
        arrived: enrichedSlots.filter(s => s.slotState === 'ARRIVED').length,
        expired: enrichedSlots.filter(s => s.slotState === 'EXPIRED').length,
      carSlots: enrichedSlots.filter(s => s.vehicleType === 'car').length
      };

      overview.push({
        locationId: location._id,
        locationName: location.name,
        address: location.address,
        totalSlots: location.totalSlots,
        availableSlots: location.availableSlots,
        stats,
        slots: enrichedSlots
      });
    }

    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin overview',
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
  deleteSlot,
  getAdminSlotsOverview
};