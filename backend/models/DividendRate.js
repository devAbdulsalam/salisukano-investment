import mongoose from 'mongoose';

const dividendRateSchema = new mongoose.Schema(
	{
		year: {
			type: Number,
			required: true,
		},

		month: {
			type: Number,
			required: true, // 1-12
		},

		percentage: {
			type: Number,
			required: true,
		},

		description: String,
		status: {
			type: String,
			enum: ['pending', 'processing', 'completed'],
			default: 'pending',
		},

		processedAt: Date,
	},
	{ timestamps: true },
);

dividendRateSchema.index({ year: 1, month: 1 }, { unique: true });

export default mongoose.model('DividendRate', dividendRateSchema);
