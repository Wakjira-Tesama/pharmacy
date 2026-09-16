const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stock.controller');
const { authenticate, authorizeRole } = require('../middleware/auth.middleware');

router.get('/inventory', authenticate, stockController.getInventory);
router.post('/in', authenticate, authorizeRole('ADMIN', 'PHARMACIST'), stockController.stockIn);

module.exports = router;
