const pool = require('../config/db');

const processSale = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { items, payment_method } = req.body; // items: [{ batch_id, quantity }]
    const user_id = req.user.id;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Sale items cannot be empty' });
    }

    await connection.beginTransaction();

    let subtotal = 0;
    const invoice_number = 'INV-' + Date.now();

    // 1. Calculate subtotal and verify stock
    const saleItemsData = [];
    for (let item of items) {
      const [batchRows] = await connection.query(
        'SELECT b.medicine_id, b.selling_price, b.current_quantity, b.expiry_date FROM medicine_batches b WHERE b.id = ? FOR UPDATE',
        [item.batch_id]
      );

      if (batchRows.length === 0) {
        throw new Error(`Batch ${item.batch_id} not found`);
      }

      const batch = batchRows[0];
      
      // Check expiry
      const today = new Date();
      const expiry = new Date(batch.expiry_date);
      if (expiry < today) {
        throw new Error(`Cannot sell expired medicine (Batch ${item.batch_id})`);
      }

      // Check stock
      if (batch.current_quantity < item.quantity) {
        throw new Error(`Insufficient stock for Batch ${item.batch_id}`);
      }

      const itemTotal = batch.selling_price * item.quantity;
      subtotal += itemTotal;

      saleItemsData.push({
        medicine_id: batch.medicine_id,
        batch_id: item.batch_id,
        quantity: item.quantity,
        unit_price: batch.selling_price,
        total: itemTotal,
        previous_quantity: batch.current_quantity,
        new_quantity: batch.current_quantity - item.quantity
      });
    }

    const total = subtotal; // Assuming no tax/discount for this simple version

    // 2. Create Sale Record
    const [saleResult] = await connection.query(
      `INSERT INTO sales (invoice_number, user_id, subtotal, discount, tax, total, payment_method)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [invoice_number, user_id, subtotal, 0, 0, total, payment_method || 'Cash']
    );
    const sale_id = saleResult.insertId;

    // 3. Process each item (reduce stock, record transaction, sale item)
    for (let data of saleItemsData) {
      // Insert sale item
      await connection.query(
        `INSERT INTO sale_items (sale_id, medicine_id, batch_id, quantity, unit_price, total)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [sale_id, data.medicine_id, data.batch_id, data.quantity, data.unit_price, data.total]
      );

      // Reduce batch stock
      await connection.query(
        'UPDATE medicine_batches SET current_quantity = ? WHERE id = ?',
        [data.new_quantity, data.batch_id]
      );

      // Record stock transaction
      await connection.query(
        `INSERT INTO stock_transactions (medicine_id, batch_id, transaction_type, quantity, previous_quantity, new_quantity, reference_id, reason, user_id)
         VALUES (?, ?, 'SALE', ?, ?, ?, ?, 'Sale processed', ?)`,
        [data.medicine_id, data.batch_id, data.quantity, data.previous_quantity, data.new_quantity, sale_id, user_id]
      );
    }

    // 4. Record Income
    await connection.query(
      `INSERT INTO income_transactions (reference_type, reference_id, amount, description, user_id)
       VALUES ('SALE', ?, ?, ?, ?)`,
      [sale_id, total, `Income from Sale ${invoice_number}`, user_id]
    );

    // 5. Audit log
    await connection.query(
      `INSERT INTO audit_logs (user_id, action, module, record_id, description) VALUES (?, 'PROCESSED_SALE', 'SALES', ?, 'Processed new sale')`,
      [user_id, sale_id]
    );

    await connection.commit();
    res.json({ success: true, message: 'Sale processed successfully', data: { sale_id, invoice_number, total } });
  } catch (error) {
    await connection.rollback();
    console.error('Sale processing error:', error);
    // Send specific errors (like insufficient stock) directly
    if (error.message.includes('Insufficient') || error.message.includes('Cannot sell expired')) {
      res.status(400).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Internal server error during sale processing' });
    }
  } finally {
    connection.release();
  }
};

module.exports = { processSale };
