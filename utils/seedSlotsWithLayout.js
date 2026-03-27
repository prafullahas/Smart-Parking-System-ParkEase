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

    // Create slots with layout for each location
    for (const location of locations) {
      const slots = [];
      const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      const slotsPerRow = 10;
      
      // Create slots for each floor
      for (let floorNum = 1; floorNum <= location.floors; floorNum++) {
        const floorName = `Floor ${floorNum}`;
        
        // Determine number of rows for this floor
        const rowsForFloor = Math.min(rows.length, Math.ceil(location.totalSlots / location.floors / slotsPerRow));
        
        for (let rowIndex = 0; rowIndex < rowsForFloor; rowIndex++) {
          const row = rows[rowIndex];
          
          for (let position = 1; position <= slotsPerRow; position++) {
            const slotNumber = `${floorNum}${row}${position}`;
            
            // Determine vehicle type (70% car, 30% bike)
            const vehicleType = Math.random() > 0.3 ? 'car' : 'bike';
            
            // Determine if slot is handicapped (5% chance)
            const isHandicapped = Math.random() < 0.05;
            
            // First and last positions in row A are near entrance/exit
            const isNearEntrance = (row === 'A' && position <= 2);
            const isNearExit = (row === 'A' && position >= slotsPerRow - 1);
            
            // Premium slots (row A, first 3 positions, not handicapped)
            const isPremium = (row === 'A' && position <= 3 && !isHandicapped);
            
            // Near lift (row H)
            const isNearLift = (row === rows[rowsForFloor - 1]);
            
            // Calculate price
            let pricePerHour = location.pricePerHour[vehicleType];
            if (isPremium) {
              pricePerHour = Math.floor(pricePerHour * 1.5); // Premium 50% more
            }
            
            slots.push({
              locationId: location._id,
              slotNumber,
              floor: floorName,
              row,
              position,
              vehicleType,
              pricePerHour,
              isAvailable: true,
              isPremium,
              isHandicapped,
              isNearEntrance,
              isNearExit,
              isNearLift
            });
          }
        }
      }
      
      // Insert slots for this location
      await Slot.insertMany(slots);
      console.log(`Created ${slots.length} slots for ${location.name}`);
      
      // Update location's total and available slots
      location.totalSlots = slots.length;
      location.availableSlots = slots.length;
      await location.save();
    }

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
});
