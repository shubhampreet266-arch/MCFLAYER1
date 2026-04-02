const mineflayer = require('mineflayer');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// ===== WEB SERVER (Keep Alive) =====
let botStatus = { connected: false, uptime: 0, attempts: 0, lastError: 'None' };
const startTime = Date.now();

app.get('/', (req, res) => {
  botStatus.uptime = Math.floor((Date.now() - startTime) / 1000);
  res.send(`
    <body style="background:#111;color:#eee;font-family:sans-serif;text-align:center;padding-top:50px;">
      <h1>${botStatus.connected ? '🟢 ONLINE' : '🔴 OFFLINE'}</h1>
      <p>Uptime: ${botStatus.uptime}s | Reconnects: ${botStatus.attempts}</p>
      <p>Last Error: ${botStatus.lastError}</p>
    </body>
  `);
});

app.listen(port, () => console.log(`Web server running on ${port}`));

// ===== BOT CONFIG =====
const botArgs = {
  host: 'Pixelcraft-kgp9.aternos.me',
  port: 30780,
  username: 'Technoblade',
  auth: 'offline',
  version: false,
  connectTimeout: 60000,
  checkTimeoutInterval: 90000
};

let afkInterval = null;
let chatInterval = null;

// ===== TECHNOBLADE QUOTES =====
const quotes = [
  "Technoblade never dies.",
  "Blood for the Blood God!",
  "One of us.",
  "Do not reveal your strategies in a YouTube video, you fool!",
  "YOU MORON!",
  "I win these.",
  "Not even close.",
  "The Blade."
];

// ===== START BOT =====
function startBot() {
  console.log(`[${new Date().toLocaleTimeString()}] Connecting...`);

  const bot = mineflayer.createBot(botArgs);

  bot.on('spawn', () => {
    botStatus.connected = true;
    console.log('✅ Bot joined');

    bot.chat('/skin Technoblade');
    bot.chat('Technoblade never dies.');

    // ===== ANTI-AFK (JUMP ONLY) =====
    if (afkInterval) clearInterval(afkInterval);
    afkInterval = setInterval(() => {
      if (!bot.entity) return;
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 500);
    }, 30000);

    // ===== RANDOM CHAT =====
    if (chatInterval) clearInterval(chatInterval);
    chatInterval = setInterval(() => {
      const msg = quotes[Math.floor(Math.random() * quotes.length)];
      bot.chat(msg);
    }, 120000); // every 2 min
  });

  // ===== AUTO KILL ATTACKER =====
  bot.on('entityHurt', (entity) => {
    if (!bot.entity) return;

    // if bot itself got hurt
    if (entity.id === bot.entity.id) {
      const attacker = bot.entity?.metadata?.[6]; // fallback (not always reliable)
      
      // safer way: attack nearest player
      const target = bot.nearestEntity(e => e.type === 'player' && e.username !== bot.username);

      if (target) {
        console.log(`⚔️ Attacked by ${target.username}`);
        bot.chat(`/kill ${target.username}`);
      }
    }
  });

  bot.on('error', (err) => {
    botStatus.lastError = err.message;
    console.log('❌ Error:', err.message);
  });

  bot.on('end', (reason) => {
    botStatus.connected = false;
    botStatus.attempts++;
    console.log(`🔌 Disconnected: ${reason}`);
    
    if (afkInterval) clearInterval(afkInterval);
    if (chatInterval) clearInterval(chatInterval);

    setTimeout(startBot, 30000);
  });
}

// ===== SAFETY =====
process.on('uncaughtException', (err) => console.log('💀 Crash:', err));
process.on('unhandledRejection', (err) => console.log('💀 Promise Crash:', err));

// ===== START =====
startBot();
