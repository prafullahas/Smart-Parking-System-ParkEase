/**
 * Parking slot lifecycle for API responses (derived from booking + sensor).
 * NOT_BOOKED → BOOKED → ARRIVED
 */
const SLOT_STATES = ['NOT_BOOKED', 'BOOKED', 'ARRIVED', 'EXPIRED'];

function deriveSlotState({ currentSlotState, hasActiveBooking, checkInTime, sensorKnown, sensorParked, sensorVehicleNumber, bookedVehicleNumber }) {
  if (currentSlotState === 'EXPIRED') {
    return 'EXPIRED';
  }

  // CV pipeline indicates real occupancy; reservation still matters when sensor=false.
  if (sensorKnown && sensorParked) {
    return 'ARRIVED';
  }
  if (sensorKnown && !sensorParked && !hasActiveBooking) {
    return 'NOT_BOOKED';
  }
  
  // If user has checked in manually
  if (hasActiveBooking && checkInTime) {
    return 'ARRIVED';
  }
  
  // If there's an active booking
  if (hasActiveBooking) {
    return 'BOOKED';
  }
  
  return 'NOT_BOOKED';
}

module.exports = {
  SLOT_STATES,
  deriveSlotState
};
