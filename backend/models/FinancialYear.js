import mongoose from 'mongoose';

const financialYearSchema = new mongoose.Schema(
	{
		shareholderId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Shareholder',
			required: true,
		},

		year: {
			type: Number,
			required: true,
		},

		openingBalance: {
			type: Number,
			default: 0,
		},

		currentInvestment: {
			type: Number,
			default: 0,
		},

		totalWithdrawal: {
			type: Number,
			default: 0,
		},

		totalDividendEarned: {
			type: Number,
			default: 0,
		},

		totalDividendPaid: {
			type: Number,
			default: 0,
		},

		closingBalance: {
			type: Number,
			default: 0,
		},

		status: {
			type: String,
			enum: ['active', 'inactive', 'exited'],
			default: 'active',
		},
	},
	{ timestamps: true },
);

financialYearSchema.index(
	{
		shareholderId: 1,
		year: 1,
	},
	{
		unique: true,
	},
);

export default mongoose.model('FinancialYear', financialYearSchema);
