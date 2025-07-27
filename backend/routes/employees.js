const express = require('express');
const { body, validationResult, query } = require('express-validator');
const db = require('../config/database');
const { isHRManager } = require('../middleware/auth');

const router = express.Router();

// Get all employees with pagination, search, and filters
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('department').optional().isString().withMessage('Department must be a string'),
  query('status').optional().isIn(['active', 'inactive', 'terminated']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const department = req.query.department || '';
    const status = req.query.status || '';

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (search) {
      whereClause += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR employee_id LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (department) {
      whereClause += ' AND department = ?';
      params.push(department);
    }

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    // Get total count
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM employees ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get employees with pagination
    const [employees] = await db.query(
      `SELECT 
        id, employee_id, first_name, last_name, email, phone, 
        department, position, salary, hire_date, status, 
        created_at, updated_at
       FROM employees 
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Get departments for filter
    const [departments] = await db.query(
      'SELECT DISTINCT name FROM departments ORDER BY name'
    );

    res.json({
      employees,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filters: {
        departments: departments.map(d => d.name),
        search,
        department,
        status
      }
    });

  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: 'Failed to get employees' });
  }
});

// Get single employee
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [employees] = await db.query(
      'SELECT * FROM employees WHERE id = ?',
      [id]
    );

    if (employees.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ employee: employees[0] });

  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ error: 'Failed to get employee' });
  }
});

// Create new employee
router.post('/', isHRManager, [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('position').notEmpty().withMessage('Position is required'),
  body('salary').isFloat({ min: 0 }).withMessage('Valid salary is required'),
  body('hireDate').isISO8601().withMessage('Valid hire date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      department,
      position,
      salary,
      hireDate
    } = req.body;

    // Check if email already exists
    const [existingEmployees] = await db.query(
      'SELECT id FROM employees WHERE email = ?',
      [email]
    );

    if (existingEmployees.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Generate employee ID
    const [lastEmployee] = await db.query(
      'SELECT employee_id FROM employees ORDER BY id DESC LIMIT 1'
    );

    let employeeId = 'EMP001';
    if (lastEmployee.length > 0) {
      const lastId = lastEmployee[0].employee_id;
      const number = parseInt(lastId.replace('EMP', '')) + 1;
      employeeId = `EMP${number.toString().padStart(3, '0')}`;
    }

    // Insert new employee
    const [result] = await db.query(
      `INSERT INTO employees 
       (employee_id, first_name, last_name, email, phone, department, position, salary, hire_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [employeeId, firstName, lastName, email, phone, department, position, salary, new Date(hireDate).toISOString().split('T')[0]]
    );

    // Get the created employee
    const [newEmployee] = await db.query(
      'SELECT * FROM employees WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Employee created successfully',
      employee: newEmployee[0]
    });

  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

// Update employee
router.put('/:id', isHRManager, [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('position').notEmpty().withMessage('Position is required'),
  body('salary').isFloat({ min: 0 }).withMessage('Valid salary is required'),
  body('hireDate').isISO8601().withMessage('Valid hire date is required'),
  body('status').isIn(['active', 'inactive', 'terminated']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      phone,
      department,
      position,
      salary,
      hireDate,
      status
    } = req.body;

    // Check if employee exists
    const [existingEmployees] = await db.query(
      'SELECT id FROM employees WHERE id = ?',
      [id]
    );

    if (existingEmployees.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Check if email is already taken by another employee
    const [emailCheck] = await db.query(
      'SELECT id FROM employees WHERE email = ? AND id != ?',
      [email, id]
    );

    if (emailCheck.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Update employee
    await db.query(
      `UPDATE employees SET 
       first_name = ?, last_name = ?, email = ?, phone = ?, 
       department = ?, position = ?, salary = ?, hire_date = ?, status = ?
       WHERE id = ?`,
      [firstName, lastName, email, phone, department, position, salary, new Date(hireDate).toISOString().split('T')[0], status, id]
    );

    // Get updated employee
    const [updatedEmployee] = await db.query(
      'SELECT * FROM employees WHERE id = ?',
      [id]
    );

    res.json({
      message: 'Employee updated successfully',
      employee: updatedEmployee[0]
    });

  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// Delete employee
router.delete('/:id', isHRManager, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if employee exists
    const [existingEmployees] = await db.query(
      'SELECT id FROM employees WHERE id = ?',
      [id]
    );

    if (existingEmployees.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Delete employee
    await db.query('DELETE FROM employees WHERE id = ?', [id]);

    res.json({ message: 'Employee deleted successfully' });

  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

// Get employee statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const [totalEmployees] = await db.query(
      'SELECT COUNT(*) as total FROM employees'
    );

    const [activeEmployees] = await db.query(
      'SELECT COUNT(*) as active FROM employees WHERE status = "active"'
    );

    const [departmentStats] = await db.query(
      'SELECT department, COUNT(*) as count FROM employees GROUP BY department'
    );

    const [salaryStats] = await db.query(
      'SELECT AVG(salary) as avgSalary, MIN(salary) as minSalary, MAX(salary) as maxSalary FROM employees'
    );

    const [recentHires] = await db.query(
      'SELECT COUNT(*) as recent FROM employees WHERE hire_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
    );

    res.json({
      totalEmployees: totalEmployees[0].total,
      activeEmployees: activeEmployees[0].active,
      departmentStats,
      salaryStats: {
        average: parseFloat(salaryStats[0].avgSalary || 0).toFixed(2),
        minimum: parseFloat(salaryStats[0].minSalary || 0).toFixed(2),
        maximum: parseFloat(salaryStats[0].maxSalary || 0).toFixed(2)
      },
      recentHires: recentHires[0].recent
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

module.exports = router; 