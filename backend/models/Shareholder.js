import mongoose from 'mongoose';

const shareholderSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		phone: String,
		email: String,
		address: String,

		openingBalance: {
			type: Number,
			required: true,
			default: 0,
		},

		currentInvestment: {
			type: Number,
			default: 0,
		},

		totalDividendEarned: {
			type: Number,
			default: 0,
		},

		status: {
			type: String,
			enum: ['active', 'inactive'],
			default: 'active',
		},
		date: {
			type: Date,
			default: Date.now,
		},
	},
	{ timestamps: true },
);

export default mongoose.model('Shareholder', shareholderSchema);
