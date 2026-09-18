const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/dashboard', authenticate, reportsController.getDashboardStats);

module.exports = router;
