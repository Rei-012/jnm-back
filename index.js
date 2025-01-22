const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// MySQL Database Connection
const db = mysql.createConnection({
    host: 'localhost',      // Change this to your MySQL host (e.g., IP address or hostname)
    user: 'root',           // Replace with your MySQL username
    password: '', // Replace with your MySQL password
    database: 'jn_mysql'    // The database we created earlier
});

// Connect to MySQL
db.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to MySQL database jn_mysql');
});

// API Endpoints

// Fetch All Users
app.get('/api/users', (req, res) => {
    const query = 'SELECT * FROM users';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            res.status(500).send('Server error');
            return;
        }
        res.json(results);
    });
});

// Fetch User by ID
app.get('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    const query = 'SELECT * FROM users WHERE id = ?';
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching user:', err);
            res.status(500).send('Server error');
            return;
        }
        if (results.length === 0) {
            res.status(404).send('User not found');
            return;
        }
        res.json(results[0]);
    });
});

// Create New User
app.post('/api/users', (req, res) => {
    const { name, email, age } = req.body;
    const query = 'INSERT INTO users (name, email, age) VALUES (?, ?, ?)';
    db.query(query, [name, email, age], (err, results) => {
        if (err) {
            console.error('Error creating user:', err);
            res.status(500).send('Server error');
            return;
        }
        res.json({ success: true, id: results.insertId });
    });
});

// Update User by ID
app.put('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    const { name, email, age } = req.body;
    const query = 'UPDATE users SET name = ?, email = ?, age = ? WHERE id = ?';
    db.query(query, [name, email, age, userId], (err, results) => {
        if (err) {
            console.error('Error updating user:', err);
            res.status(500).send('Server error');
            return;
        }
        if (results.affectedRows === 0) {
            res.status(404).send('User not found');
            return;
        }
        res.json({ success: true });
    });
});

// Delete User by ID
app.delete('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    const query = 'DELETE FROM users WHERE id = ?';
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error deleting user:', err);
            res.status(500).send('Server error');
            return;
        }
        if (results.affectedRows === 0) {
            res.status(404).send('User not found');
            return;
        }
        res.json({ success: true });
    });
});

// Start Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
