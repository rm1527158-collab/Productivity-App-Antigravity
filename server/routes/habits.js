const express = require('express');
const router = express.Router();
const habitController = require('../controllers/habitController');

// GET /habits
router.get('/', habitController.getHabits);

// GET /habits/occurrences
router.get('/occurrences', habitController.getOccurrences);

// POST /habits
router.post('/', habitController.createHabit);

// POST /habits/:id/mark
router.post('/:id/mark', habitController.markHabit);

// GET /habits/streaks
router.get('/streaks', habitController.getStreaks);

// DELETE /habits/:id
router.delete('/:id', habitController.deleteHabit);

module.exports = router;
