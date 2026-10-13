import mongoose, { Schema } from 'mongoose';

const AdvanceTransactionSchema = new mongoose.Schema(
	{
		date: {
			type: Date,
			required: true,
		},
		description: {
			type: String,
			default: '',
		},
		remark: {
			type: String,
			default: '',
		},
		credit: {
			type: Number,
			default: 0,
		},
		debit: {
			type: Number,
			default: 0,
		},
		balance: {
			type: Number,
			default: 0,
		},
	},
	{ timestamps: true }
);

const AdvanceAccountSchema = new mongoose.Schema(
	{
		customerId: {
			type: Schema.Types.ObjectId,
			ref: 'Customer',
			required: true,
			unique: true,
		},
		balance: {
			type: Number,
			default: 0,
		},
		transactions: [AdvanceTransactionSchema],
	},
	{ timestamps: true }
);

const AdvanceAccount = mongoose.model('AdvanceAccount', AdvanceAccountSchema);
export default AdvanceAccount;
