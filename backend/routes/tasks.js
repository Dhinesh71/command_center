const express = require('express');
const router = express.Router();

// GET /api/tracker/tasks
router.get('/', (req, res) => {
    res.json({
        success: true,
        data: [],
        message: 'Tasks endpoint placeholder. Fetch from Supabase directly.'
    });
});

// POST /api/tracker/tasks
router.post('/', (req, res) => {
    res.json({
        success: true,
        message: 'Task creation endpoint placeholder.'
    });
});

module.exports = router;
