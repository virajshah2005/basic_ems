const axios = require('axios');

// Comprehensive test for all employee management features
async function testComprehensive() {
  try {
    console.log('🧪 Starting comprehensive employee management test...\n');
    
    // 1. Test login
    console.log('1️⃣ Testing login...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    console.log('✅ Login successful');
    const token = loginResponse.data.token;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // 2. Test employee creation
    console.log('\n2️⃣ Testing employee creation...');
    const timestamp = Date.now();
    const newEmployee = {
      firstName: 'John',
      lastName: 'Doe',
      email: `john.doe.${timestamp}@company.com`,
      phone: '1234567890',
      department: 'Engineering',
      position: 'Software Engineer',
      salary: 75000,
      hireDate: '2024-01-15',
      status: 'active'
    };
    
    const createResponse = await axios.post('http://localhost:5000/api/employees', newEmployee, { headers });
    console.log('✅ Employee created successfully');
    console.log('Employee ID:', createResponse.data.employee.id);
    
    // 3. Test getting employees
    console.log('\n3️⃣ Testing employee retrieval...');
    const employeesResponse = await axios.get('http://localhost:5000/api/employees', { headers });
    console.log('✅ Employees retrieved successfully');
    console.log('Total employees:', employeesResponse.data.employees.length);
    
    // 4. Test task creation
    console.log('\n4️⃣ Testing task creation...');
    const newTask = {
      title: 'Implement new feature',
      description: 'Create a new user interface component',
      assigned_to: createResponse.data.employee.id,
      status: 'pending',
      due_date: '2024-12-31'
    };
    
    const taskResponse = await axios.post('http://localhost:5000/api/tasks', newTask, { headers });
    console.log('✅ Task created successfully');
    console.log('Task ID:', taskResponse.data.task.id);
    
    // 5. Test attendance creation
    console.log('\n5️⃣ Testing attendance creation...');
    const newAttendance = {
      employee_id: createResponse.data.employee.id,
      date: '2024-01-15',
      status: 'present',
      check_in: '09:00',
      check_out: '17:00',
      remarks: 'Regular work day'
    };
    
    const attendanceResponse = await axios.post('http://localhost:5000/api/attendance', newAttendance, { headers });
    console.log('✅ Attendance record created successfully');
    console.log('Attendance ID:', attendanceResponse.data.attendance.id);
    
    // 6. Test payroll creation
    console.log('\n6️⃣ Testing payroll creation...');
    const newPayroll = {
      employee_id: createResponse.data.employee.id,
      month: '2024-01',
      base_salary: 75000,
      bonus: 5000,
      deduction: 1000,
      net_salary: 79000,
      status: 'pending'
    };
    
    const payrollResponse = await axios.post('http://localhost:5000/api/payroll', newPayroll, { headers });
    console.log('✅ Payroll record created successfully');
    console.log('Payroll ID:', payrollResponse.data.payroll.id);
    
    // 7. Test getting all data
    console.log('\n7️⃣ Testing data retrieval...');
    
    const tasksResponse = await axios.get('http://localhost:5000/api/tasks', { headers });
    console.log('✅ Tasks retrieved:', tasksResponse.data.data.tasks.length);
    
    const attendanceResponse2 = await axios.get('http://localhost:5000/api/attendance', { headers });
    console.log('✅ Attendance records retrieved:', attendanceResponse2.data.data.attendance.length);
    
    const payrollResponse2 = await axios.get('http://localhost:5000/api/payroll', { headers });
    console.log('✅ Payroll records retrieved:', payrollResponse2.data.data.payroll.length);
    
    // 8. Test statistics
    console.log('\n8️⃣ Testing statistics...');
    
    const taskStats = await axios.get('http://localhost:5000/api/tasks/stats/overview', { headers });
    console.log('✅ Task stats retrieved');
    
    const attendanceStats = await axios.get('http://localhost:5000/api/attendance/stats/overview', { headers });
    console.log('✅ Attendance stats retrieved');
    
    const payrollStats = await axios.get('http://localhost:5000/api/payroll/stats/overview', { headers });
    console.log('✅ Payroll stats retrieved');
    
    console.log('\n🎉 All tests passed successfully!');
    console.log('\n📊 Summary:');
    console.log('- Employee creation: ✅');
    console.log('- Task assignment: ✅');
    console.log('- Attendance tracking: ✅');
    console.log('- Payroll management: ✅');
    console.log('- Data retrieval: ✅');
    console.log('- Statistics: ✅');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testComprehensive(); 