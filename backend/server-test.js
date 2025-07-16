// server-test.js
process.on('uncaughtException', err => {
  console.error('🛑 Uncaught Exception:', err);
});

process.on('unhandledRejection', err => {
  console.error('🛑 Unhandled Promise Rejection:', err);
});

process.on('exit', code => {
  console.log(`❗ Process exiting with code: ${code}`);
});

const express = require('express');
const app = express();

console.log('🟡 Starting barebones Express server...');

app.get('/test', (req, res) => {
  console.log('✅ /test route hit');
  res.send('Hello from barebones server!');
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`🟢 Server is running on http://localhost:${PORT}`);
});
