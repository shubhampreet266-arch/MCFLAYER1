const mineflayer = require('mineflayer');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// 1. WEB SERVER (Keep-Alive & Status)
let botStatus = { connected: false, uptime: 0, attempts: 0, lastError: 'None' };
const startTime = Date.now();

app.get('/', (req, res) => {
  botStatus.uptime = Math.floor((Date.now() - startTime) / 1000);
  res.send(`
    <body style="background: #111; color: #eee; font-family: sans-serif; text-align: center; padding-top: 50px;">
      <h1>Bot Status: ${botStatus.connected ? '🟢 ONLINE' : '🔴 OFFLINE'}</h1>
      <p>Uptime: ${botStatus.uptime}s | Reconnects: ${botStatus.attempts}</p>
      <p>Last Error: ${botStatus.lastError}</p>
      <p style="color: #888;">Render will stay awake as long as cron-job.org pings this page.</p>
      <script>setTimeout(() => location.reload(), 15000);</script>
    </body>
  `);
});

app.listen(port, () => console.log(`Web server live on port ${port}`));

// 2. THE BOT CONFIG
const botArgs = {
  host: 'lamprey.aternos.host', 
  port: 30780,                  
  username: 'PixelCraftBot',
  auth: 'offline',
  version: '1.21.1',          // Hardcode the version (auto-detect can hang)
  connectTimeout: 30000,      // Kill the attempt if no response in 30s
  hideErrors: false           // Show us exactly what's happening
};



function startBot() {
  console.log(`[${new Date().toLocaleTimeString()}] Attempting to join ${botArgs.host}...`);
  const bot = mineflayer.createBot(botArgs);

  bot.on('spawn', () => {
    botStatus.connected = true;
    console.log('✅ Bot Joined! Switching to spectator...');
    bot.chat('/gamemode spectator');
    
    // Anti-AFK: Look around every 30s so Aternos doesn't kick for idling
    setInterval(() => {
      if (botStatus.connected) bot.look(Math.random() * 360, 0);
    }, 30000);
  });

  bot.on('error', (err) => {
    botStatus.lastError = err.message;
    console.log('❌ Bot Error:', err.message);
  });

  bot.on('end', (reason) => {
    botStatus.connected = false;
    botStatus.attempts++;
    console.log(`🔌 Disconnected (${reason}). Retrying in 30s...`);
    setTimeout(startBot, 30000);
  });
}

startBot();







