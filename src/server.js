const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const seedData = require('./utils/seedData');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/partners', require('./routes/partnerRoutes'));
app.use('/api/partnerships', require('./routes/partnershipRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/sports', require('./routes/sportRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Sports Partnership API running smoothly' });
});

// Admin reseed endpoint
app.post('/api/seed/reset', async (req, res) => {
  try {
    await seedData(true, true);
    res.json({ success: true, message: 'Database successfully reseeded with full 6-tier hierarchy and sample transactions' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/seed/demo', async (req, res) => {
  try {
    await seedData(true, true);
    res.json({ success: true, message: 'Full demo dataset provisioned successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Serve Angular static production build
const frontendBrowserPath = path.join(__dirname, '../../frontend/dist/sports-partnership-frontend/browser');
const frontendRootPath = path.join(__dirname, '../../frontend/dist/sports-partnership-frontend');

app.use(express.static(frontendBrowserPath));
app.use(express.static(frontendRootPath));

// Fallback to index.html for Angular SPA client-side routing
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    const browserIndex = path.join(frontendBrowserPath, 'index.html');
    if (fs.existsSync(browserIndex)) {
      res.sendFile(browserIndex);
    } else {
      res.sendFile(path.join(frontendRootPath, 'index.html'));
    }
  } else {
    res.status(404).json({ success: false, message: 'API Endpoint not found' });
  }
});

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  await seedData(false);
  app.listen(PORT, () => {
    console.log(`Sports Partnership Platform running at: http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
});
