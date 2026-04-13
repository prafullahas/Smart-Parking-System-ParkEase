const mongoose = require('mongoose');
const Location = require('../models/Location');
const Slot = require('../models/Slot');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');

  try {
    // Clear existing slots
    await Slot.deleteMany({});
    console.log('Cleared existing slots');

    // Get all locations
    const locations = await Location.find({});
    console.log(`Found ${locations.length} locations`);

    // Create a fixed 6-slot layout for each location.
    for (const location of locations) {
      const slots = [
        { slotNumber: 'A1', row: 'A', position: 1, vehicleType: 'car', isNearEntrance: true },
        { slotNumber: 'A2', row: 'A', position: 2, vehicleType: 'car', isNearEntrance: true },
        { slotNumber: 'A3', row: 'A', position: 3, vehicleType: 'car', isPremium: true },
        { slotNumber: 'B1', row: 'B', position: 1, vehicleType: 'car' },
        { slotNumber: 'B2', row: 'B', position: 2, vehicleType: 'car' },
        { slotNumber: 'B3', row: 'B', position: 3, vehicleType: 'car', isNearExit: true }
      ].map((slot) => ({
        locationId: location._id,
        slotNumber: slot.slotNumber,
        floor: 'Ground Floor',
        row: slot.row,
        position: slot.position,
        vehicleType: slot.vehicleType,
        pricePerHour: location.pricePerHour[slot.vehicleType],
        isAvailable: true,
        isPremium: Boolean(slot.isPremium),
        isHandicapped: false,
        isNearEntrance: Boolean(slot.isNearEntrance),
        isNearExit: Boolean(slot.isNearExit),
        isNearLift: false
      }));
      
      // Insert slots for this location
      await Slot.insertMany(slots);
      console.log(`Created ${slots.length} slots for ${location.name}`);
      
      // Update location's total and available slots
      location.totalSlots = 6;
      location.availableSlots = 6;
      location.floors = 1;
      await location.save();
    }

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
});
