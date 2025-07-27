const axios = require('axios');

async function testAttendanceDebug() {
  try {
    console.log('🔍 Debugging attendance creation...\n');
    
    // 1. Login
    console.log('1️⃣ Login...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // 2. Get employees
    console.log('\n2️⃣ Getting employees...');
    const employeesResponse = await axios.get('http://localhost:5000/api/employees', { headers });
    const employeeId = employeesResponse.data.employees[0].id;
    console.log('Using employee ID:', employeeId);
    
    // 3. Test attendance creation with different time formats
    console.log('\n3️⃣ Testing attendance creation...');
    const attendanceData = {
      employee_id: employeeId,
      date: '2024-01-15',
      status: 'present',
      check_in: '09:00',
      check_out: '17:00',
      remarks: 'Test attendance'
    };
    
    console.log('Sending data:', attendanceData);
    
    const attendanceResponse = await axios.post('http://localhost:5000/api/attendance', attendanceData, { headers });
    console.log('✅ Attendance created successfully');
    console.log('Response:', attendanceResponse.data);
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAttendanceDebug(); 