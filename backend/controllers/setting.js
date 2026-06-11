import { getZakatRate, setZakatRate } from '../models/Setting.js';

// @desc    Get current zakat rate
// @route   GET /api/settings/zakat-rate
export const getZakatRateHandler = async (req, res) => {
	try {
		const rate = await getZakatRate();
		res.json({ zakatRate: rate });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// @desc    Update zakat rate
// @route   PUT /api/settings/zakat-rate
export const updateZakatRate = async (req, res) => {
	try {
		const { rate } = req.body;
		if (typeof rate !== 'number' || rate < 0 || rate > 1) {
			return res
				.status(400)
				.json({ message: 'Rate must be a number between 0 and 1' });
		}
		const setting = await setZakatRate(rate);
		res.json({ zakatRate: setting.value });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};
