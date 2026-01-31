const express = require('express');
const router = express.Router();
const { authAdmin, registerAdmin, getPendingVoters, getAllVoters, approveVoter } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/login', authAdmin);
router.post('/register', registerAdmin); // Seed route

router.get('/voters/pending', protect, admin, getPendingVoters);
router.get('/voters', protect, admin, getAllVoters);
router.put('/voters/:id/approve', protect, admin, approveVoter);

module.exports = router;
