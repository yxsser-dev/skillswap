const express = require('express');
const cors = require('cors');
require('dotenv').config();

const apiRouter = require('./routes/api');
const { rateLimiter, auditLogger } = require('./middleware/securityMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Global Security & Audit logging
app.use(auditLogger);
app.use(rateLimiter(100, 15 * 60 * 1000)); // Limits each IP to 100 requests per 15 mins

// APIs mount
app.use('/api', apiRouter);

// Base Route
app.get('/', (req, res) => {
  res.json({ message: 'SkillSwap peer api service online' });
});

app.listen(PORT, () => {
  console.log(`Express microservice listening on port ${PORT}`);
});