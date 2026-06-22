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

		status: {
			type: String,
			enum: ['active', 'inactive', 'exited'],
			default: 'active',
		},

		joinDate: {
			type: Date,
			default: Date.now,
		},

		exitDate: Date,
	},
	{ timestamps: true },
);

export default mongoose.model('Shareholder', shareholderSchema);
