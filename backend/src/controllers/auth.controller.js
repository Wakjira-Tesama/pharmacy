const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE username = ? AND status = "ACTIVE"', [username]);
    
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or inactive account' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during login' });
  }
};

const getMe = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, username, email, role, status FROM users WHERE id = ?', [req.user.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { login, getMe };
