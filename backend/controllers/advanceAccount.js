import mongoose from 'mongoose';
import AdvanceAccount from '../models/AdvanceAccount.js';
import Customer from '../models/Customer.js';

// GET or create advance account for a company
export const getAdvanceAccount = async (req, res) => {
	try {
		const { id } = req.params; // customerId

		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({ error: 'Invalid customer ID' });
		}

		const customer = await Customer.findById(id).select('name phone');
		if (!customer) {
			return res.status(404).json({ error: 'Customer not found' });
		}

		// Auto-create if one doesn't exist yet
		let account = await AdvanceAccount.findOne({ customerId: id });
		if (!account) {
			account = await AdvanceAccount.create({ customerId: id, balance: 0, transactions: [] });
		}

		// Sort transactions by date ascending for the running-balance ledger
		account.transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

		res.status(200).json({ account, customer });
	} catch (error) {
		console.error('getAdvanceAccount error:', error.message);
		res.status(500).json({ message: 'Internal server error' });
	}
};

// POST  — Add a credit entry (company pays in advance)
export const newCredit = async (req, res) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		const { id } = req.params; // customerId
		const { date, description, remark, amount } = req.body;

		if (!date || !amount || isNaN(amount) || Number(amount) <= 0) {
			await session.abortTransaction();
			return res.status(400).json({ message: 'Date and a valid positive amount are required' });
		}

		let account = await AdvanceAccount.findOne({ customerId: id }).session(session);
		if (!account) {
			account = (
				await AdvanceAccount.create([{ customerId: id, balance: 0, transactions: [] }], { session })
			)[0];
		}

		const newBalance = account.balance + Number(amount);

		account.transactions.push({
			date: new Date(date),
			description: description || '',
			remark: remark || '',
			credit: Number(amount),
			debit: 0,
			balance: newBalance,
		});
		account.balance = newBalance;

		await account.save({ session });
		await session.commitTransaction();

		res.status(201).json({ account, message: 'Credit entry added successfully' });
	} catch (error) {
		await session.abortTransaction();
		console.error('newCredit error:', error.message);
		res.status(500).json({ message: 'Internal server error' });
	} finally {
		session.endSession();
	}
};

// POST  — Add a debit entry (advance consumed against a transaction)
export const newDebit = async (req, res) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		const { id } = req.params; // customerId
		const { date, description, remark, amount } = req.body;

		if (!date || !amount || isNaN(amount) || Number(amount) <= 0) {
			await session.abortTransaction();
			return res.status(400).json({ message: 'Date and a valid positive amount are required' });
		}

		let account = await AdvanceAccount.findOne({ customerId: id }).session(session);
		if (!account) {
			await session.abortTransaction();
			return res.status(404).json({ message: 'Advance account not found' });
		}

		const newBalance = account.balance - Number(amount);

		account.transactions.push({
			date: new Date(date),
			description: description || '',
			remark: remark || '',
			credit: 0,
			debit: Number(amount),
			balance: newBalance,
		});
		account.balance = newBalance;

		await account.save({ session });
		await session.commitTransaction();

		res.status(201).json({ account, message: 'Debit entry added successfully' });
	} catch (error) {
		await session.abortTransaction();
		console.error('newDebit error:', error.message);
		res.status(500).json({ message: 'Internal server error' });
	} finally {
		session.endSession();
	}
};

// PATCH — Edit a transaction and recalculate running balances
export const editTransaction = async (req, res) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		const { id, transactionId } = req.params; // customerId, transactionId
		const { date, description, remark, amount, type } = req.body; // type: 'credit' | 'debit'

		if (!amount || isNaN(amount) || Number(amount) <= 0) {
			await session.abortTransaction();
			return res.status(400).json({ message: 'A valid positive amount is required' });
		}

		const account = await AdvanceAccount.findOne({ customerId: id }).session(session);
		if (!account) {
			await session.abortTransaction();
			return res.status(404).json({ message: 'Advance account not found' });
		}

		const tx = account.transactions.id(transactionId);
		if (!tx) {
			await session.abortTransaction();
			return res.status(404).json({ message: 'Transaction not found' });
		}

		// Apply edits
		if (date) tx.date = new Date(date);
		if (description !== undefined) tx.description = description;
		if (remark !== undefined) tx.remark = remark;
		if (type === 'credit') {
			tx.credit = Number(amount);
			tx.debit = 0;
		} else {
			tx.debit = Number(amount);
			tx.credit = 0;
		}

		// Recalculate running balances from scratch
		account.transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
		let running = 0;
		for (const t of account.transactions) {
			running += t.credit - t.debit;
			t.balance = running;
		}
		account.balance = running;

		await account.save({ session });
		await session.commitTransaction();

		res.status(200).json({ account, message: 'Transaction updated successfully' });
	} catch (error) {
		await session.abortTransaction();
		console.error('editTransaction error:', error.message);
		res.status(500).json({ message: 'Internal server error' });
	} finally {
		session.endSession();
	}
};

// DELETE — Remove a transaction and recalculate running balances
export const deleteTransaction = async (req, res) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		const { id, transactionId } = req.params; // customerId, transactionId

		const account = await AdvanceAccount.findOne({ customerId: id }).session(session);
		if (!account) {
			await session.abortTransaction();
			return res.status(404).json({ message: 'Advance account not found' });
		}

		const tx = account.transactions.id(transactionId);
		if (!tx) {
			await session.abortTransaction();
			return res.status(404).json({ message: 'Transaction not found' });
		}

		tx.deleteOne();

		// Recalculate running balances
		account.transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
		let running = 0;
		for (const t of account.transactions) {
			running += t.credit - t.debit;
			t.balance = running;
		}
		account.balance = running;

		await account.save({ session });
		await session.commitTransaction();

		res.status(200).json({ account, message: 'Transaction deleted successfully' });
	} catch (error) {
		await session.abortTransaction();
		console.error('deleteTransaction error:', error.message);
		res.status(500).json({ message: 'Internal server error' });
	} finally {
		session.endSession();
	}
};
