const pool = require('../config/db');

// Stock In: Receive medicine stock
const stockIn = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { medicine_id, batch_number, manufacturing_date, expiry_date, purchase_price, selling_price, quantity, supplier_id } = req.body;
    const user_id = req.user.id;

    await connection.beginTransaction();

    // 1. Check or create batch
    let batch_id;
    const [existingBatch] = await connection.query('SELECT id, current_quantity FROM medicine_batches WHERE medicine_id = ? AND batch_number = ?', [medicine_id, batch_number]);
    
    let previous_quantity = 0;
    let new_quantity = quantity;

    if (existingBatch.length > 0) {
      batch_id = existingBatch[0].id;
      previous_quantity = existingBatch[0].current_quantity;
      new_quantity = previous_quantity + parseInt(quantity);
      
      await connection.query(
        'UPDATE medicine_batches SET current_quantity = ?, quantity_received = quantity_received + ? WHERE id = ?',
        [new_quantity, quantity, batch_id]
      );
    } else {
      const [batchResult] = await connection.query(
        `INSERT INTO medicine_batches (medicine_id, batch_number, manufacturing_date, expiry_date, purchase_price, selling_price, quantity_received, current_quantity, supplier_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [medicine_id, batch_number, manufacturing_date, expiry_date, purchase_price, selling_price, quantity, quantity, supplier_id]
      );
      batch_id = batchResult.insertId;
    }

    // 2. Create Stock Transaction
    await connection.query(
      `INSERT INTO stock_transactions (medicine_id, batch_id, transaction_type, quantity, previous_quantity, new_quantity, user_id, reason)
       VALUES (?, ?, 'STOCK_IN', ?, ?, ?, ?, ?)`,
      [medicine_id, batch_id, quantity, previous_quantity, new_quantity, user_id, 'New stock received']
    );

    await connection.commit();
    res.json({ success: true, message: 'Stock received successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Stock In error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during stock in' });
  } finally {
    connection.release();
  }
};

// Get Inventory (Stock Levels with Batches)
const getInventory = async (req, res) => {
  try {
    const query = `
      SELECT m.id as medicine_id, m.name, m.medicine_code, m.minimum_stock, 
             b.id as batch_id, b.batch_number, b.expiry_date, b.selling_price, b.current_quantity as stock,
             DATEDIFF(b.expiry_date, CURDATE()) as days_to_expiry
      FROM medicines m
      JOIN medicine_batches b ON m.id = b.medicine_id
      WHERE b.current_quantity > 0
      ORDER BY b.expiry_date ASC
    `;
    const [rows] = await pool.query(query);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { stockIn, getInventory };
