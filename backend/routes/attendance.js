const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();
const isHRManager = authorizeRoles('admin', 'hr_manager');

// Get all attendance records with pagination, search, and filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, employee_id = '', date = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (employee_id) {
      whereClause += ' AND a.employee_id = ?';
      params.push(employee_id);
    }

    if (date) {
      whereClause += ' AND a.date = ?';
      params.push(date);
    }

    if (status) {
      whereClause += ' AND a.status = ?';
      params.push(status);
    }

    // Get total count
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM attendance a ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get attendance records with employee names
                    const [attendance] = await db.query(
                  `SELECT a.*, CONCAT(e.first_name, ' ', e.last_name) as employee_name
                   FROM attendance a
                   LEFT JOIN employees e ON a.employee_id = e.id
                   ${whereClause}
                   ORDER BY a.date DESC, a.created_at DESC
                   LIMIT ? OFFSET ?`,
                  [...params, parseInt(limit), offset]
                );

    res.json({
      success: true,
      data: {
        attendance,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch attendance records' });
  }
});

// Get attendance record by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
                    const [attendance] = await db.query(
                  `SELECT a.*, CONCAT(e.first_name, ' ', e.last_name) as employee_name
                   FROM attendance a
                   LEFT JOIN employees e ON a.employee_id = e.id
                   WHERE a.id = ?`,
                  [id]
                );

    if (attendance.length === 0) {
      return res.status(404).json({ success: false, error: 'Attendance record not found' });
    }

    res.json({ success: true, data: attendance[0] });
  } catch (error) {
    console.error('Error fetching attendance record:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch attendance record' });
  }
});

// Create new attendance record
router.post('/', authenticateToken, isHRManager, [
  body('employee_id').isInt().withMessage('Employee ID is required'),
  body('date').isDate().withMessage('Date is required'),
  body('status').isIn(['present', 'absent', 'leave', 'late']).withMessage('Invalid status'),
  body('check_in').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Check-in time must be in HH:MM format'),
  body('check_out').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Check-out time must be in HH:MM format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { employee_id, date, status, check_in, check_out, remarks } = req.body;

    // Check if employee exists
    const [employees] = await db.query('SELECT id FROM employees WHERE id = ?', [employee_id]);
    if (employees.length === 0) {
      return res.status(400).json({ success: false, error: 'Employee not found' });
    }

    // Check if attendance record already exists for this employee and date
    const [existingRecords] = await db.query(
      'SELECT id FROM attendance WHERE employee_id = ? AND date = ?',
      [employee_id, date]
    );
    if (existingRecords.length > 0) {
      return res.status(400).json({ success: false, error: 'Attendance record already exists for this employee and date' });
    }

    const [result] = await db.query(
      'INSERT INTO attendance (employee_id, date, status, check_in, check_out, remarks) VALUES (?, ?, ?, ?, ?, ?)',
      [employee_id, date, status, check_in, check_out, remarks]
    );

                    const [newAttendance] = await db.query(
                  `SELECT a.*, CONCAT(e.first_name, ' ', e.last_name) as employee_name
                   FROM attendance a
                   LEFT JOIN employees e ON a.employee_id = e.id
                   WHERE a.id = ?`,
                  [result.insertId]
                );

    res.status(201).json({ success: true, attendance: newAttendance[0] });
  } catch (error) {
    console.error('Error creating attendance record:', error);
    res.status(500).json({ success: false, error: 'Failed to create attendance record' });
  }
});

// Update attendance record
router.put('/:id', authenticateToken, isHRManager, [
  body('status').optional().isIn(['present', 'absent', 'leave', 'late']).withMessage('Invalid status'),
  body('check_in').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Check-in time must be in HH:MM format'),
  body('check_out').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Check-out time must be in HH:MM format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { status, check_in, check_out, remarks } = req.body;

    // Check if attendance record exists
    const [existingRecords] = await db.query('SELECT id FROM attendance WHERE id = ?', [id]);
    if (existingRecords.length === 0) {
      return res.status(404).json({ success: false, error: 'Attendance record not found' });
    }

    const updateFields = [];
    const updateValues = [];

    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }
    if (check_in !== undefined) {
      updateFields.push('check_in = ?');
      updateValues.push(check_in);
    }
    if (check_out !== undefined) {
      updateFields.push('check_out = ?');
      updateValues.push(check_out);
    }
    if (remarks !== undefined) {
      updateFields.push('remarks = ?');
      updateValues.push(remarks);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    updateValues.push(id);
    await db.query(`UPDATE attendance SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);

                    const [updatedAttendance] = await db.query(
                  `SELECT a.*, CONCAT(e.first_name, ' ', e.last_name) as employee_name
                   FROM attendance a
                   LEFT JOIN employees e ON a.employee_id = e.id
                   WHERE a.id = ?`,
                  [id]
                );

    res.json({ success: true, data: updatedAttendance[0] });
  } catch (error) {
    console.error('Error updating attendance record:', error);
    res.status(500).json({ success: false, error: 'Failed to update attendance record' });
  }
});

// Delete attendance record
router.delete('/:id', authenticateToken, isHRManager, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query('DELETE FROM attendance WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Attendance record not found' });
    }

    res.json({ success: true, message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error('Error deleting attendance record:', error);
    res.status(500).json({ success: false, error: 'Failed to delete attendance record' });
  }
});

// Get attendance statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const { employee_id } = req.query;
    
    let whereClause = '';
    const params = [];
    
    if (employee_id) {
      whereClause = 'WHERE employee_id = ?';
      params.push(employee_id);
    }

    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_days,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
        SUM(CASE WHEN status = 'leave' THEN 1 ELSE 0 END) as leave_days,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days,
        ROUND((SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as attendance_rate
      FROM attendance
      ${whereClause}
    `, params);

    res.json({ success: true, data: stats[0] });
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch attendance statistics' });
  }
});

module.exports = router; 