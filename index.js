require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(bodyParser.json());

app.use(cors({
    origin: 'https://jnm-back-1.onrender.com.com',
    methods: 'GET, POST, PUT, DELETE',
    allowedHeaders: 'Content-Type, Authorization'
}));

// MySQL Database Connection
const db = mysql.createConnection({
    host: 'sql12.freesqldatabase.com',
    user: 'sql12759142',
    password: 'emTAIpRLLw',
    database: 'sql12759142',
    port: 3306
});

// Connect to MySQL
db.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to MySQL database jn_mysql');
});

// Function to handle reconnect
function handleDisconnect() {
    db.connect(err => {
        if (err) {
            console.error('Error connecting to the database:', err);
            setTimeout(handleDisconnect, 2000); // Try reconnecting in 2 seconds
            return;
        }
        console.log('Connected to MySQL database');
    });

    db.on('error', err => {
        console.error('MySQL error:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect(); // Reconnect if connection is lost
        } else {
            throw err;
        }
    });
}

handleDisconnect();
// API Endpoints

// --- User Registration (Admin & Cashier) ---
app.post('/register', async (req, res) => {
    const { username, password, role, name, email, age } = req.body;

    // Validate input
    if (!username || !password || !role || !name || !email || !age) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO users (username, password, role, name, email, age) VALUES (?, ?, ?, ?, ?, ?)';

    db.query(query, [username, hashedPassword, role, name, email, age], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'Username or email already exists!' });
            }
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'User registered successfully' });
    });
});

// --- Authentication (Admin & Cashier Login) ---
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const query = 'SELECT * FROM users WHERE username = ?';

    db.query(query, [username], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'User not found' });

        const user = results[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    });
});

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
    const { username, password, name, email, role, age } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10); // Hash the password
    const query = 'INSERT INTO users (username, password, name, email, role, age) VALUES (?, ?, ?, ?, ?, ?)';

    db.query(query, [username, hashedPassword, name, email, role, age], (err, results) => {
        if (err) {
            console.error('Error creating user:', err);
            res.status(500).send('Server error');
            return;
        }
        res.json({ success: true, id: results.insertId });
    });
});

// --- Update User (excluding password) ---
app.put('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    const { username, role, name, email, age } = req.body;

    // Prepare the update fields dynamically
    const fieldsToUpdate = {};
    if (username) fieldsToUpdate.username = username;
    if (role) fieldsToUpdate.role = role;
    if (name) fieldsToUpdate.name = name;
    if (email) fieldsToUpdate.email = email;
    if (age !== undefined) fieldsToUpdate.age = age;

    // Check if there are fields to update
    if (Object.keys(fieldsToUpdate).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
    }

    // Build the SET clause dynamically
    const setClause = Object.keys(fieldsToUpdate)
        .map(field => `${field} = ?`)
        .join(', ');

    // Prepare values for the query
    const values = [...Object.values(fieldsToUpdate), userId];

    // Update query
    const query = `UPDATE users SET ${setClause} WHERE id = ?`;

    db.query(query, values, (err, results) => {
        if (err) {
            console.error('Error updating user:', err);
            return res.status(500).json({ error: 'Server error' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ success: true });
    });
});

// --- Change User Password ---
app.patch('/api/users/:id/password', async (req, res) => {
    const userId = req.params.id;
    const { password } = req.body;

    // Validate input
    if (!password) {
        return res.status(400).json({ error: 'Password is required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'UPDATE users SET password = ? WHERE id = ?';

    db.query(query, [hashedPassword, userId], (err, results) => {
        if (err) {
            console.error('Error changing password:', err);
            res.status(500).send('Server error');
            return;
        }
        if (results.affectedRows === 0) {
            res.status(404).send('User not found');
            return;
        }
        res.json({ success: true, message: 'Password updated successfully' });
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

// Get All Products
app.get('/products', (req, res) => {
    const query = 'SELECT * FROM products';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results); // Return the list of products as JSON
    });
});

// Add New Product
app.post('/products', (req, res) => {
    const { name, price, stock_quantity } = req.body;
    const query = 'INSERT INTO products (name, price, stock_quantity) VALUES (?, ?, ?)';

    db.query(query, [name, price, stock_quantity], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Product added successfully', productId: result.insertId });
    });
});

// Update Product
app.put('/products/:id', (req, res) => {
    const { id } = req.params;
    const { name, price, stock_quantity } = req.body;
    const query = 'UPDATE products SET name = ?, price = ?, stock_quantity = ? WHERE product_id = ?';

    db.query(query, [name, price, stock_quantity, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Product updated successfully' });
    });
});

// Delete Product
app.delete('/products/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM products WHERE product_id = ?';

    db.query(query, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Product deleted successfully' });
    });
});

// Delete All Products
app.delete('/products', (req, res) => {
    const query = 'DELETE FROM products';
    db.query(query, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'All products deleted successfully' });
    });
});

// Start Server
const PORT = 3300;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});