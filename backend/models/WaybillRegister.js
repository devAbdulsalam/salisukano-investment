// models/Waybill.js
import mongoose from 'mongoose';

const WaybillRegisterSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
		},
		vehicle: {
			type: String,
		},
		note: {
			type: String,
		},
		gross: {
			type: Number,
			default: 0,
			required: true,
		},
		dust: {
			type: Number,
			default: 0,
		},
		tare: {
			type: Number,
			default: 0,
		},
		// total of net = gross - dust - tare
		net: {
			type: Number,
			default: 0,
			required: true,
		},
		date: {
			type: Date,
			default: Date.now,
		},
	},
	{ timestamps: true },
);
WaybillRegisterSchema.pre('save', function (next) {
	this.net = Number(this.gross) - Number(this.tare) - Number(this.dust);
	next();
});
const WaybillRegister = mongoose.model(
	'WaybillRegister',
	WaybillRegisterSchema,
);
export default WaybillRegister;
