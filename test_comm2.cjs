const http = require('http');

const data = JSON.stringify({
  source: 'zabbix',
  payload: {
    event_id: '123',
    host: 'Core-Router-01',
    severity: 'High',
    description: 'CPU load is high'
  }
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/communications/events',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.write(data);
req.end();
