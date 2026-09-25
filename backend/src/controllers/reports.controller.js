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

module.exports = { getDashboardStats };
