require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initDB } = require('./db');
const { router: authRouter } = require('./routes/auth');
const ordersRouter = require('./routes/orders');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/admin', adminRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), service: 'Last-Mile Delivery Management API' });
});

// Serve frontend static build if available
const clientBuildPath = path.resolve(__dirname, '../client/dist');
const indexHtmlPath = path.join(clientBuildPath, 'index.html');

app.use(express.static(clientBuildPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  if (fs.existsSync(indexHtmlPath)) {
    return res.sendFile(indexHtmlPath);
  }
  res.send('Last-Mile Delivery Management Platform API Server Running');
});

// Initialize DB and start server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`🚚 Last-Mile Delivery Tracker API running on http://localhost:${PORT}`);
    console.log(`=================================================`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
});
