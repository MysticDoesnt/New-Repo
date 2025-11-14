const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration - Change these credentials!
const VALID_USERNAME = process.env.AUTH_USERNAME || 'TOWEREMP';
const VALID_PASSWORD_HASH = process.env.AUTH_PASSWORD_HASH || bcrypt.hashSync('38.59T', 10);

// The URL of your protected app
const PROTECTED_APP_URL = process.env.PROTECTED_APP_URL;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session.authenticated) {
    next();
  } else {
    res.redirect('/login');
  }
};

// Login page
app.get('/login', (req, res) => {
  const error = req.session.loginError;
  req.session.loginError = null;

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Login Required</title>
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
        </style>
    </head>
    <body>
        <div class="login-container">
            <h2>🔒 Authentication Required</h2>
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
                <button type="submit" class="login-btn">Access Application</button>
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

// Main route - either redirect or show welcome page
app.get('/', requireAuth, (req, res) => {
  // If no protected app URL is set, show a welcome page
  if (!PROTECTED_APP_URL) {
    return res.send(`
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
              .info {
                  background: #d1ecf1;
                  border: 1px solid #bee5eb;
                  color: #0c5460;
                  padding: 15px;
                  border-radius: 5px;
                  margin: 20px 0;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>🎉 Welcome!</h1>
              <p>You've successfully logged in.</p>
              <div class="info">
                  <strong>⚙️ Configuration Required:</strong><br>
                  To redirect to a protected app, set the <code>PROTECTED_APP_URL</code> environment variable in Koyeb.
              </div>
              <a href="/logout" class="logout-btn">Logout</a>
          </div>
      </body>
      </html>
    `);
  }

  // If protected app URL is set, redirect to it (ONE TIME ONLY)
  res.redirect(PROTECTED_APP_URL);
});

app.listen(PORT, () => {
  console.log(`Auth gateway running on port ${PORT}`);
  if (PROTECTED_APP_URL) {
    console.log(`Protecting: ${PROTECTED_APP_URL}`);
  } else {
    console.log(`⚠️  No PROTECTED_APP_URL set - showing welcome page`);
  }
  console.log(`Default login: TOWEREMP / 38.59T`);
});

module.exports = app;
