import express from 'express';
import {
	getExpenses,
	getExpense,
	getMonthlyExpenses,
	createExpense,
	editExpense,
	deleteExpense,
} from '../controllers/expense.js';
import { protect } from '../middleware/requireAuth.js';

const router = express.Router();

router.get('/monthly', getMonthlyExpenses);
router.get('/', getExpenses);
router.get('/:id', getExpense);
router.post('/', createExpense);
router.patch('/:id', protect, editExpense);
router.delete('/:id', protect, deleteExpense);

export default router;
