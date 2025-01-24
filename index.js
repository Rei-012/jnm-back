const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());

app.use(cors({
    origin: 'https://jnm-back-1.onrender.com.com',  // Replace with your frontend URL
    methods: 'GET, POST, PUT, DELETE',
    allowedHeaders: 'Content-Type, Authorization'
}));

// MySQL Database Connection
const db = mysql.createConnection({
    host: 'sql12.freesqldatabase.com',      // Change this to your MySQL host (e.g., IP address or hostname)
    user: 'sql12759142',           // Replace with your MySQL username
    password: 'emTAIpRLLw', // Replace with your MySQL password
    database: 'sql12759142',    // The database we created earlier
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

// Start Server
const PORT = 3300;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
