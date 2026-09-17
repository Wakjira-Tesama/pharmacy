const express = require('express');
const router = express.Router();
const salesController = require('../controllers/sales.controller');
const { authenticate, authorizeRole } = require('../middleware/auth.middleware');

router.post('/', authenticate, authorizeRole('ADMIN', 'PHARMACIST'), salesController.processSale);

module.exports = router;
