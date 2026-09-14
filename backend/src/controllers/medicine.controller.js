const pool = require('../config/db');

const getAllMedicines = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM medicines ORDER BY name ASC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching medicines:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getMedicineById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM medicines WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching medicine:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const createMedicine = async (req, res) => {
  try {
    const { medicine_code, name, generic_name, brand_name, category, dosage_form, strength, unit, manufacturer, minimum_stock, description } = req.body;
    
    // Check if code exists
    const [existing] = await pool.query('SELECT id FROM medicines WHERE medicine_code = ?', [medicine_code]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Medicine code already exists' });
    }

    const [result] = await pool.query(
      `INSERT INTO medicines (medicine_code, name, generic_name, brand_name, category, dosage_form, strength, unit, manufacturer, minimum_stock, description) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [medicine_code, name, generic_name, brand_name, category, dosage_form, strength, unit, manufacturer, minimum_stock || 0, description]
    );

    res.status(201).json({ success: true, message: 'Medicine created successfully', data: { id: result.insertId } });
  } catch (error) {
    console.error('Error creating medicine:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getAllMedicines, getMedicineById, createMedicine };
