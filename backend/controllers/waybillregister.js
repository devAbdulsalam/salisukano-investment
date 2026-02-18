import WaybillRegister from '../models/WaybillRegister.js';

/**
 * @desc    Create Waybill
 * @route   POST /api/waybills
 */
export const createWaybill = async (req, res) => {
	try {
		const {
			name,
			vehicle,
			gross = 0,
			dust = 0,
			tare = 0,
			date,
			note,
		} = req.body;

		// Calculate gross automatically
		const net = Number(gross) - Number(dust) - Number(tare);

		const waybill = await WaybillRegister.create({
			name,
			vehicle,
			net,
			dust,
			tare,
			gross,
			date,
			note,
		});

		res.status(201).json({
			success: true,
			message: 'Waybill created successfully',
			data: waybill,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

/**
 * @desc    Get All Waybills (with pagination + filtering)
 * @route   GET /api/waybills
 */
export const getWaybills = async (req, res) => {
	try {
		const { page = 1, limit = 10, name, from, to } = req.query;

		const filter = {};

		// Filter by name
		if (name) {
			filter.name = { $regex: name, $options: 'i' };
		}

		// Filter by date range
		if (from && to) {
			filter.date = {
				$gte: new Date(from),
				$lte: new Date(to),
			};
		}

		const waybills = await WaybillRegister.find(filter)
			.sort({ createdAt: -1 })
			.skip((page - 1) * limit)
			.limit(Number(limit));

		const total = await WaybillRegister.countDocuments(filter);

		res.status(200).json({
			success: true,
			total,
			page: Number(page),
			pages: Math.ceil(total / limit),
			data: waybills,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

/**
 * @desc    Get Single Waybill
 * @route   GET /api/waybills/:id
 */
export const getWaybill = async (req, res) => {
	try {
		const waybill = await WaybillRegister.findById(req.params.id);

		if (!waybill) {
			return res.status(404).json({
				success: false,
				message: 'Waybill not found',
			});
		}

		res.status(200).json({
			success: true,
			data: waybill,
		});
	} catch (error) {
		console.log('Error getting waybill', error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

/**
 * @desc    Update Waybill
 * @route   PUT /api/waybills/:id
 */
export const updateWaybill = async (req, res) => {
	try {
		const { net = 0, dust = 0, tare = 0 } = req.body;

		const waybill = await WaybillRegister.findById(req.params.id);

		if (!waybill) {
			return res.status(404).json({
				success: false,
				message: 'Waybill not found',
			});
		}

		// Update fields
		Object.assign(waybill, req.body);

		// Recalculate gross if weight fields are updated
		waybill.gross =
			Number(waybill.net) + Number(waybill.dust) + Number(waybill.tare);

		await waybill.save();

		res.status(200).json({
			success: true,
			message: 'Waybill updated successfully',
			data: waybill,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

/**
 * @desc    Delete Waybill
 * @route   DELETE /api/waybills/:id
 */
export const deleteWaybill = async (req, res) => {
	try {
		const waybill = await WaybillRegister.findById(req.params.id);

		if (!waybill) {
			return res.status(404).json({
				success: false,
				message: 'Waybill not found',
			});
		}

		await waybill.deleteOne();

		res.status(200).json({
			success: true,
			message: 'Waybill deleted successfully',
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};
