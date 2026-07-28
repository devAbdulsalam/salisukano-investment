import express from 'express';
const router = express.Router();
router.get('/', async (req, res) => {
	try {
		return res
			.status(200)
			.json({ status: 'success', message: 'Server is up and running' });
	} catch (error) {
		res.status(500).json({
			status: 'error',
			message: `Something went wrong: ${error?.message}`,
		});
	}
});

export default router;
