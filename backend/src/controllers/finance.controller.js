const pool = require('../config/db');

// Record Expense
const recordExpense = async (req, res) => {
  try {
    const { expense_type, description, amount, payment_method } = req.body;
    const user_id = req.user.id;

    if (!expense_type || !amount) {
      return res.status(400).json({ success: false, message: 'Expense type and amount are required' });
    }

    const [result] = await pool.query(
      `INSERT INTO expenses (expense_type, description, amount, payment_method, user_id, expense_date)
       VALUES (?, ?, ?, ?, ?, CURDATE())`,
      [expense_type, description, amount, payment_method || 'Cash', user_id]
    );

    // Audit log
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, module, record_id, description) VALUES (?, 'RECORD_EXPENSE', 'FINANCE', ?, 'Recorded expense')`,
      [user_id, result.insertId]
    );

    res.status(201).json({ success: true, message: 'Expense recorded successfully', data: { id: result.insertId } });
  } catch (error) {
    console.error('Error recording expense:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get today's financial summary (Income vs Expense)
const getDailyFinance = async (req, res) => {
  try {
    // Today's Income
    const [incomeRows] = await pool.query(`SELECT SUM(amount) as total_income FROM income_transactions WHERE DATE(transaction_date) = CURDATE()`);
    // Today's Expense
    const [expenseRows] = await pool.query(`SELECT SUM(amount) as total_expense FROM expenses WHERE expense_date = CURDATE()`);

    const income = incomeRows[0].total_income || 0;
    const expense = expenseRows[0].total_expense || 0;
    const balance = income - expense;

    res.json({
      success: true,
      data: {
        income,
        expense,
        balance
      }
    });
  } catch (error) {
    console.error('Error getting finance summary:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { recordExpense, getDailyFinance };
