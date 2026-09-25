require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    // Check if column exists
    const [cols] = await connection.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'profile_image'",
      [process.env.DB_NAME]
    );

    if (cols.length === 0) {
      await connection.query("ALTER TABLE users ADD COLUMN profile_image LONGTEXT NULL AFTER status");
      console.log('✅ profile_image column added successfully');
    } else {
      // Make sure it's LONGTEXT (for base64 images)
      await connection.query("ALTER TABLE users MODIFY COLUMN profile_image LONGTEXT NULL");
      console.log('✅ profile_image column already exists, ensured LONGTEXT type');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

run();
