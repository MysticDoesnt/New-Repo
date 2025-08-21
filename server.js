const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration - Change these credentials!
const VALID_USERNAME = process.env.AUTH_USERNAME || 'TOWEREMP';
const VALID_PASSWORD_HASH = process.env.AUTH_PASSWORD_HASH || bcrypt.hashSync('38.59T', 10);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true if using HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve static files
app.use('/static', express.static('public'));

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session.authenticated) {
    next();
  } else {
    res.redirect('/login');
  }
};

// Routes
app.get('/', requireAuth, (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Protected Website</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 800px;
                margin: 50px auto;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                text-align: center;
            }
            h1 { color: #333; }
            .logout-btn {
                background: #dc3545;
                color: white;
                padding: 10px 20px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                text-decoration: none;
                display: inline-block;
                margin-top: 20px;
            }
            .logout-btn:hover { background: #c82333; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎉 Welcome to the Protected Website!</h1>
            <p>Congratulations! You've successfully logged in.</p>
            <p>This is the content that only authenticated users can see.</p>
            <a href="/logout" class="logout-btn">Logout</a>
        </div>
    </body>
    </html>
  `);
});

app.get('/login', (req, res) => {
  const error = req.session.loginError;
  req.session.loginError = null; // Clear error after displaying

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Login - Protected Website</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 400px;
                margin: 100px auto;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .login-container {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h2 {
                text-align: center;
                color: #333;
                margin-bottom: 30px;
            }
            .form-group {
                margin-bottom: 20px;
            }
            label {
                display: block;
                margin-bottom: 5px;
                color: #555;
            }
            input[type="text"], input[type="password"] {
                width: 100%;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 5px;
                font-size: 16px;
                box-sizing: border-box;
            }
            .login-btn {
                width: 100%;
                background: #007bff;
                color: white;
                padding: 12px;
                border: none;
                border-radius: 5px;
                font-size: 16px;
                cursor: pointer;
            }
            .login-btn:hover {
                background: #0056b3;
            }
            .error {
                color: #dc3545;
                text-align: center;
                margin-bottom: 20px;
                padding: 10px;
                background: #f8d7da;
                border: 1px solid #f5c6cb;
                border-radius: 5px;
            }
            .info {
                background: #d1ecf1;
                border: 1px solid #bee5eb;
                color: #0c5460;
                padding: 10px;
                border-radius: 5px;
                margin-bottom: 20px;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="login-container">
            <h2>🔒 Login Required</h2>
            <div class="info">
                <strong>Default credentials:</strong><br>
                Username: TOWEREMP<br>
                Password: 38.59T
            </div>
            ${error ? `<div class="error">${error}</div>` : ''}
            <form method="POST" action="/login">
                <div class="form-group">
                    <label for="username">Username:</label>
                    <input type="text" id="username" name="username" required>
                </div>
                <div class="form-group">
                    <label for="password">Password:</label>
                    <input type="password" id="password" name="password" required>
                </div>
                <button type="submit" class="login-btn">Login</button>
            </form>
        </div>
    </body>
    </html>
  `);
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === VALID_USERNAME && bcrypt.compareSync(password, VALID_PASSWORD_HASH)) {
    req.session.authenticated = true;
    res.redirect('/');
  } else {
    req.session.loginError = 'Invalid username or password';
    res.redirect('/login');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/login');
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).send(`
    <h1>404 - Page Not Found</h1>
    <p><a href="/">Go to Home</a></p>
  `);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Default login: TOWEREMP / 38.59T`);
});

module.exports = app;
