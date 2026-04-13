/**
 * Parking slot lifecycle for API responses (derived from booking + sensor).
 * NOT_BOOKED → BOOKED → ARRIVED
 */
const SLOT_STATES = ['NOT_BOOKED', 'BOOKED', 'ARRIVED', 'EXPIRED'];

function deriveSlotState({ currentSlotState, hasActiveBooking, checkInTime, sensorParked, sensorVehicleNumber, bookedVehicleNumber }) {
  if (currentSlotState === 'EXPIRED') {
    return 'EXPIRED';
  }

  // If sensor shows car is parked and vehicle numbers match (or no booking vehicle specified)
  if (sensorParked && (!bookedVehicleNumber || sensorVehicleNumber === bookedVehicleNumber)) {
    return 'ARRIVED';
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
