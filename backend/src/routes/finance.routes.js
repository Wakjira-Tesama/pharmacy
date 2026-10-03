const express = require('express');
const router = express.Router();
const financeController = require('../controllers/finance.controller');
const { authenticate, authorizeRole } = require('../middleware/auth.middleware');

router.post('/expenses', authenticate, authorizeRole('ADMIN'), financeController.recordExpense);
router.put('/expenses/:id', authenticate, authorizeRole('ADMIN'), financeController.updateExpense);
router.delete('/expenses/:id', authenticate, authorizeRole('ADMIN'), financeController.deleteExpense);
router.get('/expenses', authenticate, authorizeRole('ADMIN', 'PHARMACIST'), financeController.getExpenses);
router.get('/income', authenticate, authorizeRole('ADMIN', 'PHARMACIST'), financeController.getIncome);
router.get('/daily', authenticate, authorizeRole('ADMIN', 'PHARMACIST'), financeController.getDailyFinance);

module.exports = router;
