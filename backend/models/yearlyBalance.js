import mongoose from 'mongoose';

const yearlyBalanceSchema = new mongoose.Schema({
	shareholder: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Shareholder',
	},

	year: Number,

	openingBalance: Number,

	closingBalance: Number,

	totalDividend: Number,

	totalDeposits: Number,

	totalWithdrawals: Number,
});

export default mongoose.model('YearlyBalance', yearlyBalanceSchema);
