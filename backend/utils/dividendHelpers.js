import mongoose from 'mongoose';
import DividendRate from '../models/DividendRate.js';
import DividendLedger from '../models/DividendLedger.js';
import FinancialYear from '../models/FinancialYear.js';
import ShareholderTransaction from '../models/ShareholderTransaction.js';

/**
 * Recalculate all dividend ledger entries for a single shareholder
 * within a given financial year, based on current rates and transactions.
 *
 * Must be called inside an existing Mongoose session/transaction.
 *
 * @param {mongoose.Types.ObjectId|string} shareholderId
 * @param {number} year
 * @param {mongoose.ClientSession} session
 * @returns {{ totalDividendEarned: number, updatedMonths: number }}
 */
export const recalculateShareholderDividends = async (
	shareholderId,
	year,
	session,
) => {
	const numYear = Number(year);
	const sid = new mongoose.Types.ObjectId(shareholderId);

	// 1. Load the FinancialYear record
	const financialYear = await FinancialYear.findOne({
		shareholderId: sid,
		year: numYear,
		status: 'active',
	}).session(session);

	if (!financialYear) {
		// Nothing to recalculate – shareholder has no active year
		return { totalDividendEarned: 0, updatedMonths: 0 };
	}

	// 2. Load all rates for the year that have already been processed
	const rates = await DividendRate.find({
		year: numYear,
		status: 'completed',
	})
		.sort({ month: 1 })
		.session(session);

	if (!rates.length) {
		return { totalDividendEarned: 0, updatedMonths: 0 };
	}

	// 3. Fetch all transactions for this shareholder up to and including this year
	const txAgg = await ShareholderTransaction.aggregate([
		{
			$match: {
				shareholder: sid,
				$or: [
					{ effectiveYear: { $lt: numYear } },
					{ effectiveYear: numYear },
				],
			},
		},
		{
			$group: {
				_id: {
					effectiveYear: '$effectiveYear',
					effectiveMonth: '$effectiveMonth',
				},
				deposits: {
					$sum: {
						$cond: [
							{ $in: ['$type', ['opening_balance', 'deposit']] },
							'$amount',
							0,
						],
					},
				},
				withdrawals: {
					$sum: {
						$cond: [{ $eq: ['$type', 'withdrawal'] }, '$amount', 0],
					},
				},
			},
		},
		{ $sort: { '_id.effectiveYear': 1, '_id.effectiveMonth': 1 } },
	]).session(session);

	// 4. Build a month-by-month cumulative balance map for months 1..12
	let cumulative = 0;
	let txIdx = 0;
	const investmentAt = {}; // month -> net investment at end of that month

	for (let m = 1; m <= 12; m++) {
		while (txIdx < txAgg.length) {
			const e = txAgg[txIdx];
			const ey = e._id.effectiveYear;
			const em = e._id.effectiveMonth;
			if (ey < numYear || (ey === numYear && em <= m)) {
				cumulative += e.deposits - e.withdrawals;
				txIdx++;
			} else {
				break;
			}
		}
		investmentAt[m] = cumulative > 0 ? cumulative : 0;
	}

	// 5. Upsert a ledger entry for each processed rate month
	const ledgerOps = [];

	for (const rate of rates) {
		const investment = investmentAt[rate.month] ?? 0;

		if (investment <= 0) {
			// Remove any stale entry if investment dropped to zero
			ledgerOps.push({
				deleteOne: {
					filter: {
						shareholder: sid,
						year: numYear,
						month: rate.month,
					},
				},
			});
			continue;
		}

		const dividendAmount = Number(
			((investment * rate.percentage) / 100).toFixed(2),
		);

		ledgerOps.push({
			updateOne: {
				filter: {
					shareholder: sid,
					year: numYear,
					month: rate.month,
				},
				update: {
					$set: {
						percentage: rate.percentage,
						investmentAmount: investment,
						dividendAmount,
						description: `${rate.month}/${numYear} Dividend`,
					},
					$setOnInsert: {
						financialYearId: financialYear._id,
						cumulativeDividend: 0,
					},
				},
				upsert: true,
			},
		});
	}

	if (ledgerOps.length) {
		await DividendLedger.bulkWrite(ledgerOps, { session });
	}

	// 6. Recompute cumulativeDividend in month order
	const ledgerEntries = await DividendLedger.find({
		shareholder: sid,
		year: numYear,
	})
		.sort({ month: 1 })
		.session(session);

	let running = 0;
	const cumulativeOps = [];

	for (const entry of ledgerEntries) {
		running += entry.dividendAmount;
		cumulativeOps.push({
			updateOne: {
				filter: { _id: entry._id },
				update: {
					$set: { cumulativeDividend: Number(running.toFixed(2)) },
				},
			},
		});
	}

	if (cumulativeOps.length) {
		await DividendLedger.bulkWrite(cumulativeOps, { session });
	}

	// 7. Sync FinancialYear.totalDividendEarned
	const totalDividendEarned = Number(running.toFixed(2));
	await FinancialYear.updateOne(
		{ _id: financialYear._id },
		{ $set: { totalDividendEarned } },
		{ session },
	);

	return { totalDividendEarned, updatedMonths: ledgerEntries.length };
};

export const getEffectivePeriod = (date) => {
	const d = new Date(date);

	let month = d.getMonth() + 1;
	let year = d.getFullYear();

	if (d.getDate() >= 15) {
		month++;

		if (month > 12) {
			month = 1;
			year++;
		}
	}

	return { month, year };
};

export const getMonthName = (month) => {
	return [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December',
	][month - 1];
};
