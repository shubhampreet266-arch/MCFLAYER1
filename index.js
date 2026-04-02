const mineflayer = require('mineflayer');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// ===== WEB SERVER =====
let botStatus = { connected: false, uptime: 0, attempts: 0, lastError: 'None' };
const startTime = Date.now();

app.get('/', (req, res) => {
  botStatus.uptime = Math.floor((Date.now() - startTime) / 1000);
  res.send(`<h1>${botStatus.connected ? '🟢 ONLINE' : '🔴 OFFLINE'}</h1>`);
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
let lastAttackTime = 0;

// ===== QUOTES =====
const quotes = [
  "Technoblade never dies.",
  "Blood for the Blood God!",
  "One of us.",
  "YOU MORON!",
  "Not even close."
];

const attackLines = [
  "YOU DARE STRIKE ME, %player%?",
  "You have made a grave mistake, %player%.",
  "Technoblade never dies."
];

// ===== RANDOM CHAT =====
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

    const delay = Math.floor(Math.random() * 90000) + 30000;
    chatTimeout = setTimeout(sendMessage, delay);
  }

  sendMessage();
}

// ===== START BOT =====
function startBot() {
  console.log("Connecting...");

  const bot = mineflayer.createBot(botArgs);

  bot.on('spawn', () => {
    botStatus.connected = true;
    console.log('✅ Bot joined');

    bot.chat('/skin Technoblade');

    // Anti AFK
    if (afkInterval) clearInterval(afkInterval);
    afkInterval = setInterval(() => {
      if (!bot.entity) return;
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 400);
    }, 30000);

    startRandomChat(bot);
  });

  // ===== RELIABLE ATTACK DETECTION =====
  bot.on('entityHurt', (entity) => {
    if (!bot.entity || entity.id !== bot.entity.id) return;

    const now = Date.now();

    // prevent spam trigger
    if (now - lastAttackTime < 2000) return;
    lastAttackTime = now;

    // find CLOSEST player within 4 blocks (actual hit range)
    const attacker = bot.nearestEntity(e =>
      e.type === 'player' &&
      e.username !== bot.username &&
      e.position.distanceTo(bot.entity.position) < 4
    );

    if (!attacker) {
      console.log("⚠️ No attacker found");
      return;
    }

    console.log(`⚔️ Attacked by ${attacker.username}`);

    const line = attackLines[
      Math.floor(Math.random() * attackLines.length)
    ].replace("%player%", attacker.username);

    bot.chat(line);

    setTimeout(() => {
      bot.chat(`/kill ${attacker.username}`);
    }, 1000);
  });

  bot.on('end', () => {
    botStatus.connected = false;
    botStatus.attempts++;

    if (afkInterval) clearInterval(afkInterval);
    if (chatTimeout) clearTimeout(chatTimeout);

    setTimeout(startBot, 30000);
  });

  bot.on('error', (err) => {
    botStatus.lastError = err.message;
    console.log(err);
  });
}

// ===== START =====
startBot();
