const axios = require('axios');

async function testDateFix() {
  try {
    console.log('🧪 Testing date format fix...\n');
    
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
    
    // 2. Create employee with ISO date
    console.log('\n2️⃣ Creating employee with ISO date...');
    const timestamp = Date.now();
    const newEmployee = {
      firstName: 'Test',
      lastName: 'User',
      email: `test.user.${timestamp}@company.com`,
      phone: '1234567890',
      department: 'Engineering',
      position: 'Developer',
      salary: 60000,
      hireDate: '2024-01-15T00:00:00.000Z' // ISO date format
    };
    
    const createResponse = await axios.post('http://localhost:5000/api/employees', newEmployee, { headers });
    console.log('✅ Employee created successfully');
    console.log('Employee ID:', createResponse.data.employee.id);
    
    // 3. Update employee with ISO date
    console.log('\n3️⃣ Updating employee with ISO date...');
    const updateData = {
      firstName: 'Updated',
      lastName: 'User',
      email: `updated.user.${timestamp}@company.com`,
      phone: '1234567890',
      department: 'Engineering',
      position: 'Senior Developer',
      salary: 70000,
      hireDate: '2024-02-15T00:00:00.000Z', // ISO date format
      status: 'active'
    };
    
    const updateResponse = await axios.put(`http://localhost:5000/api/employees/${createResponse.data.employee.id}`, updateData, { headers });
    console.log('✅ Employee updated successfully');
    
    console.log('\n🎉 Date format fix test passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testDateFix(); 