/**
 * 6ixminds Labs Tracker Backend
 * 
 * Express.js API server for internal tracker portal
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001; // Use 5001 for Tracker Backend to avoid conflict if both run locally

// ============================================
// Middleware
// ============================================

app.use(helmet());
app.use(cors()); // Configure restrictively in production

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 60000,
    max: 100,
    message: { success: false, error: 'Too many requests' },
});
app.use('/api/tracker/', limiter);

// ============================================
// Routes
// ============================================

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '6ixminds Labs Tracker API',
        timestamp: new Date().toISOString(),
    });
});

app.get('/health', (req, res) => {
    res.json({
        success: true,
        service: 'tracker-backend',
        status: 'online'
    });
});

// Tracker Routes container (placeholder for now, or mount specific routes)
// Ensure these routes are created or moved if they existed. 
// Since no specific tracker routes were found in export, we will assume 
// the tracker frontend uses Supabase directly or needs new routes here.
// Mount Tracker Routes
app.use('/api/tracker/auth', require('./routes/auth'));
app.use('/api/tracker/tasks', require('./routes/tasks'));

// Provide a default endpoint to verify API is reachable
app.get('/api/tracker/config', (req, res) => {
    res.json({
        success: true,
        message: 'Tracker API Config Endpoint',
        version: '1.0.0'
    });
});


// ============================================
// Error Handling & Startup
// ============================================

app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

const connectDB = async () => {
    try {
        const supabase = require('./config/supabaseClient');
        console.log('✅ Connected to Supabase Client');
    } catch (err) {
        console.error('❌ Supabase connection error:', err.message);
    }
};

if (require.main === module) {
    connectDB().then(() => {
        app.listen(PORT, () => {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🚀 Tracker Backend Server');
            console.log(`📡 Port: ${PORT}`);
            console.log(`🔗 Health: http://localhost:${PORT}/health`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        });
    });
}

module.exports = app;
