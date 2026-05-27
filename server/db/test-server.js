// test-server.js
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'Server ishlamoqda!', vaqt: new Date() }));
});

server.listen(3000, () => {
  console.log('✅ Test server 3000-portda ishga tushdi');
  console.log('Brauzerda oching: http://localhost:3000');
});
