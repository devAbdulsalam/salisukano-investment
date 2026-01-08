import mongoose from 'mongoose';
import Creditor from '../models/Creditor.js';
import Credit from '../models/Credit.js';
import CreditMonth from '../models/CreditMonth.js';
import CreditInvoice from '../models/CreditInvoice.js';
import fs from 'fs';
import { uploader } from '../utils/cloudinary.js';
// Update creditor balance
// import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
dotenv.config();
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_API_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to set the date to the first day of the month
const getFirstDayOfMonth = (date) => {
	return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const getCreditors = async (req, res) => {
	try {
		const creditor = await Creditor.find();
		res.status(200).json(creditor);
	} catch (error) {
		res.status(404).json({ message: error.message });
	}
};

export const createCreditor = async (req, res) => {
	try {
		const { name, phone } = req.body;
		if (!name) {
			return res.status(401).json({ message: 'Creditor name is required!' });
		}
		const creditor = await Creditor.create({ name, phone });
		res.status(200).json(creditor);
	} catch (error) {
		res.status(404).json({ message: error.message });
	}
};
export const editCreditor = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, phone } = req.body;
		if (!id) {
			return res.status(404).json({ error: 'Invalid Creditor id' });
		}

		const creditor = await Creditor.findById(id);
		// Check if req.file is defined (uploaded image)
		if (!creditor) {
			return res.status(404).json({ error: 'Creditor not found' });
		}

		const updatedCreditor = await Creditor.findByIdAndUpdate(
			{ _id: id },
			{ name, phone }, // Use the new image path or keep the old one
			{ new: true } // Return the updated document
		);

		res.status(200).json({
			creditor: updatedCreditor,
			message: 'Creditor updated successfully',
		});
	} catch (error) {
		res.status(404).json({ message: error.message });
	}
};

export const getMonthlyCredit = async (req, res) => {
	try {
		const { id } = req.params;
		console.log('params', id);

		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({ error: 'Invalid creditor ID' });
		}

		// Find the creditor by ID
		const creditor = await Creditor.findById({ _id: id });
		if (!creditor) {
			return res.status(404).json({ error: 'Creditor not found' });
		}
		const monthlyData = await CreditMonth.find({ creditorId: id }).sort({
			month: 1,
		});

		const companyData = await Credit.aggregate([
			{
				$match: {
					creditorId: new mongoose.Types.ObjectId(id),
				},
			},

			// Group unique company + month
			{
				$group: {
					_id: {
						companyId: '$companyId',
						monthId: '$monthId',
					},
					total: { $sum: '$total' },
					credit: { $sum: '$credit' },
					debit: { $sum: '$debit' },
					balance: { $last: '$balance' },
					lastTransactionDate: { $max: '$date' },
				},
			},

			// Populate company (allow null)
			{
				$lookup: {
					from: 'customers',
					localField: '_id.companyId',
					foreignField: '_id',
					as: 'company',
				},
			},
			{
				$unwind: {
					path: '$company',
					preserveNullAndEmptyArrays: true,
				},
			},

			// Populate month (allow null)
			{
				$lookup: {
					from: 'creditmonths',
					localField: '_id.monthId',
					foreignField: '_id',
					as: 'month',
				},
			},
			{
				$unwind: {
					path: '$month',
					preserveNullAndEmptyArrays: true,
				},
			},

			// Clean output

			{
				$project: {
					_id: 0,
					company: {
						$cond: [
							{ $ifNull: ['$company', false] },
							{
								_id: '$company._id',
								name: '$company.name',
								phone: '$company.phone',
							},
							null,
						],
					},
					month: {
						$cond: [
							{ $ifNull: ['$month', false] },
							{
								_id: '$month._id',
								name: '$month.name',
								month: '$month.month',
							},
							null,
						],
					},

					//
					total: 1,
					credit: 1,
					debit: 1,
					balance: 1,
					lastTransactionDate: 1,
				},
			},

			// return unique _id: '$month._id',
			{
				$sort: {
					'company.name': 1,
					'month.name': 1,
				},
			},
		]);

		res.status(200).json({
			creditor,
			companyData,
			totalData: companyData.length,
			monthlyData,
		});
	} catch (error) {
		console.error('Error fetching monthly credits:', error);
		res.status(500).json({ message: 'Internal Server Error' });
	}
};

export const getMonthlyCredits = async (req, res) => {
	try {
		const { id, monthId } = req.params;
		const creditor = await Creditor.findById({ _id: id });
		if (!creditor) {
			return res.status(404).json({ error: 'Creditor not found' });
		}
		const creditMonth = await CreditMonth.findById({ _id: monthId });
		if (!creditMonth) {
			return res.status(404).json({ error: 'credit Month not found' });
		}
		const credits = await Credit.find({ monthId }).sort({ date: 1 });
		const creditInvoices = await CreditInvoice.find({ monthId })
			.sort({ date: 1 })
			.populate('credits');
		const totalCompaniesSupplied = await Credit.distinct('companyId', {
			creditorId: id,
			companyId: { $ne: null },
		}).then((ids) => ids.length);

		res.status(200).json({
			creditor,
			creditMonth,
			creditInvoices,
			credits,
			totalCompaniesSupplied: totalCompaniesSupplied[0]?.total || 0,
		});
	} catch (error) {
		res.status(404).json({ message: error.message });
	}
};

export const getCompanyMonthlyCredits = async (req, res) => {
	try {
		const { id, monthId, companyId } = req.params;
		const creditor = await Creditor.findById({ _id: id });
		if (!creditor) {
			return res.status(404).json({ error: 'Creditor not found' });
		}
		const creditMonth = await CreditMonth.findById({ _id: monthId });
		if (!creditMonth) {
			return res.status(404).json({ error: 'credit Month not found' });
		}
		const credits = await Credit.find({ monthId, companyId }).sort({ date: 1 });
		const creditInvoices = await CreditInvoice.find({ monthId, companyId })
			.sort({ date: 1 })
			.populate('credits');
		const totalCompaniesSupplied = await Credit.distinct('companyId', {
			companyId: { $ne: null },
		}).then((ids) => ids.length);

		res.status(200).json({
			creditor,
			creditMonth,
			creditInvoices,
			credits,
			totalCompaniesSupplied: totalCompaniesSupplied[0]?.total || 0,
		});
	} catch (error) {
		res.status(404).json({ message: error.message });
	}
};

export const getCredit = async (req, res) => {
	try {
		const { id } = req.params;

		const credit = await Credit.findById(id);
		if (!credit) {
			return res.status(404).json({ error: 'Credit not found' });
		}

		const [creditor, creditMonth] = await Promise.all([
			Creditor.findById(credit.creditorId),
			CreditMonth.findById(credit.monthId),
		]);

		const invoiceAggregation = await CreditInvoice.aggregate([
			{ $match: { _id: credit.invoiceId } },
			{
				$lookup: {
					from: 'credits',
					localField: 'credits',
					foreignField: '_id',
					as: 'credits',
				},
			},
			{
				$addFields: {
					creditsList: {
						$filter: {
							input: '$credits',
							as: 'c',
							cond: { $ifNull: ['$$c.credit', false] },
						},
					},
					debitsList: {
						$filter: {
							input: '$credits',
							as: 'c',
							cond: { $ifNull: ['$$c.debit', false] },
						},
					},
				},
			},
			{
				$addFields: {
					totalCredits: {
						$sum: {
							$map: {
								input: '$creditsList',
								as: 'c',
								in: { $ifNull: ['$$c.total', 0] },
							},
						},
					},
					totalDebits: {
						$sum: {
							$map: {
								input: '$debitsList',
								as: 'd',
								in: { $ifNull: ['$$d.total', 0] },
							},
						},
					},
				},
			},
			{
				$project: {
					_id: 1,
					monthId: 1,
					creditorId: 1,
					total: 1,
					credits: '$creditsList',
					debits: '$debitsList',
					totalCredits: 1,
					totalDebits: 1,
				},
			},
		]);

		const invoice = invoiceAggregation[0];

		return res.status(200).json({
			credit,
			creditor,
			creditMonth,
			invoice,
		});
	} catch (error) {
		console.error('Aggregation error:', error);
		res
			.status(500)
			.json({ message: 'Internal server error', error: error.message });
	}
};

export const getCredits = async (req, res) => {
	try {
		const { id } = req.params;
		const creditor = await Creditor.findById({ _id: id });
		if (!creditor) {
			return res.status(404).json({ error: 'Creditor not found' });
		}
		const credits = await Credit.find({ creditorId: id });
		const invoices = await CreditInvoice.find({
			creditorId: id,
		}).populate('credits');
		res.status(200).json({ creditor, credits, invoices });
	} catch (error) {
		res.status(404).json({ message: error.message });
	}
};

export const newCredit = async (req, res) => {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const creditorId = req.params.id;
		const {
			name,
			monthId,
			date,
			materials,
			vehicleNumber,
			description,
			deposits = [],
			companyId,
		} = req.body;

		// Basic Validation
		// if (!name || !date || !Array.isArray(materials) || materials.length === 0) {
		// 	await session.abortTransaction();
		// 	return res.status(400).json({ message: 'Missing required fields' });
		// }

		// Calculate total & quantity
		let total = 0,
			quantity = 0;
		for (const m of materials) {
			if (!m.qty || !m.rate) {
				await session.abortTransaction();
				return res.status(400).json({ message: 'Invalid material entry' });
			}
			total += Number(m.qty) * Number(m.rate);
			quantity += Number(m.qty);
		}
		const roundedTotal = Math.ceil(total);
		const roundedQuantity = Math.ceil(quantity);

		console.log('roundedTotal', roundedTotal);

		// Fetch creditor
		const creditor = await Creditor.findById(creditorId).session(session);
		if (!creditor) {
			await session.abortTransaction();
			return res.status(404).json({ message: 'Creditor not found' });
		}

		// Find or create month
		let transactionMonth;
		if (monthId) {
			transactionMonth = await CreditMonth.findById(monthId).session(session);
			if (!transactionMonth) {
				await session.abortTransaction();
				return res.status(404).json({ message: 'Credit month not found' });
			}
		} else {
			const firstDayOfMonth = getFirstDayOfMonth(new Date(date));
			transactionMonth = await CreditMonth.findOne({
				creditorId,
				month: firstDayOfMonth,
			}).session(session);
			// console.log('transactionMonth', transactionMonth);
			if (!transactionMonth) {
				transactionMonth = await CreditMonth.create(
					[
						{
							creditorId,
							month: firstDayOfMonth,
							balance: 0,
							quantity: roundedQuantity,
						},
					],
					{ session }
				).then((docs) => docs[0]);
			}
		}

		// Update month totals
		transactionMonth.balance += Number(roundedTotal); // Add roundedTotal;
		transactionMonth.quantity += roundedQuantity;

		// Create Invoice
		const invoice = await CreditInvoice.create(
			[
				{
					creditorId,
					monthId: transactionMonth._id,
					total: 0,
					date,
				},
			],
			{ session }
		).then((docs) => docs[0]);

		// Create credit record
		const credit = await Credit.create(
			[
				{
					creditorId,
					invoiceId: invoice._id,
					monthId: transactionMonth._id,
					name,
					date,
					description,
					materials,
					total: roundedTotal,
					credit: roundedTotal,
					quantity: roundedQuantity,
					vehicleNumber,
					balance: transactionMonth.balance,
					companyId,
				},
			],
			{ session }
		).then((docs) => docs[0]);

		// Prepare invoice credits, deposits
		const creditsArray = [credit._id];
		let runningBalance = transactionMonth.balance;
		let totalDeposit = 0;

		if (deposits.length) {
			totalDeposit = deposits.reduce(
				(acc, deposit) => acc + Number(deposit.amount),
				0
			);
			const depositDocs = deposits.map((deposit) => {
				const _id = new mongoose.Types.ObjectId();
				runningBalance -= Number(deposit.amount);
				creditsArray.push(_id);
				return {
					_id,
					creditorId,
					companyId,
					invoiceId: invoice._id,
					monthId: transactionMonth._id,
					date,
					total: deposit.amount,
					debit: deposit.amount,
					description: deposit.description,
					balance: runningBalance,
					vehicleNumber,
					remark: 'Deposits',
				};
			});
			await Credit.insertMany(depositDocs, { session });
			transactionMonth.balance -= Number(totalDeposit);
			creditor.balance += Number(roundedTotal) - Number(totalDeposit);
		} else {
			creditor.balance += roundedTotal;
		}

		// Create Invoice
		const updatedInvoice = await CreditInvoice.findByIdAndUpdate(
			{ _id: invoice._id },
			{
				credits: creditsArray,
				total: roundedTotal - Number(totalDeposit),
			},
			{ new: true, session }
		);

		// Save everything
		await transactionMonth.save({ session });
		await creditor.save({ session });
		await invoice.save({ session });

		await session.commitTransaction();

		res.status(201).json({
			credit,
			creditor,
			invoice: updatedInvoice[0],
			message: 'Credit and deposits created successfully',
		});
	} catch (error) {
		await session.abortTransaction();
		console.error('Error creating credit:', error.stack || error.message);
		res
			.status(500)
			.json({ message: 'Internal server error', error: error.message });
	} finally {
		session.endSession();
	}
};

export const updateCreditInvoice = async (req, res) => {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const { invoiceId } = req.body;
		if (!invoiceId) {
			await session.abortTransaction();
			return res.status(404).json({ message: 'Invoice id is reqired!' });
		}
		const {
			date,
			credits = [],
			deposits = [],
			vehicleNumber,
			description,
		} = req.body;
		console.log('invoiceId', invoiceId);
		// Find invoice
		const invoice = await CreditInvoice.findById(invoiceId).session(session);
		if (!invoice) {
			await session.abortTransaction();
			return res.status(404).json({ message: 'Invoice not found' });
		}
		const creditor = await Creditor.findById(invoice.creditorId).session(
			session
		);
		const creditMonth = await CreditMonth.findById(invoice.monthId).session(
			session
		);

		// Clear existing credits linked to this invoice
		const existingCredits = await Credit.find({
			_id: { $in: invoice.credits },
		}).session(session);

		let totalCreditAmount = 0;
		let totalDebitAmount = 0;

		for (const trx of existingCredits) {
			// Reverse balance effects

			if (trx.credit) {
				creditor.balance -= trx.credit;
				creditMonth.balance -= trx.credit;
			} else if (trx.debit) {
				creditor.balance += trx.debit;
				creditMonth.balance += trx.debit;
			}

			await creditor.save({ session });
			await creditMonth.save({ session });
		}

		// Delete previous credits
		await Credit.deleteMany({ _id: { $in: invoice.credits } }).session(session);
		invoice.credits = [];

		// Create new credit transactions
		for (const credit of credits) {
			const total = Math.ceil(
				credit.materials.reduce((sum, m) => sum + m.qty * m.rate, 0)
			);
			const quantity = Math.ceil(
				credit.materials.reduce((sum, m) => sum + m.qty, 0)
			);

			const creditMonth = await CreditMonth.findById(credit.monthId).session(
				session
			);
			const creditor = await Creditor.findById(credit.creditorId).session(
				session
			);

			const created = await Credit.create(
				[
					{
						...credit,
						total,
						credit: total,
						quantity,
						invoiceId: invoice._id,
						balance: creditMonth.balance + total,
						date,
					},
				],
				{ session }
			);

			invoice.credits.push(created[0]._id);
			creditor.balance += total;
			creditMonth.balance += total;
			totalCreditAmount += total;

			await Promise.all([
				creditor.save({ session }),
				creditMonth.save({ session }),
			]);
		}

		// Create deposit transactions
		for (const deposit of deposits) {
			const amount = Number(deposit.amount);
			const creditor = await Creditor.findById(deposit.creditorId).session(
				session
			);
			const creditMonth = await CreditMonth.findById(deposit.monthId).session(
				session
			);

			const trx = await Credit.create(
				[
					{
						creditorId: invoice.creditorId,
						monthId: invoice.monthId,
						date,
						total: amount,
						debit: amount,
						invoiceId: invoice._id,
						description: deposit.description || 'Deposit',
						vehicleNumber,
						balance: creditMonth.balance - amount,
					},
				],
				{ session }
			);

			invoice.credits.push(trx[0]._id);
			creditor.balance -= amount;
			creditMonth.balance -= amount;
			totalDebitAmount += amount;

			await Promise.all([
				creditor.save({ session }),
				creditMonth.save({ session }),
			]);
		}

		invoice.total = totalCreditAmount - totalDebitAmount;
		await invoice.save({ session });

		await session.commitTransaction();

		res.status(200).json({
			invoice,
			totalCreditAmount,
			totalDebitAmount,
			message: 'Invoice updated successfully',
		});
	} catch (error) {
		await session.abortTransaction();
		console.error(
			'Error updating credit invoice:',
			error.stack || error.message
		);
		res
			.status(500)
			.json({ message: 'Internal server error', error: error.message });
	} finally {
		session.endSession();
	}
};

export const createDeposit = async (req, res) => {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const {
			creditorId,
			invoiceId,
			amount,
			description,
			remark = '',
			date,
			monthId,
		} = req.body;
		if (invoiceId) {
			// Create Invoice
			const invoice = await CreditInvoice.findById(invoiceId).session(session);
			if (!invoice) {
				await session.abortTransaction();
				return res.status(404).json({ message: 'Invoice not found' });
			}
			const creditor = await Creditor.findById(invoice.creditorId).session(
				session
			);
			const transactionMonth = await CreditMonth.findById(
				invoice.monthId
			).session(session);

			const newbal = Number(transactionMonth.balance) - Number(amount);
			// Create a new deposit transaction
			console.log('newbal', newbal);
			const credit = await Credit.create(
				[
					{
						creditorId: creditor._id,
						invoiceId: invoice._id,
						monthId: transactionMonth._id,
						date,
						total: amount,
						debit: amount, // Represents the deposit as a debit
						balance: newbal,
						description,
						vehicleNumber: description, // Assuming vehicleNumber is passed as description
						remark,
					},
				],
				{ session }
			);

			// Update creditor's total balance
			creditor.balance -= amount;
			transactionMonth.balance -= amount;
			invoice.credits.push(credit[0]._id);
			invoice.balance -= amount;
			await invoice.save({ session });
			await creditor.save({ session });
			await transactionMonth.save({ session });

			// Commit the transaction
			await session.commitTransaction();
			// Send success response
			res.status(201).json({
				credit,
				creditor,
				invoice,
				message: 'Deposit created successfully',
			});
		} else {
			// Find the creditor by ID
			const creditor = await Creditor.findById(creditorId).session(session);
			if (!creditor) {
				await session.abortTransaction();
				return res.status(400).json({ message: 'Creditor not found' });
			}

			// Find or create the credit month entry
			let transactionMonth;
			if (monthId) {
				// Update or create a month by monthId
				transactionMonth = await CreditMonth.findOneAndUpdate(
					{ _id: monthId },
					{ $inc: { balance: -amount } },
					{ upsert: true, new: true, session }
				);
			} else {
				// Check if a month exists for the provided date
				const firstDayOfMonth = getFirstDayOfMonth(new Date(date));
				transactionMonth = await CreditMonth.findOne({
					creditorId,
					month: firstDayOfMonth,
				}).session(session);

				if (!transactionMonth) {
					// Create a new credit month if it doesn't exist
					transactionMonth = await CreditMonth.create(
						[
							{
								creditorId,
								month: firstDayOfMonth,
								balance: -amount, // Since it's a deposit, the balance decreases
							},
						],
						{ session }
					).then((docs) => docs[0]);
				} else {
					// Update the existing month's balance
					transactionMonth.balance -= amount;
					await transactionMonth.save({ session });
				}
			}
			// Create Invoice
			const invoice = await CreditInvoice.create(
				[
					{
						creditorId,
						monthId: transactionMonth._id,
						total: amount,
						date,
					},
				],
				{ session }
			).then((docs) => docs[0]);
			// Update creditor's total balance
			creditor.balance -= amount;
			await creditor.save({ session });

			// Create a new deposit transaction
			const credit = await Credit.create(
				[
					{
						creditorId,
						invoiceId: invoice._id,
						monthId: transactionMonth._id,
						date,
						total: amount,
						debit: amount, // Represents the deposit as a debit
						balance: transactionMonth.balance,
						description,
						vehicleNumber: description, // Assuming vehicleNumber is passed as description
						remark,
					},
				],
				{ session }
			);

			invoice.credits.push(credit[0]._id);
			await invoice.save({ session });

			// Commit the transaction
			await session.commitTransaction();
			// Send success response
			res.status(201).json({
				credit,
				creditor,
				invoice,
				message: 'Deposit created successfully',
			});
		}
	} catch (error) {
		// Abort transaction in case of an error
		await session.abortTransaction();
		console.error('Error processing deposit:.......', error);
		console.error('Error processing deposit:', error.message);
		res.status(500).json({ message: 'Internal server error' });
	} finally {
		// Always end the session
		session.endSession();
	}
};

export const deleteCredit = async (req, res) => {
	try {
		const { creditorId, creditId } = req.params;

		if (!creditorId || !creditId) {
			return res.status(400).json({ error: 'Missing creditor or credit ID' });
		}

		// Fetch necessary data
		const [creditor, transaction] = await Promise.all([
			Creditor.findById(creditorId),
			Credit.findById(creditId),
		]);

		if (!creditor) return res.status(404).json({ error: 'Creditor not found' });
		if (!transaction)
			return res.status(404).json({ error: 'Credit not found' });

		const [creditMonth, creditInvoice] = await Promise.all([
			CreditMonth.findById(transaction.monthId),
			CreditInvoice.findById(transaction.invoiceId),
		]);

		if (!creditMonth)
			return res.status(404).json({ error: 'Credit month not found' });
		if (!creditInvoice)
			return res.status(404).json({ error: 'Invoice not found' });

		// Adjust balances
		if (transaction.credit) {
			creditor.balance -= transaction.credit;
			creditMonth.balance -= transaction.credit;
			creditInvoice.total -= transaction.credit;
		} else if (transaction.debit) {
			creditor.balance += transaction.debit;
			creditMonth.balance += transaction.debit;
			creditInvoice.total += transaction.debit;
		}

		// Remove creditId from invoice.credits[]
		creditInvoice.credits = creditInvoice.credits.filter(
			(id) => id.toString() !== creditId
		);

		// Delete transaction
		await transaction.deleteOne();

		// Save updates
		await Promise.all([
			creditor.save(),
			creditMonth.save(),
			creditInvoice.save(),
		]);

		res.status(200).json({
			message: 'Transaction deleted and balances updated successfully',
		});
	} catch (error) {
		console.error('Error deleting credit:', error);
		res.status(500).json({ message: error.message });
	}
};

export const deleteCreditInvoice = async (req, res) => {
	try {
		const { invoiceId } = req.params;

		if (!invoiceId) {
			return res.status(400).json({ error: 'Invoice ID is required' });
		}

		console.log('creditInvoice', invoiceId);
		const creditInvoice = await CreditInvoice.findById(invoiceId);
		if (!creditInvoice) {
			return res.status(404).json({ error: 'Credit Invoice not found' });
		}
		console.log('creditInvoice', creditInvoice);
		const [creditor, creditMonth] = await Promise.all([
			Creditor.findById(creditInvoice.creditorId),
			CreditMonth.findById(creditInvoice.monthId),
		]);

		if (!creditor) {
			return res.status(404).json({ error: 'Creditor not found' });
		}
		if (!creditMonth) {
			return res.status(404).json({ error: 'Credit Month not found' });
		}

		const transactions = creditInvoice.credits || [];

		if (transactions.length === 0) {
			return res
				.status(404)
				.json({ error: 'No transactions found for this invoice' });
		}

		// Loop over transactions to adjust balances and delete them
		for (const creditId of transactions) {
			const transaction = await Credit.findById(creditId);
			if (transaction) {
				if (transaction.credit) {
					creditor.balance -= transaction.credit;
					creditMonth.balance -= transaction.credit;
				} else if (transaction.debit) {
					creditor.balance += transaction.debit;
					creditMonth.balance += transaction.debit;
				}
				await transaction.deleteOne();
			}
		}

		await creditInvoice.deleteOne();
		await Promise.all([creditor.save(), creditMonth.save()]);

		res.status(200).json({
			message: 'Invoice and associated transactions deleted successfully',
		});
	} catch (error) {
		console.error('Error deleting credit invoice:', error);
		res.status(500).json({ message: error.message });
	}
};

export const addCreditFunction = async (req, res) => {
	try {
		const { creditorId, creditAmount, remark = '', date } = req.body;

		// Find the debtor by ID
		const creditor = await Creditor.findById(creditorId);
		if (!creditor) {
			throw new Error('creditor not found');
		}

		// Add credit and update balance
		const newBalance = Number(creditor.balance) + Number(creditAmount);

		// Create a new transaction with the credit
		const newTransaction = {
			credit: creditAmount,
			balance: newBalance,
			remark: remark || 'Credit added',
			date: date || new Date(),
		};

		// Update debtor's balance and add the transaction
		creditor.balance = newBalance;
		creditor.transactions.push(newTransaction);

		// Save the updated creditor
		await creditor.save();

		res.status(200).json({ message: 'Credit added successfully', creditor });
	} catch (error) {
		res.status(404).json({ message: error.message });
	}
};

// Add debit to a debtor
export const addDebitFunction = async (req, res) => {
	try {
		const { CreditorId, debitAmount, remark = '', date } = req.body;

		// Find the Creditor by ID
		const Creditor = await Creditor.findById(CreditorId);
		if (!Creditor) {
			throw new Error('Creditor not found');
		}

		// Ensure the Creditor has sufficient balance for the debit
		// if (Creditor.balance < debitAmount) {
		// 	throw new Error('Insufficient balance for this debit');
		// }

		// Subtract debit and update balance
		const newBalance = Number(Creditor.balance) - Number(debitAmount);

		// Create a new transaction with the debit
		const newTransaction = {
			debit: debitAmount,
			balance: newBalance,
			remark: remark || 'Debit added',
			date: date || new Date(),
		};

		// Update Creditor's balance and add the transaction
		Creditor.balance = newBalance;
		Creditor.transactions.push(newTransaction);

		// Save the updated Creditor
		await Creditor.save();

		res.status(200).json({ Creditor, message: 'Debit added successfully' });
	} catch (error) {
		res.status(404).json({ message: error.message });
	}
};
