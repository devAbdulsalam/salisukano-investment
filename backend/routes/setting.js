import express from 'express';
import {
	getZakatRateHandler,
	updateZakatRate,
} from '../controllers/setting.js';

const router = express.Router();

router.route('/zakat-rate').get(getZakatRateHandler).put(updateZakatRate);

export default router;
