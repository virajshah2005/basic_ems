const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();
const isHRManager = authorizeRoles('admin', 'hr_manager');

// Get all payroll records with pagination, search, and filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, employee_id = '', month = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (employee_id) {
      whereClause += ' AND p.employee_id = ?';
      params.push(employee_id);
    }

    if (month) {
      whereClause += ' AND p.month = ?';
      params.push(month);
    }

    if (status) {
      whereClause += ' AND p.status = ?';
      params.push(status);
    }

    // Get total count
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM payroll p ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get payroll records with employee names
                    const [payroll] = await db.query(
                  `SELECT p.*, CONCAT(e.first_name, ' ', e.last_name) as employee_name
                   FROM payroll p
                   LEFT JOIN employees e ON p.employee_id = e.id
                   ${whereClause}
                   ORDER BY p.month DESC, p.created_at DESC
                   LIMIT ? OFFSET ?`,
                  [...params, parseInt(limit), offset]
                );

    res.json({
      success: true,
      data: {
        payroll,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching payroll:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payroll records' });
  }
});

// Get payroll record by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
                    const [payroll] = await db.query(
                  `SELECT p.*, CONCAT(e.first_name, ' ', e.last_name) as employee_name
                   FROM payroll p
                   LEFT JOIN employees e ON p.employee_id = e.id
                   WHERE p.id = ?`,
                  [id]
                );

    if (payroll.length === 0) {
      return res.status(404).json({ success: false, error: 'Payroll record not found' });
    }

    res.json({ success: true, data: payroll[0] });
  } catch (error) {
    console.error('Error fetching payroll record:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payroll record' });
  }
});

// Create new payroll record
router.post('/', authenticateToken, isHRManager, [
  body('employee_id').isInt().withMessage('Employee ID is required'),
  body('month').matches(/^\d{4}-\d{2}$/).withMessage('Month must be in YYYY-MM format'),
  body('base_salary').isFloat({ min: 0 }).withMessage('Base salary must be a positive number'),
  body('bonus').optional().isFloat({ min: 0 }).withMessage('Bonus must be a positive number'),
  body('deduction').optional().isFloat({ min: 0 }).withMessage('Deduction must be a positive number'),
  body('status').optional().isIn(['pending', 'paid']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { employee_id, month, base_salary, bonus = 0, deduction = 0, status = 'pending' } = req.body;
    const net_salary = base_salary + bonus - deduction;

    // Check if employee exists
    const [employees] = await db.query('SELECT id FROM employees WHERE id = ?', [employee_id]);
    if (employees.length === 0) {
      return res.status(400).json({ success: false, error: 'Employee not found' });
    }

    // Check if payroll record already exists for this employee and month
    const [existingRecords] = await db.query(
      'SELECT id FROM payroll WHERE employee_id = ? AND month = ?',
      [employee_id, month]
    );
    if (existingRecords.length > 0) {
      return res.status(400).json({ success: false, error: 'Payroll record already exists for this employee and month' });
    }

    const [result] = await db.query(
      'INSERT INTO payroll (employee_id, month, base_salary, bonus, deduction, net_salary, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [employee_id, month, base_salary, bonus, deduction, net_salary, status]
    );

                    const [newPayroll] = await db.query(
                  `SELECT p.*, CONCAT(e.first_name, ' ', e.last_name) as employee_name
                   FROM payroll p
                   LEFT JOIN employees e ON p.employee_id = e.id
                   WHERE p.id = ?`,
                  [result.insertId]
                );

    res.status(201).json({ success: true, payroll: newPayroll[0] });
  } catch (error) {
    console.error('Error creating payroll record:', error);
    res.status(500).json({ success: false, error: 'Failed to create payroll record' });
  }
});

// Update payroll record
router.put('/:id', authenticateToken, isHRManager, [
  body('base_salary').optional().isFloat({ min: 0 }).withMessage('Base salary must be a positive number'),
  body('bonus').optional().isFloat({ min: 0 }).withMessage('Bonus must be a positive number'),
  body('deduction').optional().isFloat({ min: 0 }).withMessage('Deduction must be a positive number'),
  body('status').optional().isIn(['pending', 'paid']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { base_salary, bonus, deduction, status } = req.body;

    // Check if payroll record exists
    const [existingRecords] = await db.query('SELECT * FROM payroll WHERE id = ?', [id]);
    if (existingRecords.length === 0) {
      return res.status(404).json({ success: false, error: 'Payroll record not found' });
    }

    const currentRecord = existingRecords[0];
    const newBaseSalary = base_salary !== undefined ? base_salary : currentRecord.base_salary;
    const newBonus = bonus !== undefined ? bonus : currentRecord.bonus;
    const newDeduction = deduction !== undefined ? deduction : currentRecord.deduction;
    const newNetSalary = newBaseSalary + newBonus - newDeduction;

    const updateFields = [];
    const updateValues = [];

    if (base_salary !== undefined) {
      updateFields.push('base_salary = ?');
      updateValues.push(base_salary);
    }
    if (bonus !== undefined) {
      updateFields.push('bonus = ?');
      updateValues.push(bonus);
    }
    if (deduction !== undefined) {
      updateFields.push('deduction = ?');
      updateValues.push(deduction);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }

    // Always update net_salary
    updateFields.push('net_salary = ?');
    updateValues.push(newNetSalary);

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    updateValues.push(id);
    await db.query(`UPDATE payroll SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);

                    const [updatedPayroll] = await db.query(
                  `SELECT p.*, CONCAT(e.first_name, ' ', e.last_name) as employee_name
                   FROM payroll p
                   LEFT JOIN employees e ON p.employee_id = e.id
                   WHERE p.id = ?`,
                  [id]
                );

    res.json({ success: true, data: updatedPayroll[0] });
  } catch (error) {
    console.error('Error updating payroll record:', error);
    res.status(500).json({ success: false, error: 'Failed to update payroll record' });
  }
});

// Delete payroll record
router.delete('/:id', authenticateToken, isHRManager, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query('DELETE FROM payroll WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Payroll record not found' });
    }

    res.json({ success: true, message: 'Payroll record deleted successfully' });
  } catch (error) {
    console.error('Error deleting payroll record:', error);
    res.status(500).json({ success: false, error: 'Failed to delete payroll record' });
  }
});

// Process payroll for a specific month
router.post('/process', authenticateToken, isHRManager, [
  body('month').matches(/^\d{4}-\d{2}$/).withMessage('Month must be in YYYY-MM format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { month } = req.body;

    // Get all active employees
    const [employees] = await db.query('SELECT id, salary FROM employees WHERE status = "active"');
    
    if (employees.length === 0) {
      return res.status(400).json({ success: false, error: 'No active employees found' });
    }

    let processedCount = 0;
    for (const employee of employees) {
      // Check if payroll record already exists
      const [existingRecords] = await db.query(
        'SELECT id FROM payroll WHERE employee_id = ? AND month = ?',
        [employee.id, month]
      );

      if (existingRecords.length === 0) {
        // Create payroll record
        await db.query(
          'INSERT INTO payroll (employee_id, month, base_salary, bonus, deduction, net_salary, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [employee.id, month, employee.salary, 0, 0, employee.salary, 'pending']
        );
        processedCount++;
      }
    }

    res.json({ 
      success: true, 
      message: `Payroll processed for ${month}. ${processedCount} records created.` 
    });
  } catch (error) {
    console.error('Error processing payroll:', error);
    res.status(500).json({ success: false, error: 'Failed to process payroll' });
  }
});

// Get payroll statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_employees,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as total_paid,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as total_pending,
        SUM(net_salary) as total_amount,
        AVG(net_salary) as average_salary
      FROM payroll
    `);

    res.json({ success: true, data: stats[0] });
  } catch (error) {
    console.error('Error fetching payroll stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payroll statistics' });
  }
});

module.exports = router; 