// routes/waybillRoutes.js
import express from 'express';
import { protect } from '../middleware/requireAuth.js';
import {
	createWaybill,
	getWaybills,
	getWaybill,
	updateWaybill,
	deleteWaybill,
} from '../controllers/waybill.js';

const router = express.Router();
// router.use(protect);
router.route('/').post(createWaybill).get(getWaybills);

router.route('/:id').get(getWaybill).put(updateWaybill).delete(deleteWaybill);

export default router;
