const mongoose = require('mongoose');
const Slot = require('../models/Slot');
const Location = require('../models/Location');
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
    // Update all existing slots to include default values for new fields
    const slots = await Slot.find({});
    
    for (const slot of slots) {
      // Set default values if not already set
      if (slot.isPremium === undefined) slot.isPremium = false;
      if (slot.isHandicapped === undefined) slot.isHandicapped = false;
      if (slot.isNearEntrance === undefined) slot.isNearEntrance = false;
      if (slot.isNearExit === undefined) slot.isNearExit = false;
      if (slot.isNearLift === undefined) slot.isNearLift = false;
      
      // Set a default floor if not already set
      if (!slot.floor) {
        slot.floor = 'Ground';
      }
      
      await slot.save();
    }
    
    console.log(`Updated ${slots.length} slots with new fields`);
    
    // Create sample slots with different features for testing
    const locations = await Location.find({});
    
    if (locations.length > 0) {
      // Use the first location for sample data
      const location = locations[0];
      
      // Check if sample slots already exist
      const existingSampleSlots = await Slot.countDocuments({ 
        locationId: location._id,
        slotNumber: { $regex: /^SAMPLE/ }
      });
      
      if (existingSampleSlots === 0) {
        console.log('Creating sample slots for testing...');
        
        const sampleSlots = [
          // Regular slots
          {
            locationId: location._id,
            slotNumber: 'SAMPLE-001',
            vehicleType: 'car',
            pricePerHour: 50,
            floor: 'Ground',
            isAvailable: true
          },
          {
            locationId: location._id,
            slotNumber: 'SAMPLE-002',
            vehicleType: 'car',
            pricePerHour: 50,
            floor: 'Ground',
            isAvailable: false // Booked
          },
          {
            locationId: location._id,
            slotNumber: 'SAMPLE-003',
            vehicleType: 'bike',
            pricePerHour: 20,
            floor: 'Ground',
            isAvailable: true
          },
          // Premium slots
          {
            locationId: location._id,
            slotNumber: 'SAMPLE-P01',
            vehicleType: 'car',
            pricePerHour: 80, // Higher price for premium
            floor: 'Ground',
            isAvailable: true,
            isPremium: true,
            isNearEntrance: true
          },
          {
            locationId: location._id,
            slotNumber: 'SAMPLE-P02',
            vehicleType: 'car',
            pricePerHour: 80,
            floor: 'Ground',
            isAvailable: true,
            isPremium: true,
            isNearLift: true
          },
          // Handicapped slots
          {
            locationId: location._id,
            slotNumber: 'SAMPLE-H01',
            vehicleType: 'car',
            pricePerHour: 50,
            floor: 'Ground',
            isAvailable: true,
            isHandicapped: true,
            isNearEntrance: true
          },
          // Slots on first floor
          {
            locationId: location._id,
            slotNumber: 'SAMPLE-1F-01',
            vehicleType: 'car',
            pricePerHour: 60, // Slightly higher for upper floor
            floor: 'First',
            isAvailable: true
          },
          {
            locationId: location._id,
            slotNumber: 'SAMPLE-1F-02',
            vehicleType: 'bike',
            pricePerHour: 25,
            floor: 'First',
            isAvailable: true
          },
          {
            locationId: location._id,
            slotNumber: 'SAMPLE-1F-P01',
            vehicleType: 'car',
            pricePerHour: 90, // Premium on first floor
            floor: 'First',
            isAvailable: true,
            isPremium: true,
            isNearLift: true
          }
        ];
        
        await Slot.insertMany(sampleSlots);
        console.log('Created sample slots with various features');
      } else {
        console.log('Sample slots already exist, skipping creation');
      }
    }
    
    console.log('Slot update completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating slots:', error);
    process.exit(1);
  }
});