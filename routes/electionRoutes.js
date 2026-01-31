const express = require('express');
const router = express.Router();
const { createElection, getElections, getElectionById, castVote, updateElectionStatus, updateElection } = require('../controllers/electionController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(getElections)
    .post(protect, admin, createElection);

router.route('/:id')
    .get(getElectionById)
    .put(protect, admin, updateElection);

router.route('/vote').post(protect, castVote);
router.route('/:id/status').put(protect, admin, updateElectionStatus);

module.exports = router;
