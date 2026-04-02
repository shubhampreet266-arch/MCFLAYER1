const mineflayer = require('mineflayer');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// ===== WEB SERVER =====
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
let chatTimeout = null;
let lastMessageTime = 0;

// ===== QUOTES =====
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

// ===== RANDOM CHAT (ANTI-SPAM SAFE) =====
function startRandomChat(bot) {
  if (chatTimeout) clearTimeout(chatTimeout);

  function sendMessage() {
    if (!botStatus.connected) return;

    const now = Date.now();
    if (now - lastMessageTime < 30000) {
      chatTimeout = setTimeout(sendMessage, 5000);
      return;
    }

    const msg = quotes[Math.floor(Math.random() * quotes.length)];
    bot.chat(msg);
    lastMessageTime = now;

    const delay = Math.floor(Math.random() * (120000 - 30000)) + 30000;
    chatTimeout = setTimeout(sendMessage, delay);
  }

  sendMessage();
}

// ===== START BOT =====
function startBot() {
  console.log(`[${new Date().toLocaleTimeString()}] Connecting...`);

  const bot = mineflayer.createBot(botArgs);

  bot.on('spawn', () => {
    botStatus.connected = true;
    console.log('✅ Bot joined');

    bot.chat('/skin Technoblade');
    bot.chat('Technoblade never dies.');

    // ===== ANTI-AFK (JUMP) =====
    if (afkInterval) clearInterval(afkInterval);
    afkInterval = setInterval(() => {
      if (!bot.entity) return;
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 400);
    }, 30000);

    // ===== RANDOM CHAT =====
    startRandomChat(bot);
  });

  // ===== RETALIATE WHEN HIT =====
  bot.on('entityHurt', (entity) => {
    if (!bot.entity) return;

    if (entity.id === bot.entity.id) {
      // Find nearest player within 6 blocks
      const attacker = bot.nearestEntity(e =>
        e.type === 'player' &&
        e.username !== bot.username &&
        e.position.distanceTo(bot.entity.position) < 6
      );

      if (attacker) {
        console.log(`⚔️ Attacked by ${attacker.username}`);
        bot.chat(`YOU DARE STRIKE ME, ${attacker.username}?`);
        bot.chat(`/kill ${attacker.username}`);
      } else {
        console.log("⚠️ Couldn't detect attacker");
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
    if (chatTimeout) clearTimeout(chatTimeout);

    setTimeout(startBot, 30000);
  });
}

// ===== SAFETY =====
process.on('uncaughtException', (err) => console.log('💀 Crash:', err));
process.on('unhandledRejection', (err) => console.log('💀 Promise Crash:', err));

// ===== START =====
startBot();
