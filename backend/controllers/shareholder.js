import mongoose from 'mongoose';
import Shareholder from '../models/Shareholder.js';
import ShareholderTransaction from '../models/ShareholderTransaction.js';
import DividendLedger from '../models/DividendLedger.js';
import DividendRate from '../models/DividendRate.js';
import FinancialYear from '../models/FinancialYear.js';

import {
	getEffectivePeriod,
	recalculateShareholderDividends,
} from '../utils/dividendHelpers.js';


export const createShareholder = async (req, res) => {
	const session = await mongoose.startSession();

	try {
		const { name, phone, email, address, openingBalance, description, date } =
			req.body;

		if (!name) {
			return res.status(400).json({
				success: false,
				message: 'Shareholder name is required',
			});
		}

		if (openingBalance === undefined || openingBalance < 0) {
			return res.status(400).json({
				success: false,
				message: 'Valid opening balance is required',
			});
		}

		session.startTransaction();

		const effective = getEffectivePeriod(date);

		const [shareholder] = await Shareholder.create(
			[
				{
					name,
					phone,
					email,
					address,
					joinDate: date,
				},
			],
			{ session },
		);

		await ShareholderTransaction.create(
			[
				{
					shareholder: shareholder._id,
					type: 'opening_balance',
					amount: openingBalance,
					description: description || 'Opening Balance',
					transactionDate: date,
					effectiveMonth: effective.month,
					effectiveYear: effective.year,
				},
			],
			{ session },
		);

		await FinancialYear.create(
			[
				{
					shareholderId: shareholder._id,
					year: effective.year,
					openingBalance,
					currentInvestment: openingBalance,
					status: 'active',
				},
			],
			{ session },
		);

		await session.commitTransaction();

		res.status(201).json({
			success: true,
			message: 'Shareholder created successfully',
			data: shareholder,
		});
	} catch (error) {
		await session.abortTransaction();

		console.error(error);

		res.status(500).json({
			success: false,
			message: error.message,
		});
	} finally {
		session.endSession();
	}
};

export const getShareholders = async (req, res) => {
	try {
		const shareholders = await FinancialYear.find().populate('shareholderId');
		// console.log(shareholders);
		const cleanShareholders = shareholders.map((shareholder) => {
			return {
				_id: shareholder?.shareholderId?._id,
				name: shareholder?.shareholderId?.name,
				phone: shareholder?.shareholderId?.phone,
				email: shareholder?.shareholderId?.email,
				address: shareholder?.shareholderId?.address,
				joinDate: shareholder?.shareholderId?.joinDate,
				shareholderId: shareholder?.shareholderId?._id,
				financialYearId: shareholder._id,
				openingBalance: shareholder.openingBalance,
				currentInvestment: shareholder.currentInvestment,
				year: shareholder.year,
				totalWithdrawal: shareholder.totalWithdrawal,
				totalDividendPaid: shareholder.totalDividendPaid,
				totalDividendEarned: shareholder.totalDividendEarned,
				closingBalance: shareholder.closingBalance,
				status: shareholder.status,
			};
		});
		res.status(200).json(cleanShareholders);
	} catch (error) {
		console.error(error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

export const updateShareholder = async (req, res) => {
	try {
		const { shareholderId } = req.params;

		const shareholder = await Shareholder.findByIdAndUpdate(
			shareholderId,
			{
				$set: req.body,
			},
			{
				new: true,
				runValidators: true,
			},
		);

		if (!shareholder) {
			return res.status(404).json({
				success: false,
				message: 'Shareholder not found',
			});
		}

		res.status(200).json({
			success: true,
			message: 'Shareholder updated successfully',
			data: shareholder,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

export const getShareholder = async (req, res) => {
	try {
		const { shareholderId } = req.params;

		const shareholder = await Shareholder.findById(shareholderId);

		if (!shareholder) {
			return res.status(404).json({
				success: false,
				message: 'Shareholder not found',
			});
		}

		const financialYear = await FinancialYear.findOne({
			shareholderId: shareholderId,
			status: 'active',
		});

		res.status(200).json({
			success: true,
			data: { shareholder, financials: financialYear },
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

export const startNewFinancialYear = async (req, res) => {
	const session = await mongoose.startSession();

	try {
		const {
			openingBalance,
			year,
			shareholderId,
			description = `Opening balance for ${year}`,
		} = req.body;

		console.log(' Date(${year}-01-01)', new Date(`${year}-01-01`));

		session.startTransaction();

		// Find shareholder
		const shareholder =
			await Shareholder.findById(shareholderId).session(session);

		if (!shareholder) {
			await session.abortTransaction();

			return res.status(404).json({
				success: false,
				message: 'Shareholder not found',
			});
		}

		// Check if financial year already exists
		const existingYear = await FinancialYear.findOne({
			shareholderId,
			year,
		}).session(session);

		if (existingYear) {
			await session.abortTransaction();

			return res.status(400).json({
				success: false,
				message: `Financial year ${year} already exists for this shareholder`,
			});
		}

		const effective = getEffectivePeriod(`${year}-01-01` || new Date());

		const [newFinancialYear] = await FinancialYear.create(
			[
				{
					shareholderId,
					year,
					openingBalance: Number(openingBalance),
					currentInvestment: Number(openingBalance),
				},
			],
			{ session },
		);

		await ShareholderTransaction.create(
			[
				{
					shareholder: shareholderId,
					type: 'opening_balance',
					amount: Number(openingBalance),
					description,
					transactionDate: new Date(`${year}-01-01`),
					effectiveMonth: effective.month,
					effectiveYear: effective.year,
				},
			],
			{ session },
		);

		await session.commitTransaction();

		return res.status(201).json({
			success: true,
			data: newFinancialYear,
		});
	} catch (error) {
		await session.abortTransaction();

		return res.status(500).json({
			success: false,
			message: error.message,
		});
	} finally {
		await session.endSession();
	}
};
export const addInvestment = async (req, res) => {
	const session = await mongoose.startSession();

	try {
		const { shareholderId } = req.params;
		const { amount, date, description } = req.body;

		const investmentAmount = Number(amount);

		if (!investmentAmount || investmentAmount <= 0) {
			return res.status(400).json({
				success: false,
				message: 'Invalid investment amount',
			});
		}

		const effective = getEffectivePeriod(date);

		let dividendSummary;

		await session.withTransaction(async () => {
			const shareholder =
				await Shareholder.findById(shareholderId).session(session);

			if (!shareholder) {
				throw new Error('Shareholder not found');
			}

			const [transaction] = await ShareholderTransaction.create(
				[
					{
						shareholder: shareholderId,
						type: 'deposit',
						amount: investmentAmount,
						description,
						transactionDate: date,
						effectiveMonth: effective.month,
						effectiveYear: effective.year,
					},
				],
				{ session },
			);

			// Keep FinancialYear.currentInvestment in sync
			await FinancialYear.updateOne(
				{ shareholderId, year: effective.year },
				{ $inc: { currentInvestment: investmentAmount } },
				{ session },
			);

			// Recalculate dividends for this shareholder's year
			dividendSummary = await recalculateShareholderDividends(
				shareholderId,
				effective.year,
				session,
			);

			res.status(201).json({
				success: true,
				message: 'Investment added and dividends recalculated',
				data: transaction,
				dividends: dividendSummary,
			});
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	} finally {
		await session.endSession();
	}
};

export const withdrawInvestment = async (req, res) => {
	const session = await mongoose.startSession();

	try {
		const { shareholderId } = req.params;
		const { amount, date, description } = req.body;

		const withdrawalAmount = Number(amount);

		if (!withdrawalAmount || withdrawalAmount <= 0) {
			return res.status(400).json({
				success: false,
				message: 'Invalid withdrawal amount',
			});
		}

		const effective = getEffectivePeriod(date);

		let dividendSummary;

		await session.withTransaction(async () => {
			// Atomic balance check + decrement on FinancialYear
			const financialYear = await FinancialYear.findOneAndUpdate(
				{
					shareholderId,
					year: effective.year,
					status: 'active',
					currentInvestment: { $gte: withdrawalAmount },
				},
				{ $inc: { currentInvestment: -withdrawalAmount } },
				{ new: true, session },
			);

			if (!financialYear) {
				throw new Error(
					'Insufficient investment balance or no active financial year found',
				);
			}

			const [transaction] = await ShareholderTransaction.create(
				[
					{
						shareholder: shareholderId,
						type: 'withdrawal',
						amount: withdrawalAmount,
						description,
						transactionDate: date,
						effectiveMonth: effective.month,
						effectiveYear: effective.year,
					},
				],
				{ session },
			);

			// Recalculate dividends for this shareholder's year
			dividendSummary = await recalculateShareholderDividends(
				shareholderId,
				effective.year,
				session,
			);

			res.status(201).json({
				success: true,
				message: 'Withdrawal processed and dividends recalculated',
				currentInvestment: financialYear.currentInvestment,
				data: transaction,
				dividends: dividendSummary,
			});
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	} finally {
		await session.endSession();
	}
};

export const createDividendRate = async (req, res) => {
	try {
		const { month, year, percentage, description } = req.body;

		const rate = await DividendRate.findOneAndUpdate(
			{ month, year },
			{
				month,
				year,
				percentage,
				description,
			},
			{
				new: true,
				upsert: true,
			},
		);

		res.json({
			success: true,
			data: rate,
		});
	} catch (error) {
		coonsole.log(error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

export const updateDividendRate = async (req, res) => {
	const session = await mongoose.startSession();

	try {
		const { year, dividend } = req.body;

		if (!year || !Array.isArray(dividend) || dividend.length === 0) {
			return res.status(400).json({
				success: false,
				message: 'Year and a non-empty dividend array are required.',
			});
		}

		// Validate every entry up-front before touching the DB
		const invalid = dividend.find((d) => !d.month || d.percentage == null);
		if (invalid) {
			return res.status(400).json({
				success: false,
				message: 'Each dividend entry must have a month and percentage.',
			});
		}

		const numYear = Number(year);

		await session.withTransaction(async () => {
			// ── 1. Bulk-upsert the new rates ──────────────────────────────────
			const rateOps = dividend.map(({ month, percentage, description }) => ({
				updateOne: {
					filter: { year: numYear, month: Number(month) },
					update: {
						$set: {
							percentage: Number(percentage),
							...(description !== undefined && { description }),
							// allow re-processing after a rate change
							status: 'pending',
							processedAt: null,
						},
					},
					upsert: true,
				},
			}));

			await DividendRate.bulkWrite(rateOps, { session });

			// ── 2. Load the now-current rates for this year ───────────────────
			const rates = await DividendRate.find({ year: numYear })
				.sort({ month: 1 })
				.session(session);

			// ── 3. Load all active shareholders for this financial year ───────
			const financialYears = await FinancialYear.find({
				year: numYear,
				status: 'active',
			}).session(session);

			if (!financialYears.length) {
				// No shareholders → just return the updated rates
				return res.json({
					success: true,
					message: 'Rates updated. No active shareholders found for this year.',
					data: rates,
				});
			}

			const shareholderIds = financialYears.map((fy) => fy.shareholderId);

			// ── 4. Compute net investment per shareholder per month ───────────
			// We need all transactions ≤ each month, grouped by shareholder.
			// Do one aggregate pass for all months at once: group by
			// (shareholder, effectiveMonth) so we can roll it up per month later.

			const txAgg = await ShareholderTransaction.aggregate([
				{
					$match: {
						shareholder: { $in: shareholderIds },
						$or: [
							{ effectiveYear: { $lt: numYear } },
							{ effectiveYear: numYear },
						],
					},
				},
				{
					$group: {
						_id: {
							shareholder: '$shareholder',
							effectiveYear: '$effectiveYear',
							effectiveMonth: '$effectiveMonth',
						},
						deposits: {
							$sum: {
								$cond: [
									{ $in: ['$type', ['opening_balance', 'topup', 'deposit']] },
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

			// console.log('txAgg', txAgg);
			// Build a cumulative investment map:
			// runningBalance[shareholderId.toString()][month] = net investment at end of that month
			const runningBalance = {};

			for (const sh of shareholderIds) {
				runningBalance[sh.toString()] = {};
			}

			// console.log('runningBalance', runningBalance);
			// Group by shareholder, sort chronologically, accumulate
			const byShareHolder = {};
			for (const entry of txAgg) {
				const sid = entry._id.shareholder.toString();
				if (!byShareHolder[sid]) byShareHolder[sid] = [];
				byShareHolder[sid].push(entry);
			}
			// console.log('byShareHolder', byShareHolder);
			// For every rate month, compute each shareholder's balance up to that month
			const rateMonths = rates.map((r) => r.month);

			// investment snapshot[sid][month] = cumulative net investment up to that month
			const investmentAt = {};

			for (const sid of Object.keys(runningBalance)) {
				const entries = byShareHolder[sid] || [];
				let cumulative = 0;
				let entryIdx = 0;
				investmentAt[sid] = {};

				// Walk months 1..12 tracking running balance
				for (let m = 1; m <= 12; m++) {
					// Add all entries whose (year < numYear) or (year === numYear && month <= m)
					while (entryIdx < entries.length) {
						const e = entries[entryIdx];
						const ey = e._id.effectiveYear;
						const em = e._id.effectiveMonth;
						if (ey < numYear || (ey === numYear && em <= m)) {
							cumulative += e.deposits - e.withdrawals;
							entryIdx++;
						} else {
							break;
						}
					}
					investmentAt[sid][m] = cumulative > 0 ? cumulative : 0;
				}
			}

			// console.log('investmentAt', investmentAt);

			// ── 5. Upsert DividendLedger entries for every (shareholder × month) ──
			const ledgerOps = [];
			let totalDividend = 0;
			let totalEntries = 0;

			// Map financialYearId by shareholderId for quick lookup
			const fyByShareholderId = {};
			for (const fy of financialYears) {
				fyByShareholderId[fy.shareholderId.toString()] = fy;
			}

			for (const rate of rates) {
				for (const fy of financialYears) {
					const sid = fy.shareholderId.toString();
					const investment = investmentAt[sid]?.[rate.month] ?? 0;

					if (investment <= 0) continue;

					const dividendAmount = Number(
						((investment * rate.percentage) / 100).toFixed(2),
					);

					totalDividend += dividendAmount;
					totalEntries++;

					ledgerOps.push({
						updateOne: {
							filter: {
								shareholder: fy.shareholderId,
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
									financialYearId: fy._id,
									cumulativeDividend: 0,
								},
							},
							upsert: true,
						},
					});
				}
			}

			// console.log('ledgerOps', ledgerOps);
			if (ledgerOps.length) {
				await DividendLedger.bulkWrite(ledgerOps, { session });
			}

			// ── 6. Recompute cumulativeDividend and FinancialYear totals ────────
			for (const fy of financialYears) {
				const sid = fy.shareholderId;

				// Fetch all ledger entries for this shareholder-year sorted by month
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

				// Update the FinancialYear summary
				const totalDividendEarned = Number(running.toFixed(2));
				await FinancialYear.updateOne(
					{ _id: fy._id },
					{ $set: { totalDividendEarned } },
					{ session },
				);
			}

			// ── 7. Mark rates as completed ───────────────────────────────────
			await DividendRate.updateMany(
				{ year: numYear, month: { $in: rateMonths } },
				{ $set: { status: 'completed', processedAt: new Date() } },
				{ session },
			);

			const updatedRates = await DividendRate.find({ year: numYear })
				.sort({ month: 1 })
				.session(session);

			res.json({
				success: true,
				message: 'Dividend rates updated and recalculated successfully.',
				data: updatedRates,
				summary: {
					year: numYear,
					totalShareholders: financialYears.length,
					totalEntries,
					totalDividend: Number(totalDividend.toFixed(2)),
				},
			});
		});
	} catch (error) {
		console.error('updateDividendRate error:', error);

		res.status(500).json({
			success: false,
			message: error.message,
		});
	} finally {
		await session.endSession();
	}
};

export const getDividendRates = async (req, res) => {
	try {
		const { year, month } = req.query;

		const query = {};

		if (year) {
			query.year = Number(year);
		}
		if (month) {
			query.month = Number(month);
		}

		const rates = await DividendRate.find(query).sort({
			year: -1,
			month: 1,
		});

		res.status(200).json({
			success: true,
			count: rates.length,
			data: rates,
		});
	} catch (error) {
		console.log(error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

export const getDividends = async (req, res) => {
	try {
		const { year, month } = req.query;

		const query = {};

		if (year) {
			query.year = Number(year);
		}

		if (month) {
			query.month = Number(month);
		}

		// Dividend Payments
		const dividends = await DividendLedger.find(query)
			.populate('shareholder', 'name phone email')
			.sort({
				year: -1,
				month: 1,
				createdAt: -1,
			})
			.lean();

		const summaryAgg = await DividendLedger.aggregate([
			{
				$match: query,
			},
			{
				$group: {
					_id: null,

					totalDividendPaid: {
						$sum: '$dividendAmount',
					},

					totalInvestmentBase: {
						$sum: '$investmentAmount',
					},

					totalRecords: {
						$sum: 1,
					},

					shareholders: {
						$addToSet: '$shareholder',
					},
				},
			},
		]);

		const summary =
			summaryAgg.length > 0
				? {
						totalDividendPaid: summaryAgg[0].totalDividendPaid,
						totalInvestmentBase: summaryAgg[0].totalInvestmentBase,
						totalRecords: summaryAgg[0].totalRecords,
						shareholdersPaid: summaryAgg[0].shareholders.length,
					}
				: {
						totalDividendPaid: 0,
						totalInvestmentBase: 0,
						totalRecords: 0,
						shareholdersPaid: 0,
					};

		res.status(200).json({
			success: true,
			count: dividends.length,
			dividends,
			summary,
			filters: {
				year: year || 'all',
				month: month || 'all',
			},
		});
	} catch (error) {
		coonsole.log(error);
		res.status(500).json({
			success: false,
			message: error.message || 'Failed to fetch dividends',
		});
	}
};

export const DividendCalculation = async (req, res) => {
	const session = await mongoose.startSession();

	try {
		const { month, year } = req.body;

		if (!month || !year) {
			return res.status(400).json({
				success: false,
				message: 'Month and year are required',
			});
		}

		session.startTransaction();

		// Find dividend rate
		const dividendRate = await DividendRate.findOne({
			month,
			year,
		}).session(session);

		if (!dividendRate) {
			throw new Error(`Dividend rate not found for ${month}/${year}`);
		}

		if (dividendRate.status === 'completed') {
			throw new Error(`Dividend already processed for ${month}/${year}`);
		}

		// Mark processing
		dividendRate.status = 'processing';
		await dividendRate.save({ session });

		// Get all active shareholders for the year
		const financialYears = await FinancialYear.find({
			year,
			status: 'active',
		}).session(session);

		let totalDividend = 0;
		let processedCount = 0;

		for (const financialYear of financialYears) {
			// Prevent duplicates
			const existingLedger = await DividendLedger.findOne({
				shareholderYearId: shareholderYear._id,
				month,
				year,
			}).session(session);

			if (existingLedger) {
				continue;
			}

			const capital =
				financialYear.currentInvestment ||
				financialYear.closingBalance ||
				financialYear.openingBalance;

			const dividendAmount = (capital * dividendRate.percentage) / 100;

			await DividendLedger.create(
				[
					{
						shareholderId: financialYear.shareholderId,

						financialYearId: financialYear._id,

						year,
						month,

						rate: dividendRate.percentage,

						eligibleCapital: capital,

						dividendAmount,

						paidAmount: 0,

						balance: dividendAmount,

						status: 'pending',
					},
				],
				{ session },
			);

			// Update yearly totals
			financialYear.totalDividendEarned += dividendAmount;

			await financialYear.save({
				session,
			});

			totalDividend += dividendAmount;
			processedCount++;
		}

		dividendRate.status = 'completed';
		dividendRate.processedAt = new Date();

		await dividendRate.save({
			session,
		});

		await session.commitTransaction();

		return res.status(200).json({
			success: true,
			message: 'Dividend calculated successfully',
			data: {
				month,
				year,
				rate: dividendRate.percentage,
				shareholdersProcessed: processedCount,
				totalDividend,
			},
		});
	} catch (error) {
		await session.abortTransaction();

		return res.status(500).json({
			success: false,
			message: error.message,
		});
	} finally {
		session.endSession();
	}
};

export const shareholderMonthlyDividend = async (req, res) => {
	const session = await mongoose.startSession();

	try {
		const { shareholderId, month, year } = req.body;

		if (!shareholderId || !month || !year) {
			return res.status(400).json({
				success: false,
				message: 'Shareholder, month and year are required',
			});
		}

		await session.withTransaction(async () => {
			/**
			 * Shareholder
			 */
			const shareholder =
				await Shareholder.findById(shareholderId).session(session);

			if (!shareholder) {
				throw new Error('Shareholder not found');
			}

			/**
			 * Dividend Rate
			 */
			const rate = await DividendRate.findOne({
				month: Number(month),
				year: Number(year),
			}).session(session);

			if (!rate) {
				throw new Error('Dividend rate not found');
			}

			// Get  active shareholder for the year
			const financialYear = await FinancialYear.findOne({
				shareholderId,
				year,
				status: 'active',
			}).session(session);

			if (!financialYear) {
				throw new Error('Shareholder not found for this year');
			}
			/**
			 * Prevent duplicate processing
			 */
			const existingDividend = await DividendLedger.findOne({
				shareholder: shareholderId,
				month: Number(month),
				year: Number(year),
			}).session(session);

			if (existingDividend) {
				throw new Error('Dividend already processed for this shareholder');
			}

			/**
			 * Calculate net investment
			 */
			const balances = await ShareholderTransaction.aggregate([
				{
					$match: {
						shareholder: new mongoose.Types.ObjectId(shareholderId),

						$or: [
							{
								effectiveYear: {
									$lt: Number(year),
								},
							},
							{
								effectiveYear: Number(year),

								effectiveMonth: {
									$lte: Number(month),
								},
							},
						],
					},
				},

				{
					$group: {
						_id: null,

						deposits: {
							$sum: {
								$cond: [
									{
										$in: ['$type', ['opening_balance', 'deposit']],
									},
									'$amount',
									0,
								],
							},
						},

						withdrawals: {
							$sum: {
								$cond: [
									{
										$eq: ['$type', 'withdrawal'],
									},
									'$amount',
									0,
								],
							},
						},
					},
				},
			]).session(session);

			const deposits = balances[0]?.deposits || 0;

			const withdrawals = balances[0]?.withdrawals || 0;

			const investment = deposits - withdrawals;

			if (investment <= 0) {
				throw new Error(
					'No eligible investment found for dividend calculation',
				);
			}

			/**
			 * Calculate dividend
			 */
			const dividendAmount = (investment * rate.percentage) / 100;

			/**
			 * Previous dividends
			 */
			const previousDividend = await DividendLedger.aggregate([
				{
					$match: {
						shareholder: new mongoose.Types.ObjectId(shareholderId),
					},
				},
				{
					$group: {
						_id: null,

						total: {
							$sum: '$dividendAmount',
						},
					},
				},
			]).session(session);

			const cumulativeDividend =
				(previousDividend[0]?.total || 0) + dividendAmount;

			/**
			 * Create ledger
			 */
			const ledger = await DividendLedger.create(
				[
					{
						shareholder: shareholderId,

						financialYearId: financialYear._id,

						month: Number(month),

						year: Number(year),

						percentage: rate.percentage,

						investmentAmount: investment,

						dividendAmount: Number(dividendAmount.toFixed(2)),

						cumulativeDividend: Number(cumulativeDividend.toFixed(2)),

						description: `${month}/${year} Dividend`,
					},
				],
				{
					session,
				},
			);

			/**
			 * Update shareholder summary
			 */
			await Shareholder.updateOne(
				{
					_id: shareholderId,
				},
				{
					$inc: {
						totalDividends: Number(dividendAmount.toFixed(2)),
					},
				},
				{
					session,
				},
			);

			res.status(201).json({
				success: true,

				message: 'Dividend processed successfully',

				shareholder: shareholder.name,

				investment,

				percentage: rate.percentage,

				dividendAmount: Number(dividendAmount.toFixed(2)),

				cumulativeDividend: Number(cumulativeDividend.toFixed(2)),

				data: ledger[0],
			});
		});
	} catch (error) {
		console.error(error);

		res.status(500).json({
			success: false,
			message: error.message,
		});
	} finally {
		await session.endSession();
	}
};

export const getShareholderStatement = async (req, res) => {
	try {
		const { shareholderId } = req.params;

		const shareholder = await Shareholder.findById(shareholderId);

		const transactions = await ShareholderTransaction.find({
			shareholder: shareholderId,
		}).sort({ transactionDate: 1 });

		const dividends = await DividendLedger.find({
			shareholder: shareholderId,
		}).sort({
			year: 1,
			month: 1,
		});

		const totalDeposit = transactions
			.filter((t) => t.type === 'deposit')
			.reduce((a, b) => a + b.amount, 0);

		const totalWithdrawal = transactions
			.filter((t) => t.type === 'withdrawal')
			.reduce((a, b) => a + b.amount, 0);

		const investment = totalDeposit - totalWithdrawal;

		const totalDividend = dividends.reduce((a, b) => a + b.dividendAmount, 0);

		const closingBalance = investment + totalDividend;

		const data = {
			shareholder,
			investment,
			totalDividend,
			closingBalance,
			transactions,
			dividends,
		};
		res.json(data);
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

export const deleteShareholder = async (req, res) => {
	const session = await Shareholder.startSession(); // assuming Mongoose
	session.startTransaction();

	try {
		const { shareholderId, year } = req.params;

		// 1. Validate ObjectId format
		if (!mongoose.Types.ObjectId.isValid(shareholderId)) {
			return res.status(400).json({
				success: false,
				message: 'Invalid shareholder ID format',
			});
		}

		// 2. Authorization (example – adjust to your auth logic)
		if (!req.user || !req.user.canDelete('shareholder')) {
			return res.status(403).json({ success: false, message: 'Forbidden' });
		}

		// 3. Find and delete the shareholder atomically
		const deletedShareholder = await Shareholder.findByIdAndDelete(
			shareholderId,
			{ session },
		);

		if (!deletedShareholder) {
			await session.abortTransaction();
			return res.status(404).json({
				success: false,
				message: 'Shareholder not found',
			});
		}

		// 4. Cascade delete all related records
		await ShareholderTransaction.deleteMany(
			{ shareholder: shareholderId, year },
			{ session },
		);
		await DividendLedger.deleteMany(
			{ shareholder: shareholderId, year },
			{ session },
		);
		await FinancialYear.deleteMany(
			{ shareholderId: shareholderId, year: year },
			{ session },
		);

		// 5. Commit transaction
		await session.commitTransaction();
		session.endSession();

		res.status(200).json({
			success: true,
			message: 'Shareholder deleted successfully',
		});
	} catch (error) {
		// Rollback transaction on error
		await session.abortTransaction();
		session.endSession();

		// Log the error for debugging (use your logger)
		console.error('Delete shareholder error:', error);

		// Send a generic error to the client
		res.status(500).json({
			success: false,
			message: 'An error occurred while deleting the shareholder',
		});
	}
};
