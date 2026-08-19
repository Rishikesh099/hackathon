const bcrypt = require('bcrypt');
const db = require('../database/db');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // 1. Basic validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // 2. Hash the password for security
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Insert the new user into the database
    const [result] = await db.execute(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );

    // 4. Send success response back to the frontend
    res.status(201).json({ 
      message: 'User registered successfully!', 
      userId: result.insertId 
    });

  } catch (error) {
    console.error('Registration Error:', error.message);
    
    // If the email is already in the database
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Verify both fields were filled out
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // 2. Look for the user in the database by their email
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    // 3. Compare the typed password with the scrambled password saved in the database
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 4. Generate the "VIP wristband" (JWT Token)
    const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET || 'supersecretjwtkey',
  { expiresIn: '24h' }
);

    // 5. Send the success response and the token back to the frontend
    res.status(200).json({ 
      message: 'Login successful!', 
      token: token,
      role: user.role,
      name: user.name
    });

  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};