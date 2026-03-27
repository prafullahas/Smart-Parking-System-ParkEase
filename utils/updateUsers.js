const mongoose = require('mongoose');
const User = require('../models/User');
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
    // Find all users that don't have vehicle field
    const users = await User.find({ vehicle: { $exists: false } });
    
    if (users.length === 0) {
      console.log('No users need to be updated');
      process.exit(0);
    }

    console.log(`Found ${users.length} users to update`);

    // Update each user with an empty vehicle object
    for (const user of users) {
      user.vehicle = {};
      await user.save();
      console.log(`Updated ${user.name} with empty vehicle field`);
    }

    console.log('All users updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating users:', error);
    process.exit(1);
  }
});