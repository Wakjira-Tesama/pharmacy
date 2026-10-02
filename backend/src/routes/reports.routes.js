const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');
const { authenticate, authorizeRole } = require('../middleware/auth.middleware');

router.get('/dashboard', authenticate, reportsController.getDashboardStats);
router.get('/period', authenticate, authorizeRole('ADMIN'), reportsController.getPeriodReport);

module.exports = router;
