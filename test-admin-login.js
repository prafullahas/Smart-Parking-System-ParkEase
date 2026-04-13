const http = require('http');

async function testAdminLogin() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      email: 'admin@parkease.com',
      password: 'admin123'
    });

    const options = {
      hostname: 'localhost',
      port: 5002,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(body);

          if (res.statusCode === 200) {
            console.log('✅ Login Success!');
            console.log('User ID:', response.data._id);
            console.log('Name:', response.data.name);
            console.log('Email:', response.data.email);
            console.log('Role:', response.data.role);
            console.log('Token:', response.data.token ? 'Present' : 'Missing');

            if (response.data.role === 'admin') {
              console.log('✅ Admin login working correctly!');
            } else {
              console.log('❌ User is not admin');
            }
          } else {
            console.log('❌ Login failed:', response.message);
          }
          resolve();
        } catch (error) {
          console.log('❌ Parse error:', error.message);
          resolve();
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Request error:', error.message);
      resolve();
    });

    req.write(data);
    req.end();
  });
}

testAdminLogin();