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
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getAllLocations);
router.get('/nearby', getNearbyLocations);
router.get('/:id', getLocationById);

// Protected routes (can be admin-only with additional middleware)
router.post('/', protect, createLocation);
router.put('/:id', protect, updateLocation);
router.delete('/:id', protect, deleteLocation);

module.exports = router;
