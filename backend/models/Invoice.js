import mongoose from 'mongoose';

// const ItemSchema = new mongoose.Schema({
// 	type: { type: String, enum: ['Mix', 'Cast', 'Special', Bundle], required: true },
// 	weight: { type: Number, required: true },
// 	rate: { type: Number, required: true },
// 	amount: { type: Number, required: true },
// });

// const InvoiceSchema = new mongoose.Schema(
// 	{
// 		date: { type: Date, required: true },
// 		vehicle: { type: String, required: true },
// 		customer: { type: String, required: true },
// 		items: [ItemSchema],
// 		total: { type: Number, required: true },
// 		others: [
//     { expenses: [{ type: Number, required: true }, type: debit}]},
// { deposit: [{ type: Number, required: true }, type: credit}]},
// 		],
// 		balance: { type: Number, required: true },
// 	},
// 	{ timestamps: true }
// );

const ItemSchema = new mongoose.Schema({
	type: {
		type: String,
		required: true,
		enum: ['Mix', 'Cast', 'Special', 'Bundle'],
	},
	weight: {
		type: Number,
		required: true,
	},
	rate: {
		type: Number,
		required: true,
	},
	amount: {
		type: Number,
		required: true,
	},
});

const InvoiceSchema = new mongoose.Schema({
	date: {
		type: Date,
		required: true,
		default: Date.now,
	},
	vehicleNumber: {
		type: String,
		required: true,
	},
	customerName: {
		type: String,
		required: true,
	},
	items: [ItemSchema],
	total: {
		type: Number,
		required: true,
	},
	less: {
		expenses: {
			type: Number,
			default: 0,
		},
		deposit: {
			type: Number,
			default: 0,
		},
	},
	balance: {
		type: Number,
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	rawText: {
		type: String,
	},
});

const Invoice = mongoose.model('Invoice', InvoiceSchema);

export default Invoice;
