const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const { authenticate, authorizeRole } = require('../middleware/auth.middleware');

router.get('/', authenticate, authorizeRole('ADMIN'), usersController.getAllUsers);
router.put('/:id/status', authenticate, authorizeRole('ADMIN'), usersController.toggleUserStatus);

module.exports = router;
