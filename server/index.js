const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const apiRouter = require('./routes/api');
const { rateLimiter, auditLogger, GLOBAL_LIMIT, WINDOW_MS } = require('./middleware/securityMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(auditLogger);
app.use(rateLimiter(GLOBAL_LIMIT, WINDOW_MS)); 

app.use('/api', apiRouter);

app.get('/', (req, res) => {
  res.json({ message: 'SkillSwap peer api service online' });
});

app.listen(PORT, () => {
  console.log(`Express microservice listening on port ${PORT}`);
});