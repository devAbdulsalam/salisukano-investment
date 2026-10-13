import express from 'express';
import {
	getReconciliations,
	getReconciliation,
	createReconciliation,
	updateReconciliation,
	deleteReconciliation,
} from '../controllers/reconciliation.js';

const router = express.Router();

router.get('/:customerId', getReconciliations);
router.get('/detail/:id', getReconciliation);
router.post('/', createReconciliation);
router.put('/:id', updateReconciliation);
router.delete('/:id', deleteReconciliation);

export default router;
