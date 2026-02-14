// controllers/waybillController.js
import Waybill from '../models/Waybill.js';

// @desc    Create a new waybill
// @route   POST /api/waybills
// @access  Private (adjust as needed)
export const createWaybill = async (req, res) => {
	try {
		const { name, destination, timeIn, timeOut, vehicle, items, total, date } =
			req.body;

		// Basic validation
		if (!name) {
			return res.status(400).json({ message: 'Customer name is required' });
		}

		const waybill = new Waybill({
			name,
			destination,
			timeIn,
			timeOut,
			vehicle,
			items: items || [],
			total: total || 0,
			date: date || Date.now(),
		});

		const savedWaybill = await waybill.save();
		res.status(201).json(savedWaybill);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// @desc    Get all waybills
// @route   GET /api/waybills
// @access  Private
export const getWaybills = async (req, res) => {
	try {
		const waybills = await Waybill.find().sort({ createdAt: -1 });
		res.status(200).json(waybills);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// @desc    Get a single waybill by ID
// @route   GET /api/waybills/:id
// @access  Private
export const getWaybill = async (req, res) => {
	try {
		const waybill = await Waybill.findById(req.params.id);
		if (!waybill) {
			return res.status(404).json({ message: 'Waybill not found' });
		}
		res.status(200).json(waybill);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// @desc    Update a waybill
// @route   PUT /api/waybills/:id
// @access  Private
export const updateWaybill = async (req, res) => {
	try {
		const { name, destination, timeIn, timeOut, vehicle, items, total, date } =
			req.body;

		const waybill = await Waybill.findById(req.params.id);
		if (!waybill) {
			return res.status(404).json({ message: 'Waybill not found' });
		}

		// Update fields
		waybill.name = name || waybill.name;
		waybill.destination = destination || waybill.destination;
		waybill.timeIn = timeIn || waybill.timeIn;
		waybill.timeOut = timeOut || waybill.timeOut;
		waybill.vehicle = vehicle || waybill.vehicle;
		waybill.items = items || waybill.items;
		waybill.total = total !== undefined ? total : waybill.total;
		waybill.date = date || waybill.date;

		const updatedWaybill = await waybill.save();
		res.status(200).json(updatedWaybill);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// @desc    Delete a waybill
// @route   DELETE /api/waybills/:id
// @access  Private
export const deleteWaybill = async (req, res) => {
	try {
		const waybill = await Waybill.findById(req.params.id);
		if (!waybill) {
			return res.status(404).json({ message: 'Waybill not found' });
		}

		await waybill.deleteOne();
		res.status(200).json({ message: 'Waybill deleted successfully' });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};
