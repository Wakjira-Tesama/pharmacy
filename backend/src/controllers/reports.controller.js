const pool = require('../config/db');

const getDashboardStats = async (req, res) => {
  try {
    // Basic stats
    const [medCount] = await pool.query('SELECT COUNT(*) as total FROM medicines');
    const [stockCount] = await pool.query('SELECT SUM(current_quantity) as total FROM medicine_batches');
    
    // Alerts
    const [lowStock] = await pool.query(`
      SELECT COUNT(*) as total 
      FROM medicines m 
      JOIN (SELECT medicine_id, SUM(current_quantity) as total_qty FROM medicine_batches GROUP BY medicine_id) b 
      ON m.id = b.medicine_id 
      WHERE b.total_qty <= m.minimum_stock
    `);
    
    const [expiringSoon] = await pool.query(`
      SELECT COUNT(*) as total 
      FROM medicine_batches 
      WHERE current_quantity > 0 AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) AND expiry_date >= CURDATE()
    `);
    
    const [expired] = await pool.query(`
      SELECT COUNT(*) as total 
      FROM medicine_batches 
      WHERE current_quantity > 0 AND expiry_date < CURDATE()
    `);

    // Today's sales
    const [todaySales] = await pool.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue 
      FROM sales 
      WHERE DATE(created_at) = CURDATE()
    `);

    res.json({
      success: true,
      data: {
        totalMedicines: medCount[0].total || 0,
        totalStock: stockCount[0].total || 0,
        lowStock: lowStock[0].total || 0,
        expiringSoon: expiringSoon[0].total || 0,
        expired: expired[0].total || 0,
        todaySalesCount: todaySales[0].count || 0,
        todaysRevenue: todaySales[0].revenue || 0
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

async function ensureExpenseFrequency() {
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

function parseDay(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function formatDay(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function eachDay(from, to) {
  const days = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function dayKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return formatDay(date);
}

function expenseOnDay(expenses, day) {
  const key = formatDay(day);
  const daysInMonth = new Date(day.getFullYear(), day.getMonth() + 1, 0).getDate();
  let total = 0;
  for (const expense of expenses) {
    const created = dayKey(expense.created_at);
    if (!created || created > key) continue;
    const amount = Number(expense.amount) || 0;
    const frequency = expense.frequency || 'ONCE';
    if (frequency === 'ONCE' && created === key) total += amount;
    if (frequency === 'DAILY') total += amount;
    if (frequency === 'MONTHLY') total += amount / daysInMonth;
  }
  return total;
}

const getPeriodReport = async (req, res) => {
  try {
    await ensureExpenseFrequency();
    const from = parseDay(req.query.from);
    const to = parseDay(req.query.to);
    if (!from || !to || from > to) {
      return res.status(400).json({ success: false, message: 'Choose a valid from and to date' });
    }
    const days = eachDay(from, to);
    if (days.length > 93) {
      return res.status(400).json({ success: false, message: 'Choose a range of 93 days or less' });
    }

    const fromKey = formatDay(from);
    const toKey = formatDay(to);
    const [sales] = await pool.query(
      `SELECT id, total, created_at FROM sales WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?`,
      [fromKey, toKey]
    );
    const [costLines] = await pool.query(
      `SELECT s.created_at, si.quantity, b.purchase_price
       FROM sale_items si
       JOIN sales s ON s.id = si.sale_id
       JOIN medicine_batches b ON b.id = si.batch_id
       WHERE DATE(s.created_at) >= ? AND DATE(s.created_at) <= ?`,
      [fromKey, toKey]
    );
    const [expiredRows] = await pool.query(
      `SELECT expiry_date, purchase_price, current_quantity
       FROM medicine_batches
       WHERE expiry_date >= ? AND expiry_date <= ?`,
      [fromKey, toKey]
    );
    const [sold] = await pool.query(
      `SELECT m.name, SUM(si.quantity) AS quantity, SUM(si.total) AS total
       FROM sale_items si
       JOIN sales s ON s.id = si.sale_id
       JOIN medicines m ON m.id = si.medicine_id
       WHERE DATE(s.created_at) >= ? AND DATE(s.created_at) <= ?
       GROUP BY m.id, m.name
       ORDER BY SUM(si.total) DESC`,
      [fromKey, toKey]
    );
    const [expenses] = await pool.query(
      `SELECT reference_type, description, amount, frequency, created_at
       FROM expense_transactions
       ORDER BY created_at DESC`
    );

    const round = (value) => Number((Number(value) || 0).toFixed(2));
    const salesByDay = {};
    for (const sale of sales) {
      const key = dayKey(sale.created_at);
      if (!salesByDay[key]) salesByDay[key] = { count: 0 };
      salesByDay[key].count += 1;
    }
    const purchaseByDay = {};
    for (const line of costLines) {
      const key = dayKey(line.created_at);
      const cost = (Number(line.quantity) || 0) * (Number(line.purchase_price) || 0);
      purchaseByDay[key] = (purchaseByDay[key] || 0) + cost;
    }
    const expiredByDay = {};
    for (const batch of expiredRows) {
      const key = dayKey(batch.expiry_date);
      const cost = (Number(batch.current_quantity) || 0) * (Number(batch.purchase_price) || 0);
      expiredByDay[key] = (expiredByDay[key] || 0) + cost;
    }

    const daily = days.map((day) => {
      const key = formatDay(day);
      const purchase = purchaseByDay[key] || 0;
      const selling = purchase * 1.25;
      const balance = selling - purchase;
      const expense = expenseOnDay(expenses, day);
      const expiredCost = expiredByDay[key] || 0;
      const net = balance - expense - expiredCost;
      return {
        date: key,
        salesCount: salesByDay[key] ? salesByDay[key].count : 0,
        purchase: round(purchase),
        selling: round(selling),
        balance: round(balance),
        expense: round(expense),
        expiredCost: round(expiredCost),
        net: round(net)
      };
    });

    const purchase = daily.reduce((sum, row) => sum + row.purchase, 0);
    const selling = daily.reduce((sum, row) => sum + row.selling, 0);
    const balance = daily.reduce((sum, row) => sum + row.balance, 0);
    const expense = daily.reduce((sum, row) => sum + row.expense, 0);
    const expiredCost = daily.reduce((sum, row) => sum + row.expiredCost, 0);
    const net = daily.reduce((sum, row) => sum + row.net, 0);
    const spent = expenses
      .map((item) => {
        const created = dayKey(item.created_at);
        const frequency = item.frequency || 'ONCE';
        const amount = Number(item.amount) || 0;
        const applied = daily.reduce((sum, row) => {
          if (created > row.date) return sum;
          if (frequency === 'ONCE') return sum + (created === row.date ? amount : 0);
          if (frequency === 'DAILY') return sum + amount;
          const parts = row.date.split('-').map(Number);
          const daysInMonth = new Date(parts[0], parts[1], 0).getDate();
          return sum + amount / daysInMonth;
        }, 0);
        return {
          type: item.reference_type,
          description: item.description,
          frequency,
          amount,
          applied: Number(applied.toFixed(2)),
          date: created
        };
      })
      .filter((item) => item.applied > 0);

    res.json({
      success: true,
      data: {
        from: fromKey,
        to: toKey,
        summary: {
          salesCount: daily.reduce((sum, row) => sum + row.salesCount, 0),
          purchase: round(purchase),
          selling: round(selling),
          balance: round(balance),
          expense: round(expense),
          expiredCost: round(expiredCost),
          net: round(net)
        },
        days: daily,
        sold: sold.map((item) => ({
          name: item.name,
          quantity: Number(item.quantity) || 0,
          total: Number(item.total) || 0
        })),
        spent
      }
    });
  } catch (error) {
    console.error('Period report error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getDashboardStats, getPeriodReport };
