const dotenv = require('dotenv');
const connectDB = require('../config/db');
const Slot = require('../models/Slot');

dotenv.config();

const migrateSlotsToCar = async () => {
  const connected = await connectDB();
  if (!connected) {
    process.exit(1);
  }

  try {
    const result = await Slot.updateMany({}, { $set: { vehicleType: 'car' } });
    console.log(`Updated slots to car-only. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
    process.exit(0);
  } catch (error) {
    console.error('Failed to migrate slots:', error.message);
    process.exit(1);
  }
};

migrateSlotsToCar();
