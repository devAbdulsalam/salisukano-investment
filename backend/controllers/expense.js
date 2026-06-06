import Expense from '../models/Expense.js';

export const getExpenses = async (req, res) => {
	try {
		const expenses = await Expense.find().sort({ date: 1 });
		res.status(200).json(expenses);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Internal Server Error' });
	}
};

export const getExpense = async (req, res) => {
	const { id } = req.params;
	try {
		const expense = await Expense.findById(id);
		if (!expense) {
			return res.status(404).json({ message: 'Expense not found' });
		}
		res.status(200).json(expense);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Internal Server Error' });
	}
};

export const createExpense = async (req, res) => {
	try {
		const { amount, date, description } = req.body;
		const serialNumber = `EXP-${Date.now()}`;
		const expense = new Expense({
			serialNumber,
			amount,
			date: new Date(date),
			description,
		});
		await expense.save();
		res.status(201).json(expense);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Internal Server Error' });
	}
};

export const editExpense = async (req, res) => {
	const { id } = req.params;
	const { amount, date, description } = req.body;
	try {
		const expense = await Expense.findById(id);
		if (!expense) {
			return res.status(404).json({ message: 'Expense not found' });
		}
		expense.amount = amount;
		expense.date = date;
		expense.description = description;
		await expense.save();
		res.status(200).json(expense);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Internal Server Error' });
	}
};

export const deleteExpense = async (req, res) => {
	const { id } = req.params;
	try {
		const expense = await Expense.findById(id);
		if (!expense) {
			return res.status(404).json({ message: 'Expense not found' });
		}
		await Expense.findByIdAndDelete(id);
		res.status(200).json({ message: 'Expense deleted successfully' });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Internal Server Error' });
	}
};
