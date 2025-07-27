const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();
const isHRManager = authorizeRoles('admin', 'hr_manager');

// Get all tasks with pagination, search, and filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', assigned_to = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (t.title LIKE ? OR t.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      whereClause += ' AND t.status = ?';
      params.push(status);
    }

    if (assigned_to) {
      whereClause += ' AND t.assigned_to = ?';
      params.push(assigned_to);
    }

    // Get total count
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM tasks t ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get tasks with employee and user names
    const [tasks] = await db.query(
      `SELECT t.*, 
              CONCAT(e.first_name, ' ', e.last_name) as assigned_to_name,
              CONCAT(u.first_name, ' ', u.last_name) as assigned_by_name
       FROM tasks t
       LEFT JOIN employees e ON t.assigned_to = e.id
       LEFT JOIN users u ON t.assigned_by = u.id
       ${whereClause}
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tasks' });
  }
});

// Get task by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [tasks] = await db.query(
      `SELECT t.*, 
              CONCAT(e.first_name, ' ', e.last_name) as assigned_to_name,
              CONCAT(u.first_name, ' ', u.last_name) as assigned_by_name
       FROM tasks t
       LEFT JOIN employees e ON t.assigned_to = e.id
       LEFT JOIN users u ON t.assigned_by = u.id
       WHERE t.id = ?`,
      [id]
    );

    if (tasks.length === 0) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    res.json({ success: true, data: tasks[0] });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch task' });
  }
});

// Create new task
router.post('/', authenticateToken, isHRManager, [
  body('title').notEmpty().withMessage('Title is required'),
  body('assigned_to').isInt().withMessage('Assigned to must be a valid employee ID'),
  body('status').isIn(['pending', 'in_progress', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('due_date').optional().isDate().withMessage('Due date must be a valid date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { title, description, assigned_to, status, due_date } = req.body;
    const assigned_by = req.user.id;

    // Check if employee exists
    const [employees] = await db.query('SELECT id FROM employees WHERE id = ?', [assigned_to]);
    if (employees.length === 0) {
      return res.status(400).json({ success: false, error: 'Employee not found' });
    }

    const [result] = await db.query(
      'INSERT INTO tasks (title, description, assigned_to, assigned_by, status, due_date) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description, assigned_to, assigned_by, status, due_date]
    );

    const [newTask] = await db.query(
      `SELECT t.*, 
              CONCAT(e.first_name, ' ', e.last_name) as assigned_to_name,
              CONCAT(u.first_name, ' ', u.last_name) as assigned_by_name
       FROM tasks t
       LEFT JOIN employees e ON t.assigned_to = e.id
       LEFT JOIN users u ON t.assigned_by = u.id
       WHERE t.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ success: true, task: newTask[0] });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ success: false, error: 'Failed to create task' });
  }
});

// Update task
router.put('/:id', authenticateToken, isHRManager, [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('status').optional().isIn(['pending', 'in_progress', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('due_date').optional().isDate().withMessage('Due date must be a valid date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { title, description, assigned_to, status, due_date } = req.body;

    // Check if task exists
    const [existingTasks] = await db.query('SELECT id FROM tasks WHERE id = ?', [id]);
    if (existingTasks.length === 0) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    // Check if employee exists if assigned_to is provided
    if (assigned_to) {
      const [employees] = await db.query('SELECT id FROM employees WHERE id = ?', [assigned_to]);
      if (employees.length === 0) {
        return res.status(400).json({ success: false, error: 'Employee not found' });
      }
    }

    const updateFields = [];
    const updateValues = [];

    if (title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(title);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (assigned_to !== undefined) {
      updateFields.push('assigned_to = ?');
      updateValues.push(assigned_to);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }
    if (due_date !== undefined) {
      updateFields.push('due_date = ?');
      updateValues.push(due_date);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    updateValues.push(id);
    await db.query(`UPDATE tasks SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);

    const [updatedTask] = await db.query(
      `SELECT t.*, 
              CONCAT(e.first_name, ' ', e.last_name) as assigned_to_name,
              CONCAT(u.first_name, ' ', u.last_name) as assigned_by_name
       FROM tasks t
       LEFT JOIN employees e ON t.assigned_to = e.id
       LEFT JOIN users u ON t.assigned_by = u.id
       WHERE t.id = ?`,
      [id]
    );

    res.json({ success: true, data: updatedTask[0] });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ success: false, error: 'Failed to update task' });
  }
});

// Delete task
router.delete('/:id', authenticateToken, isHRManager, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query('DELETE FROM tasks WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ success: false, error: 'Failed to delete task' });
  }
});

// Get task statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
      FROM tasks
    `);

    res.json({ success: true, data: stats[0] });
  } catch (error) {
    console.error('Error fetching task stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch task statistics' });
  }
});

module.exports = router; 