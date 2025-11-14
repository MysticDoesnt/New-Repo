const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration - Change these!
const VALID_USERNAME = process.env.AUTH_USERNAME || 'TOWEREMP';
const VALID_PASSWORD_HASH = process.env.AUTH_PASSWORD_HASH || bcrypt.hashSync('38.59T', 10);

// The URL of the app you want to protect
const PROTECTED_APP_URL = process.env.PROTECTED_APP_URL || 'https://your-other-app.koyeb.app';

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
                    <input type="text" id="username" name="username" required autofocus>
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

// Handle login
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

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/login');
  });
});

// Proxy all other requests to the protected app (after authentication)
app.use('/', requireAuth, createProxyMiddleware({
  target: PROTECTED_APP_URL,
  changeOrigin: true,
  ws: true, // Enable WebSocket proxying
  onProxyReq: (proxyReq, req, res) => {
    // Forward the original host header
    proxyReq.setHeader('X-Forwarded-Host', req.headers.host);
    proxyReq.setHeader('X-Forwarded-Proto', req.protocol);
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).send(`
      <h1>Error connecting to application</h1>
      <p>Unable to connect to the protected application.</p>
      <p><a href="/logout">Logout</a></p>
    `);
  }
}));

app.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
  console.log(`Protecting: ${PROTECTED_APP_URL}`);
  console.log(`Login: ${VALID_USERNAME} / (password hidden)`);
});

module.exports = app;
