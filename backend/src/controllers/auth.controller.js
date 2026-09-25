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
          role: user.role,
          profile_image: user.profile_image
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
    const [rows] = await pool.query('SELECT id, name, username, email, role, status, profile_image FROM users WHERE id = ?', [req.user.id]);
    
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

const register = async (req, res) => {
  try {
    const { name, username, email, password, role } = req.body;
    
    if (!name || !username || !password) {
      return res.status(400).json({ success: false, message: 'Name, username, and password are required' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const assignedRole = (role === 'ADMIN' || role === 'PHARMACIST') ? role : 'PHARMACIST';
    const userEmail = email || `${username}@pharmacy.local`;

    const [result] = await pool.query(
      'INSERT INTO users (name, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [name, username, userEmail, passwordHash, assignedRole]
    );

    const token = jwt.sign(
      { id: result.insertId, username, role: assignedRole, name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Registration successful',
      data: {
        token,
        user: { id: result.insertId, name, username, role: assignedRole }
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during registration' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, username, password, profile_image } = req.body;
    const userId = req.user.id;

    if (!name || !username) {
      return res.status(400).json({ success: false, message: 'Name and username are required' });
    }

    // Check if new username is already taken by someone else
    const [existing] = await pool.query('SELECT id FROM users WHERE username = ? AND id != ?', [username, userId]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Username is already taken' });
    }

    let query = 'UPDATE users SET name = ?, username = ?, profile_image = ?';
    let params = [name, username, profile_image || null];

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      query += ', password_hash = ?';
      params.push(passwordHash);
    }

    query += ' WHERE id = ?';
    params.push(userId);

    await pool.query(query, params);

    res.json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during profile update' });
  }
};

module.exports = { login, getMe, register, updateProfile };
