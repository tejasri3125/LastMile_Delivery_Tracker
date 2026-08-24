const express = require('express');
const cors = require('cors');
const { initDB } = require('../server/db');
const { router: authRouter } = require('../server/routes/auth');
const ordersRouter = require('../server/routes/orders');
const adminRouter = require('../server/routes/admin');

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/admin', adminRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), service: 'Last-Mile Delivery Management API on Vercel' });
});

// Initialize SQLite WASM DB
initDB().catch(err => console.error('Vercel DB Init Error:', err));

module.exports = app;
