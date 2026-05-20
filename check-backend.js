const https = require('https');
const token = '8534ff71-2487-44ab-8a72-4dd80a744148';
const serviceId = 'fcf88469-4801-4eb8-aa66-c7b5a79fffe8';
// Check the specific latest deploy
const query = `query { service(id: "${serviceId}") { name deployments(last: 5) { edges { node { id status createdAt } } } } }`;
const body = JSON.stringify({ query });
const req = https.request({ hostname: 'backboard.railway.app', path: '/graphql/v2', method: 'POST',
  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
}, (res) => { let d = ''; res.on('data', c => d += c); res.on('end', () => { const p = JSON.parse(d); (p.data?.service?.deployments?.edges || []).forEach(e => console.log('Status:', e.node.status, '| Created:', e.node.createdAt, '| ID:', e.node.id)); }); });
req.write(body); req.end();
