const mongoose = require('mongoose');
require('dotenv').config();

async function checkSlots() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Slot = require('./models/Slot');
    const Booking = require('./models/Booking');

    const slots = await Slot.find({}).limit(10);
    console.log('Sample slots:');
    slots.forEach(slot => {
      console.log(`Slot ${slot.slotNumber}: Available=${slot.isAvailable}, Vehicle=${slot.vehicleType}`);
    });

    const activeBookings = await Booking.find({ status: 'active' });
    console.log(`\nActive bookings: ${activeBookings.length}`);

    const now = new Date();
    const expiredBookings = await Booking.find({
      status: 'active',
      endTime: { $lt: now }
    });
    console.log(`Expired active bookings: ${expiredBookings.length}`);

    if (expiredBookings.length > 0) {
      console.log('\nExpired bookings:');
      expiredBookings.forEach(booking => {
        console.log(`Booking ${booking._id}: End time ${booking.endTime}, Slot ${booking.slotId}`);
      });
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkSlots();