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
      frequency VARCHAR(20) DEFAULT 'ONCE',
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


  console.log('Postgres setup complete');
  client.end().catch(() => {});
}

module.exports = setupPostgres;
