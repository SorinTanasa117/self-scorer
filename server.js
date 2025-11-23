const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;

const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the SQLite database.');
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS positives (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    date TEXT,
    score INTEGER,
    baseScore INTEGER,
    count INTEGER,
    userId INTEGER,
    FOREIGN KEY (userId) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS custom_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    score INTEGER,
    userId INTEGER,
    FOREIGN KEY (userId) REFERENCES users(id)
  )`);
});

app.use(express.static('.'));
app.use(express.json());

// Add a logger middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, 'your_secret_key', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// User registration
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], function(err) {
    if (err) {
      if (err.code === 'SQLITE_CONSTRAINT') {
        return res.status(409).json({ message: 'Username already exists' });
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
    res.status(201).json({ message: 'User registered successfully' });
  });
});

// User login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ username: user.username }, 'your_secret_key', {
      expiresIn: '1h'
    });

    res.json({ token });
  });
});

// Get all positives for the logged-in user
app.get('/api/positives', authenticateToken, (req, res) => {
  db.get('SELECT id FROM users WHERE username = ?', [req.user.username], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Internal server error' });
    }
    db.all('SELECT * FROM positives WHERE userId = ?', [row.id], (err, rows) => {
      if (err) {
        return res.status(500).json({ message: 'Internal server error' });
      }
      res.json(rows);
    });
  });
});

// Add a positive for the logged-in user
app.post('/api/positives', authenticateToken, (req, res) => {
  const { name, date, score, baseScore, count } = req.body;
  db.get('SELECT id FROM users WHERE username = ?', [req.user.username], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Internal server error' });
    }
    db.run('INSERT INTO positives (name, date, score, baseScore, count, userId) VALUES (?, ?, ?, ?, ?, ?)',
      [name, date, score, baseScore, count, row.id], function(err) {
      if (err) {
        return res.status(500).json({ message: 'Internal server error' });
      }
      res.status(201).json({ id: this.lastID });
    });
  });
});

// Get all custom templates for the logged-in user
app.get('/api/templates', authenticateToken, (req, res) => {
  db.get('SELECT id FROM users WHERE username = ?', [req.user.username], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Internal server error' });
    }
    db.all('SELECT * FROM custom_templates WHERE userId = ?', [row.id], (err, rows) => {
      if (err) {
        return res.status(500).json({ message: 'Internal server error' });
      }
      res.json(rows);
    });
  });
});

// Add a custom template for the logged-in user
app.post('/api/templates', authenticateToken, (req, res) => {
  const { name, score } = req.body;
  db.get('SELECT id FROM users WHERE username = ?', [req.user.username], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Internal server error' });
    }
    db.run('INSERT INTO custom_templates (name, score, userId) VALUES (?, ?, ?)',
      [name, score, row.id], function(err) {
      if (err) {
        return res.status(500).json({ message: 'Internal server error' });
      }
      res.status(201).json({ id: this.lastID });
    });
  });
});

app.get('/', (req, res) => {
  res.send('Hello from the Self-Appreciation App backend!');
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
