const axios = require('axios');

async function testDebug() {
  try {
    console.log('🔍 Debugging authentication and authorization...\n');
    
    // 1. Test login
    console.log('1️⃣ Testing login...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    console.log('✅ Login successful');
    console.log('User role:', loginResponse.data.user.role);
    console.log('User ID:', loginResponse.data.user.id);
    
    const token = loginResponse.data.token;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // 2. Test employees endpoint
    console.log('\n2️⃣ Testing employees endpoint...');
    try {
      const employeesResponse = await axios.get('http://localhost:5000/api/employees', { headers });
      console.log('✅ Employees endpoint working');
      console.log('Employees count:', employeesResponse.data.employees.length);
    } catch (error) {
      console.error('❌ Employees endpoint failed:', error.response?.data || error.message);
    }
    
    // 3. Test tasks endpoint
    console.log('\n3️⃣ Testing tasks endpoint...');
    try {
      const tasksResponse = await axios.get('http://localhost:5000/api/tasks', { headers });
      console.log('✅ Tasks endpoint working');
      console.log('Tasks count:', tasksResponse.data.data.tasks.length);
    } catch (error) {
      console.error('❌ Tasks endpoint failed:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testDebug(); 