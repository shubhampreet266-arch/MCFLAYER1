const mineflayer = require('mineflayer');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// 1. WEB SERVER (The "App" and "Status" parts)
let botStatus = { connected: false, uptime: 0, attempts: 0, lastError: 'None' };
const startTime = Date.now();

app.get('/', (req, res) => {
  botStatus.uptime = Math.floor((Date.now() - startTime) / 1000);
  res.send(`
    <h1>Bot Status: ${botStatus.connected ? '🟢 Online' : '🔴 Offline'}</h1>
    <p>Uptime: ${botStatus.uptime}s</p>
    <p>Reconnect Attempts: ${botStatus.attempts}</p>
    <p>Last Error: ${botStatus.lastError}</p>
    <script>setTimeout(() => location.reload(), 15000);</script>
  `);
});

app.listen(port, () => console.log(`Web server live on port ${port}`));

// 2. THE BOT (The "Bot" and "Logic" parts)
const botArgs = {
  host: 'PixelCraft-kgp9.aternos.me',
  port: 30780,
  username: 'PixelCraftBot',
  version: '1.21.1',
  auth: 'offline'
};

function startBot() {
  console.log("Starting Minecraft Bot...");
  const bot = mineflayer.createBot(botArgs);

  bot.on('spawn', () => {
    botStatus.connected = true;
    console.log('Bot Joined! Setting spectator...');
    bot.chat('/gamemode spectator');
    
    // Anti-AFK: Look around every 30s
    setInterval(() => {
      if (botStatus.connected) bot.look(Math.random() * 360, 0);
    }, 30000);
  });

  bot.on('error', (err) => {
    botStatus.lastError = err.message;
    console.log('Bot Error:', err.message);
  });

  bot.on('end', (reason) => {
    botStatus.connected = false;
    botStatus.attempts++;
    console.log(`Disconnected (${reason}). Retrying in 30s...`);
    setTimeout(startBot, 30000);
  });
}

startBot();





