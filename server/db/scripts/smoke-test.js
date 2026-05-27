// scripts/smoke-test.js
const http = require('http');

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

function request(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Smoke test boshlandi...\n');
  
  try {
    // 1. Health check
    console.log('1️⃣ Health check...');
    const health = await request('/api/health');
    console.log(`   Status: ${health.status} ${health.status === 200 ? '✅' : '❌'}`);
    
    // 2. Kitoblarni olish
    console.log('2️⃣ Kitoblar API...');
    const books = await request('/api/books');
    console.log(`   Status: ${books.status} ${books.status === 200 ? '✅' : '❌'}`);
    if (books.data?.books) {
      console.log(`   📚 Kitoblar soni: ${books.data.books.length}`);
    }
    
    // 3. Ro'yxatdan o'tish testi
    console.log('3️⃣ Ro\'yxatdan o\'tish testi...');
    const testUser = {
      username: `test_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'Test123!'
    };
    const register = await request('/api/auth/join', 'POST', testUser);
    console.log(`   Status: ${register.status} ${register.status === 201 ? '✅' : '❌'}`);
    
    let token = null;
    if (register.status === 201) {
      token = register.data.token;
      console.log('   🔑 Token olindi');
      
      // 4. Auth me testi
      console.log('4️⃣ Auth /me testi...');
      const me = await request('/api/auth/me', 'GET', null, { 
        'Authorization': `Bearer ${token}` 
      });
      console.log(`   Status: ${me.status} ${me.status === 200 ? '✅' : '❌'}`);
    }
    
    console.log('\n✅ Smoke test tugadi!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test xatoligi:', err.message);
    process.exit(1);
  }
}

runTests();
