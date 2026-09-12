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

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

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
      reports: '/api/reports/dashboard'
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

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
