const cron = require('node-cron');
const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const Location = require('../models/Location');
const { sendNotification } = require('./notificationService');

// Function to complete expired bookings and release slots
const completeExpiredBookings = async () => {
  try {
    const now = new Date();

    // Find all active bookings that have expired
    const expiredBookings = await Booking.find({
      status: 'active',
      endTime: { $lt: now }
    }).populate('slotId locationId');

    console.log(`Found ${expiredBookings.length} expired bookings to complete`);

    for (const booking of expiredBookings) {
      // Update booking status to completed
      booking.status = 'completed';
      booking.checkOutTime = now;
      await booking.save();

      // Release the slot
      if (booking.slotId) {
        booking.slotId.isAvailable = true;
        booking.slotId.slotState = 'NOT_BOOKED';
        await booking.slotId.save();
      }

      // Update location available slots
      if (booking.locationId) {
        booking.locationId.availableSlots += 1;
        await booking.locationId.save();
      }

      console.log(`Completed booking ${booking._id} and released slot ${booking.slotId?.slotNumber}`);
    }

    if (expiredBookings.length > 0) {
      console.log(`Successfully completed ${expiredBookings.length} expired bookings`);
    }

    // Release visually expired slots after they have stayed in EXPIRED state for 5 minutes.
    const releaseWindow = new Date(now.getTime() - 5 * 60 * 1000);
    const expiredSlotBookings = await Booking.find({
      status: 'expired',
      expiredAt: { $lte: releaseWindow }
    }).populate('slotId locationId');

    for (const booking of expiredSlotBookings) {
      const slot = booking.slotId;
      const location = booking.locationId;

      if (slot && slot.slotState === 'EXPIRED') {
        slot.isAvailable = true;
        slot.slotState = 'NOT_BOOKED';
        await slot.save();
        console.log(`Released expired slot ${slot.slotNumber} after grace period`);
      }

      if (location) {
        location.availableSlots += 1;
        await location.save();
      }
    }

    // Keep slot flags consistent with real-time active booking windows.
    const currentlyBookedSlotIds = await Booking.distinct('slotId', {
      status: 'active',
      endTime: { $gt: now }
    });
    await Slot.updateMany(
      { _id: { $in: currentlyBookedSlotIds } },
      { $set: { isAvailable: false } }
    );
    await Slot.updateMany(
      { _id: { $nin: currentlyBookedSlotIds } },
      { $set: { isAvailable: true, slotState: 'NOT_BOOKED' } }
    );

    // Recompute location counts from slot states.
    const locations = await Location.find({});
    for (const location of locations) {
      const availableSlots = await Slot.countDocuments({
        locationId: location._id,
        isAvailable: true
      });
      location.availableSlots = availableSlots;
      await location.save();
    }
  } catch (error) {
    console.error('Error completing expired bookings:', error);
  }
};

// Function to check for no-show bookings (car didn't arrive within grace period)
const checkNoShowBookings = async () => {
  try {
    const now = new Date();
    const late5 = new Date(now.getTime() - 5 * 60 * 1000);
    const late10 = new Date(now.getTime() - 10 * 60 * 1000);
    const gracePeriodStart = new Date(now.getTime() - 15 * 60 * 1000);

    // Find active bookings that have started and still have no check-in.
    const potentialNoShows = await Booking.find({
      status: 'active',
      startTime: { $lte: now },
      checkInTime: null
    }).populate('slotId', 'slotNumber').populate('userId', 'email name phone');

    console.log(`Checking ${potentialNoShows.length} potential no-show bookings`);

    for (const booking of potentialNoShows) {
      if (!booking.reminderFlags) {
        booking.reminderFlags = {};
      }

      if (booking.startTime <= late5 && !booking.reminderFlags?.late5MinSent) {
        await sendNotification({
          user: booking.userId,
          type: 'LATE_5_MIN',
          message: `You are 5 minutes late for slot ${booking.slotId?.slotNumber}. Please arrive soon.`,
          emailSubject: 'Late Arrival Reminder (5 min) - ParkEase',
          emailHtml: `
            <div style="font-family:Arial,sans-serif;max-width:640px">
              <h2 style="color:#0f172a">You are late</h2>
              <p>Hi ${booking.userId?.name || 'User'}, you are 5 minutes late for your booking.</p>
              <ul>
                <li><strong>Booking ID:</strong> ${booking._id}</li>
                <li><strong>Slot:</strong> ${booking.slotId?.slotNumber || 'N/A'}</li>
                <li><strong>Status:</strong> <span style="color:#16a34a">VALID</span></li>
              </ul>
              <p>Please arrive soon to avoid auto-cancellation.</p>
            </div>
          `,
          booking
        });
        booking.reminderFlags.late5MinSent = true;
        await booking.save();
      }

      if (booking.startTime <= late10 && !booking.reminderFlags?.late10MinSent) {
        await sendNotification({
          user: booking.userId,
          type: 'LATE_10_MIN_WARNING',
          message: `You are 10 minutes late. If you do not arrive in the next 5 minutes, your booking will be cancelled.`,
          emailSubject: 'Final Warning (10 min late) - ParkEase',
          emailHtml: `
            <div style="font-family:Arial,sans-serif;max-width:640px">
              <h2 style="color:#b45309">Final warning</h2>
              <p>You are now 10 minutes late. Arrive within 5 minutes or your booking will be cancelled.</p>
              <ul>
                <li><strong>Booking ID:</strong> ${booking._id}</li>
                <li><strong>Slot:</strong> ${booking.slotId?.slotNumber || 'N/A'}</li>
                <li><strong>Status:</strong> <span style="color:#16a34a">VALID</span></li>
              </ul>
            </div>
          `,
          booking
        });
        booking.reminderFlags.late10MinSent = true;
        await booking.save();
      }

      if (booking.startTime > gracePeriodStart) {
        continue;
      }
      console.log(`No-show detected for booking ${booking._id} - slot ${booking.slotId.slotNumber}`);

      booking.status = 'cancelled';
      booking.expiredAt = now;
      booking.paymentStatus = booking.paymentStatus === 'COMPLETED' ? 'REFUNDED' : 'FAILED';
      booking.reminderFlags.noShowSent = true;
      await booking.save();

      if (booking.slotId) {
        booking.slotId.isAvailable = true;
        booking.slotId.slotState = 'NOT_BOOKED';
        await booking.slotId.save();
      }

      const location = await Location.findById(booking.locationId);
      if (location) {
        location.availableSlots += 1;
        await location.save();
      }

      console.log(`Auto-cancelled booking ${booking._id} after 15 minutes and released slot ${booking.slotId.slotNumber}`);
      await sendNotification({
        user: booking.userId,
        type: 'NO_ARRIVAL_15_MIN',
        message: `Your booking for slot ${booking.slotId?.slotNumber} was auto-cancelled due to no arrival within 15 minutes.`,
        emailSubject: 'Booking Auto-Cancelled - ParkEase',
        emailHtml: `
          <div style="font-family:Arial,sans-serif;max-width:640px">
            <h2 style="color:#b91c1c">Booking Cancelled</h2>
            <p>Your booking was auto-cancelled due to no arrival within 15 minutes.</p>
            <ul>
              <li><strong>Booking ID:</strong> ${booking._id}</li>
              <li><strong>Slot:</strong> ${booking.slotId?.slotNumber || 'N/A'}</li>
              <li><strong>Status:</strong> <span style="color:#b91c1c">CANCELLED</span></li>
            </ul>
          </div>
        `,
        booking
      });
    }
  } catch (error) {
    console.error('Error checking no-show bookings:', error);
  }
};

// Start the scheduler
const startScheduler = () => {
  // Run every minute to complete expired bookings
  cron.schedule('* * * * *', async () => {
    await completeExpiredBookings();
  });

  // Run every minute to check no-shows and late alerts
  cron.schedule('* * * * *', async () => {
    await checkNoShowBookings();
  });

  console.log('Booking scheduler started - checking for expired bookings every minute');
  console.log('Checking for no-show bookings every minute');
};

// Graceful shutdown
const stopScheduler = () => {
  cron.getTasks().forEach(task => task.destroy());
  console.log('Booking scheduler stopped');
};

module.exports = {
  startScheduler,
  stopScheduler,
  completeExpiredBookings,
  checkNoShowBookings
};