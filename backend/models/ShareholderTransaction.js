import mongoose from 'mongoose';

const shareholderTransactionSchema = new mongoose.Schema(
	{
		shareholder: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Shareholder',
			required: true,
		},

		type: {
			type: String,
			enum: ['opening', 'topup', 'withdrawal'],
			required: true,
		},

		amount: {
			type: Number,
			required: true,
		},

		description: String,

		transactionDate: {
			type: Date,
			required: true,
		},

		effectiveMonth: Number,
		effectiveYear: Number,
	},
	{ timestamps: true },
);

shareholderTransactionSchema.index({
	shareholder: 1,
	effectiveYear: 1,
	effectiveMonth: 1,
	type: 1,
});

export default mongoose.model(
	'ShareholderTransaction',
	shareholderTransactionSchema,
);
