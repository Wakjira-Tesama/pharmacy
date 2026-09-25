require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function setupPostgres() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  console.log('Connected to Neon Postgres');

  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100),
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'PHARMACIST',
      status VARCHAR(20) DEFAULT 'ACTIVE',
      profile_image TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      contact_person VARCHAR(100),
      phone VARCHAR(20),
      email VARCHAR(100),
      address TEXT,
      status VARCHAR(20) DEFAULT 'ACTIVE',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS medicines (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      generic_name VARCHAR(200),
      medicine_code VARCHAR(50) UNIQUE,
      brand_name VARCHAR(150),
      category VARCHAR(100),
      dosage_form VARCHAR(50),
      strength VARCHAR(50),
      unit VARCHAR(20),
      manufacturer VARCHAR(100),
      description TEXT,
      minimum_stock INT DEFAULT 10,
      requires_prescription BOOLEAN DEFAULT FALSE,
      status VARCHAR(20) DEFAULT 'ACTIVE',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS medicine_batches (
      id SERIAL PRIMARY KEY,
      medicine_id INT NOT NULL REFERENCES medicines(id),
      batch_number VARCHAR(50) NOT NULL,
      manufacturing_date DATE,
      expiry_date DATE NOT NULL,
      purchase_price NUMERIC(10,2) NOT NULL,
      selling_price NUMERIC(10,2) NOT NULL,
      quantity_received INT NOT NULL,
      current_quantity INT NOT NULL DEFAULT 0,
      supplier_id INT REFERENCES suppliers(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS stock_transactions (
      id SERIAL PRIMARY KEY,
      medicine_id INT NOT NULL REFERENCES medicines(id),
      batch_id INT NOT NULL REFERENCES medicine_batches(id),
      transaction_type VARCHAR(20) NOT NULL,
      quantity INT NOT NULL,
      previous_quantity INT DEFAULT 0,
      new_quantity INT DEFAULT 0,
      reference_id INT,
      reason TEXT,
      user_id INT NOT NULL REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS sales (
      id SERIAL PRIMARY KEY,
      invoice_number VARCHAR(50) UNIQUE NOT NULL,
      user_id INT NOT NULL REFERENCES users(id),
      subtotal NUMERIC(10,2) NOT NULL,
      discount NUMERIC(10,2) DEFAULT 0,
      tax NUMERIC(10,2) DEFAULT 0,
      total NUMERIC(10,2) NOT NULL,
      payment_method VARCHAR(50) DEFAULT 'Cash',
      status VARCHAR(20) DEFAULT 'COMPLETED',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id SERIAL PRIMARY KEY,
      sale_id INT NOT NULL REFERENCES sales(id),
      medicine_id INT NOT NULL REFERENCES medicines(id),
      batch_id INT NOT NULL REFERENCES medicine_batches(id),
      quantity INT NOT NULL,
      unit_price NUMERIC(10,2) NOT NULL,
      total NUMERIC(10,2) NOT NULL
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS income_transactions (
      id SERIAL PRIMARY KEY,
      reference_type VARCHAR(50) NOT NULL,
      reference_id INT,
      amount NUMERIC(10,2) NOT NULL,
      description TEXT,
      user_id INT NOT NULL REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS expense_transactions (
      id SERIAL PRIMARY KEY,
      reference_type VARCHAR(50) NOT NULL,
      reference_id INT,
      amount NUMERIC(10,2) NOT NULL,
      description TEXT,
      user_id INT NOT NULL REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id),
      action VARCHAR(100) NOT NULL,
      module VARCHAR(50),
      record_id INT,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const pharmacistPassword = await bcrypt.hash('Pharmacy@123', 10);
  const existingUsers = await client.query('SELECT id FROM users WHERE username IN ($1, $2)', ['admin', 'pharmacist']);
  if (existingUsers.rows.length === 0) {
    await client.query(
      `INSERT INTO users (name, username, email, password_hash, role) VALUES
       ('Admin User', 'admin', 'admin@bezapharmacy.com', $1, 'ADMIN'),
       ('Pharmacist User', 'pharmacist', 'pharmacist@bezapharmacy.com', $2, 'PHARMACIST')`,
      [adminPassword, pharmacistPassword]
    );
    console.log('Seeded admin and pharmacist users');
  }

  const existingSuppliers = await client.query('SELECT id FROM suppliers LIMIT 1');
  if (existingSuppliers.rows.length === 0) {
    await client.query(`
      INSERT INTO suppliers (name, contact_person, phone, email) VALUES
      ('EPHARM', 'Abebe Kebede', '+251911123456', 'epharm@example.com'),
      ('Cadila Pharma', 'Sara Tesfaye', '+251922234567', 'cadila@example.com')
    `);
  }

  const existingMeds = await client.query('SELECT id FROM medicines LIMIT 1');
  if (existingMeds.rows.length === 0) {
    await client.query(`
      INSERT INTO medicines (name, generic_name, medicine_code, category, dosage_form, strength, manufacturer, minimum_stock) VALUES
      ('Paracetamol 500mg', 'Paracetamol', 'MED001', 'Pain Relief', 'Tablet', '500mg', 'EPHARM', 20),
      ('Amoxicillin 500mg', 'Amoxicillin', 'MED002', 'Antibiotic', 'Capsule', '500mg', 'Cadila', 15),
      ('Ibuprofen 400mg', 'Ibuprofen', 'MED003', 'Pain Relief', 'Tablet', '400mg', 'EPHARM', 20),
      ('Ciprofloxacin 500mg', 'Ciprofloxacin', 'MED004', 'Antibiotic', 'Tablet', '500mg', 'Cadila', 10),
      ('Metformin 500mg', 'Metformin', 'MED005', 'Diabetes', 'Tablet', '500mg', 'EPHARM', 25),
      ('Omeprazole 20mg', 'Omeprazole', 'MED006', 'Gastrointestinal', 'Capsule', '20mg', 'Cadila', 15),
      ('Amlodipine 5mg', 'Amlodipine', 'MED007', 'Cardiovascular', 'Tablet', '5mg', 'EPHARM', 20),
      ('Atenolol 50mg', 'Atenolol', 'MED008', 'Cardiovascular', 'Tablet', '50mg', 'Cadila', 15),
      ('Diazepam 5mg', 'Diazepam', 'MED009', 'Sedative', 'Tablet', '5mg', 'EPHARM', 10),
      ('Cetirizine 10mg', 'Cetirizine', 'MED010', 'Antihistamine', 'Tablet', '10mg', 'Cadila', 20),
      ('Azithromycin 250mg', 'Azithromycin', 'MED011', 'Antibiotic', 'Tablet', '250mg', 'EPHARM', 12),
      ('Metronidazole 400mg', 'Metronidazole', 'MED012', 'Antibiotic', 'Tablet', '400mg', 'Cadila', 15),
      ('Diclofenac 50mg', 'Diclofenac', 'MED013', 'Pain Relief', 'Tablet', '50mg', 'EPHARM', 18),
      ('Prednisolone 5mg', 'Prednisolone', 'MED014', 'Steroid', 'Tablet', '5mg', 'Cadila', 10),
      ('Salbutamol Inhaler', 'Salbutamol', 'MED015', 'Respiratory', 'Inhaler', '100mcg', 'EPHARM', 8),
      ('Doxycycline 100mg', 'Doxycycline', 'MED016', 'Antibiotic', 'Capsule', '100mg', 'Cadila', 15),
      ('Losartan 50mg', 'Losartan', 'MED017', 'Cardiovascular', 'Tablet', '50mg', 'EPHARM', 20),
      ('Furosemide 40mg', 'Furosemide', 'MED018', 'Diuretic', 'Tablet', '40mg', 'Cadila', 15),
      ('Vitamin C 500mg', 'Ascorbic Acid', 'MED019', 'Vitamin', 'Tablet', '500mg', 'EPHARM', 30),
      ('ORS Powder', 'ORS', 'MED020', 'Rehydration', 'Powder', 'Sachet', 'EPHARM', 50)
    `);
  }

  const existingBatches = await client.query('SELECT id FROM medicine_batches LIMIT 1');
  if (existingBatches.rows.length === 0) {
    await client.query(`
      INSERT INTO medicine_batches (medicine_id, batch_number, manufacturing_date, expiry_date, purchase_price, selling_price, quantity_received, current_quantity, supplier_id) VALUES
      (1, 'B001', '2025-06-01', '2027-06-01', 5, 10, 200, 150, 1),
      (2, 'B002', '2025-07-01', '2027-01-01', 15, 25, 100, 80, 2),
      (3, 'B003', '2025-05-01', '2027-05-01', 8, 15, 150, 120, 1),
      (4, 'B004', '2025-08-01', '2026-12-01', 20, 35, 80, 60, 2),
      (5, 'B005', '2025-06-15', '2027-06-15', 10, 18, 200, 180, 1),
      (6, 'B006', '2025-07-10', '2027-07-10', 12, 22, 100, 90, 2),
      (7, 'B007', '2025-04-01', '2027-04-01', 8, 14, 150, 130, 1),
      (8, 'B008', '2025-09-01', '2027-09-01', 6, 12, 100, 95, 2),
      (9, 'B009', '2025-03-01', '2026-10-01', 15, 28, 50, 45, 1),
      (10, 'B010', '2025-08-01', '2027-08-01', 4, 8, 200, 190, 2),
      (11, 'B011', '2025-06-01', '2027-02-01', 18, 30, 80, 70, 1),
      (12, 'B012', '2025-07-15', '2027-07-15', 7, 13, 120, 100, 2),
      (13, 'B013', '2025-05-20', '2027-05-20', 6, 11, 160, 140, 1),
      (14, 'B014', '2025-09-01', '2027-03-01', 10, 20, 60, 55, 2),
      (15, 'B015', '2025-04-15', '2027-04-15', 80, 150, 30, 25, 1),
      (16, 'B016', '2025-08-20', '2027-08-20', 12, 22, 90, 85, 2),
      (17, 'B017', '2025-06-10', '2027-06-10', 14, 25, 100, 90, 1),
      (18, 'B018', '2025-07-05', '2027-07-05', 5, 10, 120, 110, 2),
      (19, 'B019', '2025-05-01', '2027-11-01', 3, 6, 300, 280, 1),
      (20, 'B020', '2025-06-01', '2027-12-01', 2, 5, 500, 450, 1)
    `);
  }

  console.log('Postgres setup complete');
  client.end().catch(() => {});
}

module.exports = setupPostgres;
