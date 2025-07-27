const axios = require('axios');

// Test the API endpoints
async function testAPI() {
  try {
    console.log('Testing API endpoints...');
    
    // 1. Test login
    console.log('\n1. Testing login...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    console.log('✅ Login successful');
    console.log('User:', loginResponse.data.user);
    console.log('Token:', loginResponse.data.token.substring(0, 50) + '...');
    
    const token = loginResponse.data.token;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // 2. Test tasks endpoint
    console.log('\n2. Testing tasks endpoint...');
    const tasksResponse = await axios.get('http://localhost:5000/api/tasks', { headers });
    console.log('✅ Tasks endpoint working');
    console.log('Tasks count:', tasksResponse.data.data.tasks.length);
    
    // 3. Test attendance endpoint
    console.log('\n3. Testing attendance endpoint...');
    const attendanceResponse = await axios.get('http://localhost:5000/api/attendance', { headers });
    console.log('✅ Attendance endpoint working');
    console.log('Attendance count:', attendanceResponse.data.data.attendance.length);
    
    // 4. Test payroll endpoint
    console.log('\n4. Testing payroll endpoint...');
    const payrollResponse = await axios.get('http://localhost:5000/api/payroll', { headers });
    console.log('✅ Payroll endpoint working');
    console.log('Payroll count:', payrollResponse.data.data.payroll.length);
    
    console.log('\n🎉 All API endpoints are working correctly!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.response?.data || error.message);
  }
}

testAPI(); 