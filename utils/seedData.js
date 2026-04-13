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
    // Clear existing data
    await Location.deleteMany({});
    await Slot.deleteMany({});
    console.log('Cleared existing data');

    // Keep the app focused on a single MMCOE parking location.
    const locations = [
      {
        name: 'MMCOE Campus Parking',
        address: 'MMCOE College Campus, Pune',
        coordinates: { lat: 18.4575, long: 73.8508 },
        totalSlots: 6,
        floors: 1,
        availableSlots: 6,
        type: 'other',
        pricePerHour: { car: 50 }
      }
    ];

    // Insert locations
    const createdLocations = await Location.insertMany(locations);
    console.log('Created locations:', createdLocations.map(loc => loc.name));

    // Create exactly 6 slots for the MMCOE location.
    for (const location of createdLocations) {
      const slots = [
        { slotNumber: 'A1', vehicleType: 'car', row: 'A', position: 1 },
        { slotNumber: 'A2', vehicleType: 'car', row: 'A', position: 2 },
        { slotNumber: 'A3', vehicleType: 'car', row: 'A', position: 3 },
        { slotNumber: 'B1', vehicleType: 'car', row: 'B', position: 1 },
        { slotNumber: 'B2', vehicleType: 'car', row: 'B', position: 2 },
        { slotNumber: 'B3', vehicleType: 'car', row: 'B', position: 3 }
      ].map((slot) => ({
        locationId: location._id,
        slotNumber: slot.slotNumber,
        vehicleType: slot.vehicleType,
        isAvailable: true,
        pricePerHour: location.pricePerHour[slot.vehicleType],
        floor: 'Ground Floor',
        row: slot.row,
        position: slot.position
      }));
      
      // Insert slots for this location
      await Slot.insertMany(slots);
      console.log(`Created ${slots.length} slots for ${location.name}`);
    }

    console.log('Database seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
});