const pool = require('../config/db');

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, username, email, role, status, profile_image, created_at FROM users ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Toggle user status (ACTIVE / INACTIVE)
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent admin from deactivating themselves
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot change your own status' });
    }

    const [users] = await pool.query('SELECT status FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const newStatus = users[0].status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await pool.query('UPDATE users SET status = ? WHERE id = ?', [newStatus, id]);

    // Audit log
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, module, record_id, description) VALUES (?, 'TOGGLE_USER_STATUS', 'USERS', ?, ?)`,
      [req.user.id, id, `Changed user status to ${newStatus}`]
    );

    res.json({ success: true, message: `User status changed to ${newStatus}`, data: { status: newStatus } });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getAllUsers, toggleUserStatus };
