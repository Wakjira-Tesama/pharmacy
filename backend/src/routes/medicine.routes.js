const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicine.controller');
const { authenticate, authorizeRole } = require('../middleware/auth.middleware');

router.get('/', authenticate, medicineController.getAllMedicines);
router.get('/:id', authenticate, medicineController.getMedicineById);
// Only Admin and Pharmacist can create medicines
router.post('/', authenticate, authorizeRole('ADMIN', 'PHARMACIST'), medicineController.createMedicine);

module.exports = router;
