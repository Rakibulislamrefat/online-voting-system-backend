const express = require('express');
const router = express.Router();
const { createElection, getElections, getElectionById, castVote } = require('../controllers/electionController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(getElections)
    .post(protect, admin, createElection);

router.route('/:id').get(getElectionById);

router.route('/vote').post(protect, castVote);

module.exports = router;
