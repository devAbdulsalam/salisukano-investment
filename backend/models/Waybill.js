// models/Waybill.js
import mongoose from 'mongoose';

const WaybillSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
		},
		destination: {
			type: String,
		},
		timeIn: {
			type: String,
		},
		timeOut: {
			type: String,
		},
		vehicle: {
			type: String,
		},
		note: {
			type: String,
		},
		items: [
			{
				sn: {
					type: String,
				},
				description: {
					type: String,
				},
				qty: {
					type: Number,
					required: true,
					default: 0,
				},
				rate: {
					type: Number,
					required: true,
					default: 0,
				},
				amount: {
					type: Number,
					required: true,
					default: 0,
				},
			},
		],
		total: {
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

const Waybill = mongoose.model('Waybill', WaybillSchema);
export default Waybill;
