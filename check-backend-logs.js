const https = require('https');
const token = '8534ff71-2487-44ab-8a72-4dd80a744148';
const deploymentId = '4d119846-552d-4ea5-abc1-1fb9078e3fe1';
const query = `query { deploymentLogs(deploymentId: "${deploymentId}", limit: 80) { message } }`;
const body = JSON.stringify({ query });
const req = https.request({ hostname: 'backboard.railway.app', path: '/graphql/v2', method: 'POST',
  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
}, (res) => { let d = ''; res.on('data', c => d += c); res.on('end', () => { const p = JSON.parse(d); (p.data?.deploymentLogs || []).forEach(l => console.log(l.message)); }); });
req.write(body); req.end();
