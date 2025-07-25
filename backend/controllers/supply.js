import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import Customer from '../models/Customer.js';
import Account from '../models/Account.js';
import fs from 'fs';
import { uploader } from '../utils/cloudinary.js';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import { updateTransactionsBalance } from '../services/updateTransactions.js';
dotenv.config();
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_API_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const createSupply = async (req, res) => {
	const session = await mongoose.startSession();

	try {
		const { name, date, materials, vehicleNumber, description, accountId } =
			req.body;
		await session.withTransaction(async () => {
			// Input validation
			if (!accountId || !name || !date || !materials?.length) {
				await session.abortTransaction();
				return res.status(400).json({
					message: 'Missing required fields',
				});
			}

			// Calculate totals efficiently
			const { total, quantity } = materials.reduce(
				(acc, material) => ({
					total: acc.total + material.qty * material.rate,
					quantity: acc.quantity + Number(material.qty),
				}),
				{ total: 0, quantity: 0 }
			);

			const roundedTotal = Math.ceil(total);
			const roundedQuantity = Math.ceil(quantity);

			// Check if account exists first (lightweight operation)
			const accountExists = await Account.exists({ _id: accountId }).session(
				session
			);
			if (!accountExists) {
				await session.abortTransaction();
				return res.status(400).json({ message: 'Account not found' });
			}

			// Optimized duplicate check with indexed fields first
			const duplicateExists = await Transaction.exists({
				accountId,
				name,
				date,
				vehicleNumber,
				// Only check materials if basic fields match (more efficient)
				$or: [
					{ materials: { $eq: materials } },
					{
						$and: [
							{ 'materials.product': { $in: materials.map((m) => m.product) } },
							{ 'materials.qty': { $in: materials.map((m) => m.qty) } },
							{ 'materials.rate': { $in: materials.map((m) => m.rate) } },
						],
					},
				],
			}).session(session);

			if (duplicateExists) {
				await session.abortTransaction();
				return res
					.status(400)
					.json({ message: 'Duplicate transaction detected' });
			}

			// Get current account balance for transaction record
			const currentAccount = await Account.findById(accountId)
				.select('balance')
				.session(session);

			const newBalance = currentAccount.balance + roundedTotal;

			// Create transaction first (data integrity - create records before updating balances)
			const [transaction] = await Transaction.create(
				[
					{
						accountId,
						name,
						date,
						description,
						materials,
						total: roundedTotal,
						quantity: roundedQuantity,
						vehicleNumber,
						credit: roundedTotal,
						balance: newBalance,
					},
				],
				{ session }
			);

			// Update account balance after successful transaction creation
			const updatedAccount = await Account.findByIdAndUpdate(
				accountId,
				{
					$inc: {
						balance: roundedTotal,
						credit: roundedTotal,
					},
				},
				{ new: true, session }
			);

			// Return success response
			return {
				transaction,
				account: updatedAccount,
				message: 'Transaction created successfully',
			};
		});

		// If we reach here, transaction was successful
		const result = await session.commitTransaction();
		await updateTransactionsBalance(accountId);
		res.status(201).json(result);
	} catch (error) {
		// Transaction automatically rolled back by withTransaction
		console.error('Error creating supply transaction:', error);

		// Send appropriate error response
		const statusCode = error.message.includes('not found')
			? 404
			: error.message.includes('Duplicate')
			? 409
			: error.message.includes('required fields')
			? 400
			: 500;

		res.status(statusCode).json({
			message: error.message || 'Internal server error',
		});
	} finally {
		await session.endSession();
	}
};

export const updateSupply = async (req, res) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	let isCommitted = false;

	try {
		const { id } = req.params;
		const { name, materials, vehicleNumber, date, description } = req.body;

		// ✅ Validate materials
		if (!Array.isArray(materials) || materials.length === 0) {
			await session.abortTransaction();
			return res
				.status(400)
				.json({ message: 'Materials must be a non-empty array' });
		}

		// ✅ Calculate new totals
		const { total, quantity } = materials.reduce(
			(acc, m) => {
				acc.total += m.qty * m.rate;
				acc.quantity += Number(m.qty);
				return acc;
			},
			{ total: 0, quantity: 0 }
		);

		const roundedTotal = Math.ceil(total);
		const roundedQuantity = Math.ceil(quantity);

		// ✅ Find existing transaction
		const existingTransaction = await Transaction.findById(id).session(session);
		if (!existingTransaction) {
			await session.abortTransaction();
			return res.status(400).json({ message: 'Transaction not found' });
		}

		// ✅ Duplicate check (ignore current record)
		const duplicateExists = await Transaction.findOne({
			_id: { $ne: id },
			accountId: existingTransaction.accountId,
			name,
			date,
			vehicleNumber,
			materials,
		}).session(session);

		if (duplicateExists) {
			await session.abortTransaction();
			return res
				.status(400)
				.json({ message: 'Duplicate transaction detected' });
		}

		// ✅ Calculate total difference for account adjustment
		const totalDifference = roundedTotal - existingTransaction.total;

		// ✅ Update account
		const account = await Account.findByIdAndUpdate(
			existingTransaction.accountId,
			{ $inc: { balance: totalDifference, credit: totalDifference } },
			{ new: true, session }
		);
		if (!account) {
			await session.abortTransaction();
			return res.status(400).json({ message: 'Account not found' });
		}

		// ✅ Update transaction
		const updatedTransaction = await Transaction.findByIdAndUpdate(
			id,
			{
				name,
				description,
				materials,
				date,
				total: roundedTotal,
				quantity: roundedQuantity,
				vehicleNumber,
				credit: account.credit,
				balance: account.balance,
			},
			{ new: true, session }
		);

		await session.commitTransaction();
		isCommitted = true;
		await updateTransactionsBalance(existingTransaction.accountId);

		return res.status(200).json({
			transaction: updatedTransaction,
			account,
			message: 'Transaction updated successfully',
		});
	} catch (error) {
		console.error('Error updating transaction:', error.message);
		if (!isCommitted) {
			await session.abortTransaction();
		}
		console.error('Error updating transaction:', error.message);
		return res
			.status(400)
			.json({ message: error.message || 'Internal server error' });
	} finally {
		session.endSession();
	}
};

export const createCustomerSupply = async (req, res) => {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const { materials, vehicleNumber, date, description, customerId } =
			req.body;

		// Calculate the total and quantity in one reduce function for efficiency
		const { total, quantity } = materials.reduce(
			(acc, material) => {
				acc.total += material.qty * material.rate;
				acc.quantity += Number(material.qty);
				return acc;
			},
			{ total: 0, quantity: 0 }
		);

		const roundedTotal = Math.ceil(total);
		const roundedQuantity = Math.ceil(quantity);

		// Update the account's balance and credit
		const account = await Customer.findOneAndUpdate(
			{ _id: customerId },
			{ $inc: { balance: roundedTotal, credit: roundedTotal } },
			{ new: true, session }
		);

		if (!account) {
			await session.abortTransaction();
			return res.status(400).json({ message: 'Account not found' });
		}
		console.log('account', account);
		const transaction = await Transaction.create(
			[
				{
					customerId: customerId,
					name: account.name,
					description,
					materials,
					date,
					total: roundedTotal,
					quantity: roundedQuantity,
					vehicleNumber,
					credit: roundedTotal,
					balance: account.balance,
				},
			],
			{ session }
		);

		await session.commitTransaction();

		return res.status(201).json({
			transaction: transaction[0],
			account,
			message: 'Transaction created successfully',
		});
	} catch (error) {
		await session.abortTransaction();
		console.error('Error creating customer transaction:', error);
		res.status(500).json({ message: 'Internal server error' });
	} finally {
		session.endSession();
	}
};
export const updateCustomerSupply = async (req, res) => {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const { id } = req.params;
		const { date, materials, vehicleNumber, description } = req.body;

		// Calculate the new total and quantity based on updated materials
		const { total, quantity } = materials.reduce(
			(acc, material) => {
				acc.total += material.qty * material.rate;
				acc.quantity += Number(material.qty);
				return acc;
			},
			{ total: 0, quantity: 0 }
		);

		const roundedTotal = Math.ceil(total);
		const roundedQuantity = Math.ceil(quantity);

		// Find the existing transaction
		const existingTransaction = await Transaction.findById(id).session(session);

		if (!existingTransaction) {
			await session.abortTransaction();
			return res.status(404).json({ message: 'Transaction not found' });
		}

		// Calculate the difference in total to update the account balance and credit
		const totalDifference = roundedTotal - existingTransaction.total;

		// Update the account's balance and credit
		const account = await Customer.findByIdAndUpdate(
			existingTransaction.customerId,
			{
				$inc: { balance: totalDifference, credit: totalDifference },
			},
			{ new: true, session }
		);

		if (!account) {
			await session.abortTransaction();
			return res.status(400).json({ message: 'Account not found' });
		}

		// Update the transaction with new data
		const updatedTransaction = await Transaction.findByIdAndUpdate(
			id,
			{
				name: account.name,
				description,
				materials,
				date,
				total: roundedTotal,
				quantity: roundedQuantity,
				vehicleNumber,
				credit: account.credit,
				balance: account.balance,
			},
			{ new: true, session }
		);

		await session.commitTransaction();

		res.status(200).json({
			transaction: updatedTransaction,
			account,
			message: 'Transaction updated successfully',
		});
	} catch (error) {
		await session.abortTransaction();
		console.error('Error updating transaction:', error.message);
		res.status(500).json({ message: 'Internal server error' });
	} finally {
		session.endSession();
	}
};

// Get all deliveries for a specific company
export const getSupply = async (req, res) => {
	try {
		const { id } = req.params;
		if (!id) {
			res.status(402).json({ message: 'Invalid company id' });
		}
		const supply = await Transaction.findById(id).populate('customerId');
		if (!supply) {
			res.status(402).json({ message: 'Invalid supply id' });
		}
		res.status(200).json(supply);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Internal Server Error' });
	}
};

// Get all Transactions with vehicelNo
export const getSuppliers = async (req, res) => {
	try {
		// Use MongoDB aggregation to group transactions by month and count total supplies, along with accountId
		const supplies = await Transaction.aggregate([
			{
				$match: {
					vehicleNumber: { $exists: true, $ne: '' },
				},
			},
			{
				// Group by year, month, and accountId
				$group: {
					_id: {
						month: { $dateToString: { format: '%Y-%m', date: '$date' } }, // Extract year and month
						accountId: '$accountId', // Include accountId
					},
					totalSupplies: { $sum: 1 }, // Count the number of transactions (supplies)
				},
			},
			{
				$sort: { '_id.month': 1 }, // Sort by month ascending
			},
			{
				$project: {
					month: '$_id.month', // Rename _id.month to month
					accountId: '$_id.accountId', // Include accountId in the final result
					totalSupplies: 1,
					_id: 0, // Exclude the _id field
				},
			},
		]).exec();

		res.status(200).json({
			supplies,
			message: 'Supplies fetched successfully',
		});
	} catch (error) {
		console.error('Error fetching supplies:', error.message);
		res.status(500).json({ error: 'Internal Server Error' });
	}
};

export const getSupplies = async (req, res) => {
	try {
		const { id } = req.params;

		// Validate the company ID
		if (!id) {
			return res.status(400).json({ message: 'Invalid company ID' });
		}

		// Find the account by ID and populate the customer details
		const account = await Account.findById(id).populate('customerId');
		if (!account) {
			return res.status(404).json({ message: 'Account not found' });
		}

		// Use aggregation to calculate total quantity and total credit
		const [result] = await Transaction.aggregate([
			{
				$match: {
					accountId: new mongoose.Types.ObjectId(id), // Filter transactions by accountId
					vehicleNumber: { $exists: true, $ne: '' }, // Only consider supplies with a vehicleNumber
				},
			},
			{
				$group: {
					_id: null,
					totalQuantity: { $sum: '$quantity' }, // Sum up the total quantity
					totalCredit: { $sum: '$credit' }, // Sum up the total credit
					supplies: {
						$push: {
							_id: '$_id',
							vehicleNumber: '$vehicleNumber',
							quantity: '$quantity',
							createdAt: '$createdAt',
							date: '$date',
							name: '$name',
							credit: '$credit',
						},
					}, // Collect all supply data
				},
			},
		]);

		// Handle case where no supplies were found
		if (!result) {
			return res.status(200).json({
				account,
				totalQuantity: 0,
				totalCredit: 0,
				supplies: [],
				message: 'No supplies found',
			});
		}

		// Get supplies data without aggregation (for displaying individual records)
		// const supplies = await Transaction.find({
		// 	accountId: id,
		// 	vehicleNumber: { $exists: true, $ne: '' }, // Only fetch records where vehicleNumber exists and is not empty
		// })
		// 	.sort({ date: -1 }) // Sort by the latest date
		// 	.select('vehicleNumber quantity createdAt date name credit') // Select only necessary fields
		// 	.lean(); // Use lean to improve performance for read operations

		// Respond with the account, supplies data, and aggregated totals
		res.status(200).json({
			account,
			totalQuantity: result.totalQuantity,
			totalCredit: result.totalCredit,
			supplies: result.supplies,
			message: 'Supplies fetched successfully',
		});
	} catch (error) {
		console.error('Error fetching supplies:', error.message);
		res.status(500).json({ error: 'Internal Server Error' });
	}
};

export const getSuppliesByVehicelNumber = async (req, res) => {
	try {
		const { vehicleNumber } = req.query;

		if (!vehicleNumber) {
			return res.status(400).json({ error: 'Vehicle number is required.' });
		}

		const page = parseInt(req.query.page, 10) || 1;
		const limit = parseInt(req.query.limit, 10) || 20;
		const skip = (page - 1) * limit;

		const aggregationPipeline = [
			{ $match: { vehicleNumber } },
			{
				$project: {
					vehicleNumber: 1,
					totalQty: { $sum: '$materials.qty' }, // Adjust based on your schema
					createdAt: 1,
				},
			},
			{ $sort: { createdAt: -1 } },
			{ $skip: skip },
			{ $limit: limit },
		];

		const supplies = await Transaction.aggregate(aggregationPipeline).lean();

		const totalSupplies = await Transaction.countDocuments({ vehicleNumber });
		const totalPages = Math.ceil(totalSupplies / limit);

		res.status(200).json({
			supplies,
			pagination: {
				totalSupplies,
				currentPage: page,
				totalPages,
				pageSize: limit,
			},
			message: 'Supplies fetched successfully.',
		});
	} catch (error) {
		console.error('Error fetching supplies:', error);
		res.status(500).json({ error: 'Internal Server Error' });
	}
};

// API endpoint to get total cost for a company
// '/totalCost/:company',
export const getTotal = async (req, res) => {
	try {
		const { id } = req.params;

		const totalCost = await Transaction.aggregate([
			{ $match: { company: id } },
			{ $group: { _id: null, totalCost: { $sum: '$totalCost' } } },
		]);

		res.json({ totalCost: totalCost.length ? totalCost[0].totalCost : 0 });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Internal server error' });
	}
};
export const deleteSupplyTransaction = async (req, res) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		const { id } = req.params;
		// Find the existing transaction
		const existingTransaction = await Transaction.findById(id).session(session);
		if (!existingTransaction) {
			await session.abortTransaction();
			return res.status(404).json({ message: 'Transaction not found' });
		}

		// Calculate the total difference
		const totalDifference = existingTransaction.total; // Assuming 'total' represents the amount to be reverted

		// Determine if the transaction is linked to a Customer or an Account
		if (existingTransaction.customerId) {
			// Update Customer balance and debit/credit
			await Customer.findByIdAndUpdate(
				existingTransaction.customerId,
				{
					$inc: { balance: -totalDifference, credit: -totalDifference }, // Add back to balance, reduce from debit
				},
				{ new: true, session }
			);
		} else if (existingTransaction.accountId) {
			// Update Account balance and debit/credit
			await Account.findByIdAndUpdate(
				existingTransaction.accountId,
				{
					$inc: { balance: -totalDifference, credit: -totalDifference }, // Add back to balance, reduce from debit
				},
				{ new: true, session }
			);
		}

		// Delete the transaction
		const deletedTransaction = await Transaction.findByIdAndDelete(id).session(
			session
		);
		// Commit the transaction
		await session.commitTransaction();
		session.endSession();

		if (existingTransaction.accountId) {
			await updateTransactionsBalance(existingTransaction.accountId);
		}
		return res.status(200).json({
			transaction: deletedTransaction,
			message: 'Transaction deleted and balances updated successfully',
		});
	} catch (error) {
		// Handle any errors
		await session.abortTransaction();
		session.endSession();
		console.error(error);
		return res.status(500).json({ message: 'Internal server error' });
	}
};
