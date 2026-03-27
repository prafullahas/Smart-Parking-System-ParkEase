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

    // Create sample locations with floors information
    const locations = [
      {
        name: 'City Mall Parking',
        address: '123 Main Street, Downtown',
        coordinates: { lat: 12.9716, long: 77.5946 },
        totalSlots: 100,
        floors: 3,
        availableSlots: 100,
        type: 'mall',
        pricePerHour: { car: 60, bike: 25 }
      },
      {
        name: 'Central Hospital Parking',
        address: '456 Health Avenue, Medical District',
        coordinates: { lat: 12.9655, long: 77.5928 },
        totalSlots: 80,
        floors: 2,
        availableSlots: 80,
        type: 'hospital',
        pricePerHour: { car: 40, bike: 15 }
      },
      {
        name: 'Grand Cinema Complex',
        address: '789 Entertainment Road, Cinema District',
        coordinates: { lat: 12.9756, long: 77.5900 },
        totalSlots: 120,
        floors: 4,
        availableSlots: 120,
        type: 'theatre',
        pricePerHour: { car: 70, bike: 30 }
      },
      {
        name: 'Airport Premium Parking',
        address: '1000 Airport Road, Aviation Area',
        coordinates: { lat: 12.9800, long: 77.5850 },
        totalSlots: 200,
        floors: 5,
        availableSlots: 200,
        type: 'airport',
        pricePerHour: { car: 100, bike: 50 }
      },
      {
        name: 'Sports Stadium Parking',
        address: '2000 Sports Boulevard, Recreation Zone',
        coordinates: { lat: 12.9600, long: 77.6000 },
        totalSlots: 150,
        floors: 3,
        availableSlots: 150,
        type: 'stadium',
        pricePerHour: { car: 80, bike: 35 }
      }
    ];

    // Insert locations
    const createdLocations = await Location.insertMany(locations);
    console.log('Created locations:', createdLocations.map(loc => loc.name));

    // Create sample slots for each location
    for (const location of createdLocations) {
      const slots = [];
      
      // Create slots for each floor
      for (let floor = 1; floor <= location.floors; floor++) {
        const slotsPerFloor = Math.floor(location.totalSlots / location.floors);
        
        for (let i = 1; i <= slotsPerFloor; i++) {
          const slotType = Math.random() > 0.7 ? 'bike' : 'car';
          slots.push({
            locationId: location._id,
            slotNumber: `${floor}${String.fromCharCode(64 + i)}`, // e.g., 1A, 1B, 2A, 2B
            floor: `Floor ${floor}`,
            type: slotType,
            isAvailable: true,
            pricePerHour: location.pricePerHour[slotType]
          });
        }
      }
      
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