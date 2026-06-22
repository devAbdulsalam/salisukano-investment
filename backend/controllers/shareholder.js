import mongoose from 'mongoose';
import Shareholder from '../models/Shareholder.js';
import ShareholderTransaction from '../models/ShareholderTransaction.js';
import DividendLedger from '../models/DividendLedger.js';
import DividendRate from '../models/DividendRate.js';
import FinancialYear from '../models/FinancialYear.js';

import { getEffectivePeriod } from '../utils/dividendHelpers.js';

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

		const effective = getEffectivePeriod(date || new Date());

		const [shareholder] = await Shareholder.create(
			[
				{
					name,
					phone,
					email,
					address,
					joinDate: new Date(),
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
					transactionDate: new Date(),
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
		const cleanShareholders = shareholders.map((shareholder) => {
			return {
				_id: shareholder.shareholderId._id,
				name: shareholder.shareholderId.name,
				phone: shareholder.shareholderId.phone,
				email: shareholder.shareholderId.email,
				address: shareholder.shareholderId.address,
				joinDate: shareholder.shareholderId.joinDate,
				shareholderId: shareholder.shareholderId._id,
				openingBalance: shareholder.openingBalance,
				currentInvestment: shareholder.currentInvestment,
				year: shareholder.year,
				totalWithdrawal: shareholder.totalWithdrawal,
				totalDividendPaid: shareholder.totalDividend,
				totalDividendEarned: shareholder.totalDividend,
				closingBalance: shareholder.closingBalance,
				status: shareholder.status,
			};
		});
		res.status(200).json(cleanShareholders);
	} catch (error) {
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

		await session.withTransaction(async () => {
			const shareholder =
				await Shareholder.findById(shareholderId).session(session);

			if (!shareholder) {
				throw new Error('Shareholder not found');
			}

			const transaction = await ShareholderTransaction.create(
				[
					{
						shareholder: shareholderId,
						type: 'topup',
						amount: investmentAmount,
						description,
						transactionDate: date,
						effectiveMonth: effective.month,
						effectiveYear: effective.year,
					},
				],
				{ session },
			);

			await Shareholder.updateOne(
				{
					_id: shareholderId,
				},
				{
					$inc: {
						currentInvestment: investmentAmount,
					},
				},
				{
					session,
				},
			);

			res.status(201).json({
				success: true,
				message: 'Investment added successfully',
				data: transaction[0],
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

		await session.withTransaction(async () => {
			/**
			 * Atomic balance check
			 */
			const shareholder = await Shareholder.findOneAndUpdate(
				{
					_id: shareholderId,

					currentInvestment: {
						$gte: withdrawalAmount,
					},
				},
				{
					$inc: {
						currentInvestment: -withdrawalAmount,
					},
				},
				{
					new: true,
					session,
				},
			);

			if (!shareholder) {
				throw new Error('Insufficient investment or shareholder not found');
			}

			const transaction = await ShareholderTransaction.create(
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
				{
					session,
				},
			);

			res.status(201).json({
				success: true,

				message: 'Withdrawal processed successfully',

				currentInvestment: shareholder.currentInvestment,

				data: transaction[0],
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
				// status: 'completed',
				// processedAt: new Date(),
				// status: 'pending',
				// processedAt: null,
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

export const calculateMonthlyDividend = async (req, res) => {
	const session = await mongoose.startSession();

	try {
		const { month, year } = req.body;

		if (!month || !year) {
			return res.status(400).json({
				success: false,
				message: 'Month and year are required',
			});
		}

		await session.withTransaction(async () => {
			/**
			 * Lock dividend processing
			 */
			const rate = await DividendRate.findOneAndUpdate(
				{
					month: Number(month),
					year: Number(year),
					status: 'pending',
				},
				{
					$set: {
						status: 'processing',
					},
				},
				{
					new: true,
					session,
				},
			);

			if (!rate) {
				throw new Error(
					'Dividend already processed, processing, or rate not found',
				);
			}

			/**
			 * Aggregate all shareholder investments
			 */
			const investments = await ShareholderTransaction.aggregate([
				{
					$match: {
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
						_id: '$shareholder',

						deposits: {
							$sum: {
								$cond: [
									{
										$in: ['$type', ['opening_balance', 'topup']],
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

			/**
			 * Previous dividends
			 */
			const previousDividends = await DividendLedger.aggregate([
				{
					$group: {
						_id: '$shareholder',

						total: {
							$sum: '$dividendAmount',
						},
					},
				},
			]).session(session);

			const dividendMap = new Map(
				previousDividends.map((item) => [String(item._id), item.total]),
			);

			/**
			 * Generate dividend records
			 */
			const ledgerEntries = investments
				.filter((item) => item.deposits - item.withdrawals > 0)
				.map((item) => {
					const investment = item.deposits - item.withdrawals;

					const dividend = (investment * rate.percentage) / 100;

					const previousTotal = dividendMap.get(String(item._id)) || 0;

					return {
						shareholder: item._id,

						month: Number(month),

						year: Number(year),

						percentage: rate.percentage,

						investmentAmount: investment,

						dividendAmount: Number(dividend.toFixed(2)),

						cumulativeDividend: Number((previousTotal + dividend).toFixed(2)),

						description: `${month}/${year} Dividend`,
					};
				});

			/**
			 * Insert dividends
			 */
			if (ledgerEntries.length > 0) {
				await DividendLedger.insertMany(ledgerEntries, {
					session,
					ordered: false,
				});
			}

			/**
			 * Complete processing
			 */
			await DividendRate.updateOne(
				{
					_id: rate._id,
				},
				{
					$set: {
						status: 'completed',

						processedAt: new Date(),
					},
				},
				{
					session,
				},
			);

			const totalDividend = ledgerEntries.reduce(
				(sum, item) => sum + item.dividendAmount,
				0,
			);

			res.status(200).json({
				success: true,
				message: 'Monthly dividend processed successfully',

				month,
				year,

				percentage: rate.percentage,

				totalShareholders: ledgerEntries.length,

				totalDividend: Number(totalDividend.toFixed(2)),
			});
		});
	} catch (error) {
		console.error('Dividend Processing Error:', error);

		// Reset stuck processing status
		await DividendRate.updateOne(
			{
				month: req.body.month,
				year: req.body.year,
				status: 'processing',
			},
			{
				$set: {
					status: 'pending',
				},
			},
		).catch(() => {});

		return res.status(500).json({
			success: false,
			message: error.message,
		});
	} finally {
		await session.endSession();
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
										$in: ['$type', ['opening_balance', 'topup']],
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
		const { shareholderId } = req.params;

		// 1. Validate ObjectId format
		if (!mongoose.Types.ObjectId.isValid(shareholderId)) {
			return res.status(400).json({
				success: false,
				message: 'Invalid shareholder ID format',
			});
		}

		// 2. Authorization (example – adjust to your auth logic)
		// if (!req.user || !req.user.canDelete('shareholder')) {
		//   return res.status(403).json({ success: false, message: 'Forbidden' });
		// }

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
			{ shareholder: shareholderId },
			{ session },
		);
		await DividendLedger.deleteMany(
			{ shareholder: shareholderId },
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
