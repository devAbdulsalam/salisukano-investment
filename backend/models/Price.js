import mongoose, { Schema } from 'mongoose';
const PriceSchema = new mongoose.Schema(
	{
		customerId: {
			type: Schema.Types.ObjectId,
			ref: 'Customer',
			required: true,
		},
		oldMix: {
			type: Number,
			default: 0,
		},
		oldCast: {
			type: Number,
			default: 0,
		},
		oldSpecial: {
			type: Number,
			default: 0,
		},
		oldBundle: {
			type: Number,
			default: 0,
		},
		newMix: {
			type: Number,
			default: 0,
		},
		newCast: {
			type: Number,
			default: 0,
		},
		newSpecial: {
			type: Number,
			default: 0,
		},
		newBundle: {
			type: Number,
			default: 0,
		},
		date: {
			type: Date,
			default: Date.now, // Set to current date by default
		},
	},
	{ timestamps: true },
);

const Price = mongoose.model('Price', PriceSchema);

export default Price;
