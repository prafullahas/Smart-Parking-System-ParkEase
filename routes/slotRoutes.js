const express = require('express');
const router = express.Router();
const {
  getSlotsByLocation,
  getAvailableSlots,
  getFloorsByLocation,
  getFloorDetails,
  getSlotById,
  createSlot,
  createBulkSlots,
  updateSlotStatus,
  updateSlot,
  deleteSlot
} = require('../controllers/slotController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.get('/location/:locationId', getSlotsByLocation);
router.get('/location/:locationId/available', getAvailableSlots);
router.get('/location/:locationId/floors', getFloorsByLocation);
router.get('/location/:locationId/floor/:floorName', getFloorDetails);
router.get('/:id', getSlotById);

// Protected routes (can be admin-only with additional middleware)
router.post('/', protect, createSlot);
router.post('/bulk', protect, createBulkSlots);
router.put('/:id/status', protect, updateSlotStatus);
router.put('/:id', protect, updateSlot);
router.delete('/:id', protect, deleteSlot);

module.exports = router;