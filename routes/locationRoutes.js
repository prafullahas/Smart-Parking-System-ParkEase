const express = require('express');
const router = express.Router();
const {
  getAllLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
  getNearbyLocations
} = require('../controllers/locationController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getAllLocations);
router.get('/nearby', getNearbyLocations);
router.get('/:id', getLocationById);

// Admin routes
router.post('/', protect, admin, createLocation);
router.put('/:id', protect, admin, updateLocation);
router.delete('/:id', protect, admin, deleteLocation);

module.exports = router;
