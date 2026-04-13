const http = require('http');

async function testAdminRoute() {
  return new Promise((resolve, reject) => {
    // First login to get token
    const loginData = JSON.stringify({
      email: 'admin@parkease.com',
      password: 'admin123'
    });

    const loginOptions = {
      hostname: 'localhost',
      port: 5002,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
      }
    };

    const loginReq = http.request(loginOptions, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const loginResponse = JSON.parse(body);

          if (res.statusCode === 200 && loginResponse.data.token) {
            console.log('✅ Admin login successful, got token');

            // Now test admin route
            const token = loginResponse.data.token;
            const options = {
              hostname: 'localhost',
              port: 5002,
              path: '/api/slots/admin/overview',
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            };

            const req = http.request(options, (res) => {
              let body = '';

              res.on('data', (chunk) => {
                body += chunk;
              });

              res.on('end', () => {
                try {
                  if (res.statusCode === 200) {
                    const response = JSON.parse(body);
                    console.log('✅ Admin route access successful!');
                    console.log('Slots overview retrieved:', response.data ? 'Yes' : 'No');
                  } else {
                    const response = JSON.parse(body);
                    console.log('❌ Admin route access failed:', response.message);
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

            req.end();
          } else {
            console.log('❌ Login failed');
            resolve();
          }
        } catch (error) {
          console.log('❌ Login parse error:', error.message);
          resolve();
        }
      });
    });

    loginReq.on('error', (error) => {
      console.log('❌ Login request error:', error.message);
      resolve();
    });

    loginReq.write(loginData);
    loginReq.end();
  });
}

testAdminRoute();