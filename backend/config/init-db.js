const mysql = require('mysql2');
require('dotenv').config({ path: '../config.env' });

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  port: process.env.DB_PORT || 3306
});

const initDatabase = async () => {
  try {
    // Create database if it doesn't exist
    await connection.promise().query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'employee_management'}`);
    console.log('✅ Database created or already exists');
    
    // Use the database
    await connection.promise().query(`USE ${process.env.DB_NAME || 'employee_management'}`);
    
    // Create users table
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'hr_manager', 'employee') DEFAULT 'employee',
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    
    // Create employees table
    const createEmployeesTable = `
      CREATE TABLE IF NOT EXISTS employees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id VARCHAR(20) UNIQUE NOT NULL,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20),
        department VARCHAR(50) NOT NULL,
        position VARCHAR(50) NOT NULL,
        salary DECIMAL(10,2) NOT NULL,
        hire_date DATE NOT NULL,
        status ENUM('active', 'inactive', 'terminated') DEFAULT 'active',
        manager_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL
      )
    `;
    
    // Create departments table
    const createDepartmentsTable = `
      CREATE TABLE IF NOT EXISTS departments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        manager_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL
      )
    `;
    
    // Create audit_log table
    const createAuditLogTable = `
      CREATE TABLE IF NOT EXISTS audit_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        action VARCHAR(50) NOT NULL,
        table_name VARCHAR(50) NOT NULL,
        record_id INT,
        old_values JSON,
        new_values JSON,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `;
    
    // Create tasks table
    const createTasksTable = `
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        assigned_to INT,
        assigned_by INT,
        status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
        due_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (assigned_to) REFERENCES employees(id) ON DELETE SET NULL,
        FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `;

    // Create attendance table
    const createAttendanceTable = `
      CREATE TABLE IF NOT EXISTS attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        date DATE NOT NULL,
        status ENUM('present', 'absent', 'leave', 'late') DEFAULT 'present',
        check_in TIME,
        check_out TIME,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        UNIQUE KEY unique_attendance (employee_id, date)
      )
    `;

    // Create payroll table
    const createPayrollTable = `
      CREATE TABLE IF NOT EXISTS payroll (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
        base_salary DECIMAL(10,2) NOT NULL,
        bonus DECIMAL(10,2) DEFAULT 0,
        deduction DECIMAL(10,2) DEFAULT 0,
        net_salary DECIMAL(10,2) NOT NULL,
        status ENUM('pending', 'paid') DEFAULT 'pending',
        processed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        UNIQUE KEY unique_payroll (employee_id, month)
      )
    `;
    
    // Execute table creation
    await connection.promise().query(createUsersTable);
    console.log('✅ Users table created');
    
    await connection.promise().query(createEmployeesTable);
    console.log('✅ Employees table created');
    
    await connection.promise().query(createDepartmentsTable);
    console.log('✅ Departments table created');
    
    await connection.promise().query(createAuditLogTable);
    console.log('✅ Audit log table created');

    // Execute new table creation
    await connection.promise().query(createTasksTable);
    console.log('✅ Tasks table created');
    await connection.promise().query(createAttendanceTable);
    console.log('✅ Attendance table created');
    await connection.promise().query(createPayrollTable);
    console.log('✅ Payroll table created');
    
    // Insert default admin user
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const insertAdmin = `
      INSERT IGNORE INTO users (username, email, password, role, first_name, last_name)
      VALUES ('admin', 'admin@company.com', ?, 'admin', 'System', 'Administrator')
    `;
    
    await connection.promise().query(insertAdmin, [hashedPassword]);
    console.log('✅ Default admin user created (username: admin, password: admin123)');
    
    // Insert sample departments
    const insertDepartments = `
      INSERT IGNORE INTO departments (name, description) VALUES
      ('Human Resources', 'HR department for employee management'),
      ('Information Technology', 'IT department for technical support'),
      ('Finance', 'Finance and accounting department'),
      ('Marketing', 'Marketing and sales department'),
      ('Operations', 'Operations and logistics department')
    `;
    
    await connection.promise().query(insertDepartments);
    console.log('✅ Sample departments created');
    
    // Insert sample employees
    const insertEmployees = `
      INSERT IGNORE INTO employees (employee_id, first_name, last_name, email, phone, department, position, salary, hire_date) VALUES
      ('EMP001', 'John', 'Doe', 'john.doe@company.com', '+1234567890', 'Information Technology', 'Senior Developer', 75000.00, '2023-01-15'),
      ('EMP002', 'Jane', 'Smith', 'jane.smith@company.com', '+1234567891', 'Human Resources', 'HR Manager', 65000.00, '2022-08-20'),
      ('EMP003', 'Mike', 'Johnson', 'mike.johnson@company.com', '+1234567892', 'Finance', 'Financial Analyst', 60000.00, '2023-03-10'),
      ('EMP004', 'Sarah', 'Williams', 'sarah.williams@company.com', '+1234567893', 'Marketing', 'Marketing Specialist', 55000.00, '2023-06-05'),
      ('EMP005', 'David', 'Brown', 'david.brown@company.com', '+1234567894', 'Operations', 'Operations Manager', 70000.00, '2022-11-12')
    `;
    
    await connection.promise().query(insertEmployees);
    console.log('✅ Sample employees created');
    
    console.log('🎉 Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  } finally {
    connection.end();
  }
};

// Run initialization if this file is executed directly
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase }; 