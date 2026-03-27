const mongoose = require('mongoose');
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
    // Find all locations that don't have floors field
    const locations = await Location.find({ floors: { $exists: false } });
    
    if (locations.length === 0) {
      console.log('No locations need to be updated');
      process.exit(0);
    }

    console.log(`Found ${locations.length} locations to update`);

    // Update each location with a default floors value
    for (const location of locations) {
      // Default to 2 floors if not specified
      location.floors = 2;
      await location.save();
      console.log(`Updated ${location.name} with ${location.floors} floors`);
    }

    console.log('All locations updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating locations:', error);
    process.exit(1);
  }
});