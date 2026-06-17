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

export default mongoose.model('DividendLedger', dividendLedgerSchema);
