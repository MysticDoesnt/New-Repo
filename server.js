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
const PROTECTED_APP_URL = process.env.PROTECTED_APP_URL || 'https://cloudy-casey-mysticdoesnt-591d8e3c.koyeb.app';

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

  // You can set your logo URL here, or via environment variable
  const logoUrl = process.env.LOGO_URL || 'https://via.placeholder.com/150x150/6366f1/ffffff?text=LOGO';

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Login Required</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                padding: 20px;
            }
            
            .login-container {
                background: #1e293b;
                padding: 40px;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                width: 100%;
                max-width: 420px;
                border: 1px solid #334155;
            }
            
            .logo-container {
                text-align: center;
                margin-bottom: 30px;
            }
            
            .logo {
                width: 120px;
                height: 120px;
                border-radius: 12px;
                object-fit: contain;
                background: #334155;
                padding: 10px;
            }
            
            h2 {
                text-align: center;
                color: #f1f5f9;
                margin-bottom: 10px;
                font-size: 24px;
                font-weight: 600;
            }
            
            .subtitle {
                text-align: center;
                color: #94a3b8;
                margin-bottom: 30px;
                font-size: 14px;
            }
            
            .form-group {
                margin-bottom: 20px;
            }
            
            label {
                display: block;
                margin-bottom: 8px;
                color: #cbd5e1;
                font-size: 14px;
                font-weight: 500;
            }
            
            input[type="text"], 
            input[type="password"] {
                width: 100%;
                padding: 12px 16px;
                border: 1px solid #334155;
                border-radius: 8px;
                font-size: 16px;
                background: #0f172a;
                color: #f1f5f9;
                transition: all 0.3s ease;
            }
            
            input[type="text"]:focus, 
            input[type="password"]:focus {
                outline: none;
                border-color: #6366f1;
                box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
            }
            
            input::placeholder {
                color: #64748b;
            }
            
            .login-btn {
                width: 100%;
                background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
                color: white;
                padding: 14px;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                margin-top: 10px;
            }
            
            .login-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 25px rgba(99, 102, 241, 0.3);
            }
            
            .login-btn:active {
                transform: translateY(0);
            }
            
            .error {
                color: #fca5a5;
                text-align: center;
                margin-bottom: 20px;
                padding: 12px;
                background: rgba(239, 68, 68, 0.1);
                border: 1px solid rgba(239, 68, 68, 0.3);
                border-radius: 8px;
                font-size: 14px;
            }
            
            .lock-icon {
                font-size: 48px;
                margin-bottom: 10px;
            }
        </style>
    </head>
    <body>
        <div class="login-container">
            <div class="logo-container">
                <img src="${logoUrl}" alt="Logo" class="logo">
            </div>
            <div class="lock-icon">🔒</div>
            <h2>Authentication Required</h2>
            <p class="subtitle">Please sign in to continue</p>
            
            ${error ? `<div class="error">❌ ${error}</div>` : ''}
            
            <form method="POST" action="/login">
                <div class="form-group">
                    <label for="username">Username</label>
                    <input type="text" id="username" name="username" placeholder="Enter your username" required autofocus>
                </div>
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" placeholder="Enter your password" required>
                </div>
                <button type="submit" class="login-btn">Sign In</button>
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
