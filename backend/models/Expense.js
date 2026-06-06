import mongoose, { Schema } from 'mongoose';

const ExpenseSchema = new mongoose.Schema(
	{
		serialNumber: {
			type: String,
			default: '',
		},
		amount: {
			type: Number,
			default: 0,
		},
		date: {
			type: Date,
			default: Date.now, // Set to current date by default
		},
		description: {
			type: String,
			default: '',
		},
	},
	{ timestamps: true },
);

const Expense = mongoose.model('Expense', ExpenseSchema);
export default Expense;
