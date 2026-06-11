import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
	{
		key: { type: String, required: true, unique: true },
		value: { type: mongoose.Schema.Types.Mixed, required: true },
	},
	{ timestamps: true },
);

const Setting = mongoose.model('Setting', settingSchema);

// Helper to get zakat rate (default 0.1 = 10%)
export const getZakatRate = async () => {
	let setting = await Setting.findOne({ key: 'zakatRate' });
	if (!setting) {
		setting = await Setting.create({ key: 'zakatRate', value: 0.1 });
	}
	return setting.value;
};

export const setZakatRate = async (rate) => {
	return await Setting.findOneAndUpdate(
		{ key: 'zakatRate' },
		{ value: rate },
		{ upsert: true, new: true },
	);
};

export default Setting;
