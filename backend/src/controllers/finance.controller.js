const pool = require('../config/db');

const FREQUENCIES = ['ONCE', 'DAILY', 'MONTHLY'];

async function ensureExpenseColumns() {
  try {
    await pool.query(`ALTER TABLE expense_transactions ADD COLUMN IF NOT EXISTS frequency VARCHAR(20) DEFAULT 'ONCE'`);
  } catch (error) {
    try {
      await pool.query(`ALTER TABLE expense_transactions ADD COLUMN frequency VARCHAR(20) DEFAULT 'ONCE'`);
    } catch (inner) {
      // Column already exists.
    }
  }
}

function daysInCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

// Record Expense
// ONCE: counted only on the day it is recorded.
// DAILY: the full amount is added to every day's expenses.
// MONTHLY: rent, salary, and similar costs are divided across the days of the month.
const recordExpense = async (req, res) => {
  try {
    await ensureExpenseColumns();
    const { expense_type, description, amount, payment_method, frequency } = req.body;
    const user_id = req.user.id;
    const schedule = FREQUENCIES.includes(frequency) ? frequency : 'ONCE';
    const numericAmount = Number(amount);

    if (!expense_type || !numericAmount || numericAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Expense type and a positive amount are required' });
    }

    const [result] = await pool.query(
      `INSERT INTO expense_transactions (reference_type, description, amount, user_id, frequency)
       VALUES (?, ?, ?, ?, ?)`,
      [expense_type, description || payment_method || 'Cash', numericAmount, user_id, schedule]
    );

    // Audit log
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, module, record_id, description) VALUES (?, 'RECORD_EXPENSE', 'FINANCE', ?, 'Recorded expense')`,
      [user_id, result.insertId]
    );

    const days = daysInCurrentMonth();
    const dailyAmount = schedule === 'MONTHLY'
      ? Number((numericAmount / days).toFixed(2))
      : numericAmount;

    res.status(201).json({
      success: true,
      message: 'Expense recorded successfully',
      data: { id: result.insertId, frequency: schedule, dailyAmount }
    });
  } catch (error) {
    console.error('Error recording expense:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get today's financial summary (Income vs Expense)
const getDailyFinance = async (req, res) => {
  try {
    await ensureExpenseColumns();
    const [incomeRows] = await pool.query(`SELECT SUM(amount) as total_income FROM income_transactions WHERE DATE(created_at) = CURDATE()`);
    const [expenseRows] = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN COALESCE(frequency, 'ONCE') = 'ONCE' AND DATE(created_at) = CURDATE() THEN amount ELSE 0 END), 0) AS once_today,
        COALESCE(SUM(CASE WHEN frequency = 'DAILY' THEN amount ELSE 0 END), 0) AS daily_sum,
        COALESCE(SUM(CASE WHEN frequency = 'MONTHLY' THEN amount ELSE 0 END), 0) AS monthly_sum
      FROM expense_transactions
    `);

    const [expiredRows] = await pool.query(`
      SELECT COALESCE(SUM(current_quantity * purchase_price), 0) AS expired_cost
      FROM medicine_batches
      WHERE current_quantity > 0 AND expiry_date = CURDATE()
    `);
    const [stockRows] = await pool.query(`
      SELECT COALESCE(SUM(current_quantity * purchase_price), 0) AS stock_value
      FROM medicine_batches
      WHERE current_quantity > 0
    `);

    const days = daysInCurrentMonth();
    const onceToday = Number(expenseRows[0].once_today) || 0;
    const dailySum = Number(expenseRows[0].daily_sum) || 0;
    const monthlyDaily = (Number(expenseRows[0].monthly_sum) || 0) / days;
    const income = Number(incomeRows[0].total_income) || 0;
    const expense = Number((onceToday + dailySum + monthlyDaily).toFixed(2));
    const balance = Number((income - expense).toFixed(2));
    const expiredCost = Number(Number(expiredRows[0].expired_cost).toFixed(2));
    const stockValue = Number(Number(stockRows[0].stock_value).toFixed(2));

    res.json({
      success: true,
      data: {
        income,
        expense,
        balance,
        expiredCost,
        stockValue
      }
    });
  } catch (error) {
    console.error('Error getting finance summary:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get all expenses list
const getExpenses = async (req, res) => {
  try {
    await ensureExpenseColumns();
    const [rows] = await pool.query(
      `SELECT e.*, u.name as user_name FROM expense_transactions e
       LEFT JOIN users u ON e.user_id = u.id
       ORDER BY e.created_at DESC LIMIT 50`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error getting expenses:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get all income list
const getIncome = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT i.*, u.name as user_name FROM income_transactions i
       LEFT JOIN users u ON i.user_id = u.id
       ORDER BY i.created_at DESC LIMIT 50`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error getting income:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { recordExpense, getDailyFinance, getExpenses, getIncome };

