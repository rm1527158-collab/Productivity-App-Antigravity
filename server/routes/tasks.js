const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

// GET /tasks
router.get('/', taskController.getTasks);

// POST /tasks
router.post('/', taskController.createTask);

// PUT /tasks/:id
router.put('/:id', taskController.updateTask);

// PATCH /tasks/:id/reorder
router.patch('/:id/reorder', taskController.reorderTask);

// POST /tasks/rollover
router.post('/rollover', taskController.rolloverTasks);

// DELETE /tasks/:id
router.delete('/:id', taskController.deleteTask);

module.exports = router;
