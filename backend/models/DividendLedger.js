import mongoose from 'mongoose';

const dividendLedgerSchema = new mongoose.Schema(
	{
		shareholder: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Shareholder',
			required: true,
		},

		year: Number,

		month: Number,

		percentage: Number,

		investmentAmount: Number,

		dividendAmount: Number,

		cumulativeDividend: Number,

		description: String,
	},
	{ timestamps: true },
);

dividendLedgerSchema.index(
	{
		shareholder: 1,
		year: 1,
		month: 1,
	},
	{
		unique: true,
	},
);

export default mongoose.model('DividendLedger', dividendLedgerSchema);
