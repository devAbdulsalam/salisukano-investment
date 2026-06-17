import express from 'express';

import {
	createShareholder,
	addInvestment,
	withdrawInvestment,
	createDividendRate,
	calculateMonthlyDividend,
	getShareholderStatement,
	getShareholders,
	updateShareholder,
	getDividendRates,
	getShareholder,
	deleteShareholder,
	getDividends,
} from '../controllers/shareholder.js';
import { protect, admin } from '../middleware/requireAuth.js';

const router = express.Router();

router.post('/', protect, admin, createShareholder);
router.patch('/', protect, admin, updateShareholder);

router.post('/:shareholderId/topup', protect, admin, addInvestment);

router.post('/:shareholderId/withdraw', protect, admin, withdrawInvestment);

router.post('/dividend-rate', protect, admin, createDividendRate);

router.post('/run-dividend', calculateMonthlyDividend);

router.get('/dividends', protect, admin, getDividends);
router.get('/dividend-rate', protect, admin, getDividendRates);
router.get('/', protect, admin, getShareholders);
router.get('/:shareholderId', getShareholder);
router.get('/:shareholderId/statement', getShareholderStatement);

router.delete('/:shareholderId', deleteShareholder);

export default router;
