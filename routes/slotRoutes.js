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
  deleteSlot,
  getAdminSlotsOverview
} = require('../controllers/slotController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.get('/location/:locationId', getSlotsByLocation);
router.get('/location/:locationId/available', getAvailableSlots);
router.get('/location/:locationId/floors', getFloorsByLocation);
router.get('/location/:locationId/floor/:floorName', getFloorDetails);
router.get('/:id', getSlotById);

// Admin routes
router.get('/admin/overview', protect, admin, getAdminSlotsOverview);

// Protected admin routes
router.post('/', protect, admin, createSlot);
router.post('/bulk', protect, admin, createBulkSlots);
router.put('/:id/status', protect, admin, updateSlotStatus);
router.put('/:id', protect, admin, updateSlot);
router.delete('/:id', protect, admin, deleteSlot);

module.exports = router;