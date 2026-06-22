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
	shareholderMonthlyDividend,
	startNewFinancialYear,
} from '../controllers/shareholder.js';

import { protect, admin } from '../middleware/requireAuth.js';

const router = express.Router();

router.post('/', protect, admin, createShareholder);

router.post('/new-financial-year', startNewFinancialYear);

router.post('/dividend-rate', protect, admin, createDividendRate);

router.post('/run-dividend', protect, admin, calculateMonthlyDividend);

router.post(
	'/run-dividend/:shareholderId',
	protect,
	admin,
	shareholderMonthlyDividend,
);

router.patch('/:shareholderId', protect, admin, updateShareholder);

router.post('/:shareholderId/topup', protect, admin, addInvestment);

router.post('/:shareholderId/withdraw', protect, admin, withdrawInvestment);

router.get('/dividends', protect, admin, getDividends);

router.get('/dividend-rate', protect, admin, getDividendRates);

router.get('/', protect, admin, getShareholders);

router.get('/:shareholderId', protect, admin, getShareholder);

router.get(
	'/:shareholderId/statement',
	protect,
	admin,
	getShareholderStatement,
);

router.delete('/:shareholderId', protect, admin, deleteShareholder);

export default router;
