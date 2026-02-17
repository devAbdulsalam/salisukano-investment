import express from 'express';
import {
	createWaybill,
	getWaybill,
	getWaybills,
	updateWaybill,
	deleteWaybill,
} from '../controllers/waybillregister.js';

const router = express.Router();

router.post('/', createWaybill);
router.get('/', getWaybills);
router.get('/:id', getWaybill);
router.put('/:id', updateWaybill);
router.delete('/:id', deleteWaybill);

export default router;
