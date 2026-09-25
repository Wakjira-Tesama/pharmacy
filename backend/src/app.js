require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const medicineRoutes = require('./routes/medicine.routes');
const stockRoutes = require('./routes/stock.routes');
const salesRoutes = require('./routes/sales.routes');
const financeRoutes = require('./routes/finance.routes');
const reportsRoutes = require('./routes/reports.routes');
const usersRoutes = require('./routes/users.routes');
const pool = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ success: true, database: 'connected' });
  } catch (error) {
    res.status(503).json({ success: false, database: 'disconnected' });
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🏥 Pharmacy Management System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth/login',
      medicines: '/api/medicines',
      stock: '/api/stock/inventory',
      sales: '/api/sales',
      finance: '/api/finance/daily',
      reports: '/api/reports/dashboard',
      users: '/api/users'
    }
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/users', usersRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
