import express from 'express';
import {
	getAssetDashboard,
	getAssets,
	getAsset,
	createAsset,
	updateAsset,
	deleteAsset,
	addMaintenance,
	updateMaintenance,
	deleteMaintenance,
	addValuation,
	updateValuation,
	deleteValuation,
	sellAsset,
} from '../controllers/asset.js';
import { protect } from '../middleware/requireAuth.js';

const router = express.Router();

// Dashboard
router.get('/dashboard', getAssetDashboard);

// Core CRUD
router.get('/', getAssets);
router.get('/:id', getAsset);
router.post('/', protect, createAsset);
router.patch('/:id', protect, updateAsset);
router.delete('/:id', protect, deleteAsset);

// Maintenance sub-resource
router.post('/:id/maintenance', protect, addMaintenance);
router.patch('/:id/maintenance/:maintenanceId', protect, updateMaintenance);
router.delete('/:id/maintenance/:maintenanceId', protect, deleteMaintenance);

// Valuation sub-resource
router.post('/:id/valuation', protect, addValuation);
router.patch('/:id/valuation/:valuationId', protect, updateValuation);
router.delete('/:id/valuation/:valuationId', protect, deleteValuation);

// Sell action
router.post('/:id/sell', protect, sellAsset);

export default router;
