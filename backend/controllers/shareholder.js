import mongoose from 'mongoose';
import Shareholder from '../models/Shareholder.js';
import ShareholderTransaction from '../models/ShareholderTransaction.js';
import DividendLedger from '../models/DividendLedger.js';
import DividendRate from '../models/DividendRate.js';

import { getEffectivePeriod } from '../utils/dividendHelpers.js';

export const createShareholder = async (req, res) => {
	try {
		const { name, phone, email, address, openingBalance, description, date } =
			req.body;

		const shareholder = await Shareholder.create({
			name,
			phone,
			email,
			address,
			openingBalance,
			currentInvestment: openingBalance,
		});

		const effective = getEffectivePeriod(date);

		await ShareholderTransaction.create({
			shareholder: shareholder._id,
			type: 'opening',
			amount: openingBalance,
			description: description || 'Opening Balance',
			transactionDate: date,
			effectiveMonth: effective.month,
			effectiveYear: effective.year,
		});

		res.status(201).json({
			success: true,
			data: shareholder,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

export const getShareholders = async (req, res) => {
	try {
		const {
			page = 1,
			limit = 20,
			search = '',
			sortBy = 'createdAt',
			order = 'desc',
		} = req.query;

		const query = {};

		if (search) {
			query.$or = [
				{ name: { $regex: search, $options: 'i' } },
				{ email: { $regex: search, $options: 'i' } },
				{ phone: { $regex: search, $options: 'i' } },
			];
		}

		const skip = (Number(page) - 1) * Number(limit);

		const [shareholders, total] = await Promise.all([
			Shareholder.find(query)
				.sort({ [sortBy]: order === 'asc' ? 1 : -1 })
				.skip(skip)
				.limit(Number(limit)),
			Shareholder.countDocuments(query),
		]);

		// res.status(200).json({
		// 	success: true,
		// 	total,
		// 	page: Number(page),
		// 	totalPages: Math.ceil(total / limit),
		// 	data: shareholders,
		// });
		res.status(200).json(shareholders);
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

		res.status(200).json({
			success: true,
			data: shareholder,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

export const addInvestment = async (req, res) => {
	try {
		const { shareholderId } = req.params;

		const { amount, date, description } = req.body;

		const effective = getEffectivePeriod(date);

		const transaction = await ShareholderTransaction.create({
			shareholder: shareholderId,
			type: 'topup',
			amount,
			description,
			transactionDate: date,
			effectiveMonth: effective.month,
			effectiveYear: effective.year,
		});

		res.status(201).json({
			success: true,
			data: transaction,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

export const withdrawInvestment = async (req, res) => {
	try {
		const { shareholderId } = req.params;

		const { amount, date, description } = req.body;

		const effective = getEffectivePeriod(date);

		const transaction = await ShareholderTransaction.create({
			shareholder: shareholderId,
			type: 'withdrawal',
			amount,
			description,
			transactionDate: date,
			effectiveMonth: effective.month,
			effectiveYear: effective.year,
		});

		res.status(201).json({
			success: true,
			data: transaction,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
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
				status: 'completed',
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
		coonsole.log(error);
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

	session.startTransaction();

	try {
		const { month, year } = req.body;

		// Lock dividend rate

		const rate = await DividendRate.findOne({
			month,
			year,
		}).session(session);

		if (!rate) {
			await session.abortTransaction();

			return res.status(404).json({
				success: false,
				message: 'Dividend rate not found',
			});
		}

		if (rate.status === 'completed') {
			await session.abortTransaction();

			return res.status(400).json({
				success: false,
				message: 'Dividend already processed',
			});
		}

		if (rate.status === 'processing') {
			await session.abortTransaction();

			return res.status(400).json({
				success: false,
				message: 'Dividend currently processing',
			});
		}

		rate.status = 'processing';

		await rate.save({
			session,
		});

		// Fetch shareholders once

		const shareholders = await Shareholder.find({}, '_id name')
			.lean()
			.session(session);

		const ledgerEntries = [];

		for (const shareholder of shareholders) {
			// Net Investment

			const transactionAgg = await ShareholderTransaction.aggregate([
				{
					$match: {
						shareholder: shareholder._id,

						$or: [
							{
								effectiveYear: {
									$lt: year,
								},
							},
							{
								effectiveYear: year,
								effectiveMonth: {
									$lte: month,
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
										$eq: ['$type', 'deposit'],
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

			const deposits = transactionAgg[0]?.deposits || 0;

			const withdrawals = transactionAgg[0]?.withdrawals || 0;

			const investment = deposits - withdrawals;

			if (investment <= 0) continue;

			const dividend = (investment * rate.percentage) / 100;

			const previousDividend = await DividendLedger.aggregate([
				{
					$match: {
						shareholder: shareholder._id,
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

			const cumulative = (previousDividend[0]?.total || 0) + dividend;

			ledgerEntries.push({
				shareholder: shareholder._id,

				month,
				year,

				percentage: rate.percentage,

				investmentAmount: investment,

				dividendAmount: dividend,

				cumulativeDividend: cumulative,

				description: `${month}/${year} Dividend`,
			});
		}

		if (ledgerEntries.length > 0) {
			await DividendLedger.insertMany(ledgerEntries, {
				session,
				ordered: true,
			});
		}

		rate.status = 'completed';

		rate.processedAt = new Date();

		await rate.save({
			session,
		});

		await session.commitTransaction();

		res.status(200).json({
			success: true,
			message: 'Monthly dividend processed successfully',
			totalProcessed: ledgerEntries.length,
			totalDividend: ledgerEntries.reduce(
				(sum, item) => sum + item.dividendAmount,
				0,
			),
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
	try {
		const { shareholderId } = req.params;

		const shareholder = await Shareholder.findById(shareholderId);

		if (!shareholder) {
			return res.status(404).json({
				success: false,
				message: 'Shareholder not found',
			});
		}

		await Shareholder.findByIdAndDelete(shareholderId);

		res.json({
			success: true,
			message: 'Shareholder deleted successfully',
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};
