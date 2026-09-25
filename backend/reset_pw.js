const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function run() {
  try {
    const con = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '1234',
      database: 'pharmacy_db'
    });
    
    const adminHash = await bcrypt.hash('Admin@123', 10);
    await con.execute('UPDATE users SET password_hash = ? WHERE username = ?', [adminHash, 'admin']);
    
    const pharmacistHash = await bcrypt.hash('Pharmacy@123', 10);
    await con.execute('UPDATE users SET password_hash = ? WHERE username = ?', [pharmacistHash, 'pharmacist']);
    
    console.log('Passwords properly hashed and reset!');
    process.exit(0);
  } catch(e) {
    console.error(e.message);
    process.exit(1);
  }
}
run();
