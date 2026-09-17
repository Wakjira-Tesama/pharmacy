const express = require('express');
const router = express.Router();
const financeController = require('../controllers/finance.controller');
const { authenticate, authorizeRole } = require('../middleware/auth.middleware');

router.post('/expenses', authenticate, authorizeRole('ADMIN'), financeController.recordExpense);
router.get('/daily', authenticate, authorizeRole('ADMIN', 'PHARMACIST'), financeController.getDailyFinance);

module.exports = router;
