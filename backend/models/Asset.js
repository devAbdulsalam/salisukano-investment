import mongoose from 'mongoose';

const AgentSchema = new mongoose.Schema(
	{
		name: { type: String, default: '' },
		phone: { type: String, default: '' },
		address: { type: String, default: '' },
	},
	{ _id: false },
);

const ValuationSchema = new mongoose.Schema(
	{
		valuation: { type: Number, required: true },
		valuationDate: { type: Date, required: true },
		remark: { type: String, default: '' },
	},
	{ timestamps: true },
);

const MaintenanceSchema = new mongoose.Schema(
	{
		cost: { type: Number, required: true },
		date: { type: Date, required: true },
		remark: { type: String, default: '' },
	},
	{ timestamps: true },
);

const AssetSchema = new mongoose.Schema(
	{
		serialNumber: {
			type: String,
			unique: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			default: '',
		},
		// Price of purchase
		purchasePrice: {
			type: Number,
			required: true,
			min: 0,
		},
		// Date of purchase
		purchaseDate: {
			type: Date,
			required: true,
		},
		agent: {
			type: AgentSchema,
			default: () => ({}),
		},
		valuations: {
			type: [ValuationSchema],
			default: [],
		},
		maintenances: {
			type: [MaintenanceSchema],
			default: [],
		},
		status: {
			type: String,
			enum: ['active', 'under_maintenance', 'disposed', 'sold'],
			default: 'active',
		},
		// Sale price — set when asset is sold
		salePrice: {
			type: Number,
			default: null,
		},
		saleDate: {
			type: Date,
			default: null,
		},
	},
	{ timestamps: true },
);

// Virtual: total maintenance cost
AssetSchema.virtual('totalMaintenanceCost').get(function () {
	return this.maintenances.reduce((sum, m) => sum + m.cost, 0);
});

// Virtual: total cost (purchase + all maintenance)
AssetSchema.virtual('totalCost').get(function () {
	return this.purchasePrice + this.maintenances.reduce((sum, m) => sum + m.cost, 0);
});

// Virtual: latest valuation
AssetSchema.virtual('currentValuation').get(function () {
	if (!this.valuations.length) return null;
	return [...this.valuations].sort(
		(a, b) => new Date(b.valuationDate) - new Date(a.valuationDate),
	)[0].valuation;
});

// Virtual: margin — based on latest valuation (or sale price) minus total cost
AssetSchema.virtual('margin').get(function () {
	const totalCost = this.purchasePrice + this.maintenances.reduce((sum, m) => sum + m.cost, 0);
	const realisedValue = this.salePrice ?? this.currentValuation;
	if (realisedValue == null) return null;
	return realisedValue - totalCost;
});

// Virtual: margin percentage
AssetSchema.virtual('marginPercent').get(function () {
	const totalCost = this.purchasePrice + this.maintenances.reduce((sum, m) => sum + m.cost, 0);
	const realisedValue = this.salePrice ?? this.currentValuation;
	if (realisedValue == null || totalCost === 0) return null;
	return ((realisedValue - totalCost) / totalCost) * 100;
});

AssetSchema.set('toJSON', { virtuals: true });
AssetSchema.set('toObject', { virtuals: true });

const Asset = mongoose.model('Asset', AssetSchema);
export default Asset;
