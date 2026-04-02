const mineflayer = require('mineflayer');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// ===== WEB SERVER =====
let botStatus = { connected: false, attempts: 0 };
app.get('/', (req, res) => res.send(botStatus.connected ? "ONLINE" : "OFFLINE"));
app.listen(port);

// ===== BOT CONFIG =====
const botArgs = {
  host: 'Pixelcraft-kgp9.aternos.me',
  port: 30780,
  username: 'Technoblade',
  auth: 'offline',
  version: false
};

let afkInterval = null;
let chatTimeout = null;
let activeExecution = false;

// ===== QUOTES =====
const quotes = [
  "Technoblade never dies.",
  "Blood for the Blood God!",
  "One of us.",
  "YOU MORON!",
  "Do not reveal your strategies in a YouTube video, you fool!",
  "I win these.",
  "Not even close.",
  "The Blade."
];

const attackLines = [
  "YOU DARE STRIKE ME, %target%?",
  "You chose death, %target%.",
  "You made a mistake, %target%.",
  "Technoblade never dies.",
  "Blood for the Blood God!"
];

// ===== RANDOM CHAT =====
function startChat(bot) {
  if (chatTimeout) clearTimeout(chatTimeout);

  function loop() {
    if (!botStatus.connected) return;

    const msg = quotes[Math.floor(Math.random() * quotes.length)];
    bot.chat(msg);

    const delay = Math.floor(Math.random() * 90000) + 30000;
    chatTimeout = setTimeout(loop, delay);
  }

  loop();
}

// ===== SAFE ATTACKER DETECTION (PLAYER + MOB) =====
function getAttacker(bot) {
  if (!bot.entity) return null;

  return bot.nearestEntity(e =>
    e &&
    e.id !== bot.entity.id &&
    e.position &&
    e.position.distanceTo(bot.entity.position) < 5
  );
}

// ===== SAFE EXECUTION =====
function executeTarget(bot, target) {
  if (!target) return;
  if (activeExecution) return;

  activeExecution = true;

  const name = target.username || target.name || "something";

  const line = attackLines[
    Math.floor(Math.random() * attackLines.length)
  ].replace("%target%", name);

  bot.chat(line);

  let timeLeft = 10;

  const interval = setInterval(() => {
    if (!botStatus.connected) {
      clearInterval(interval);
      activeExecution = false;
      return;
    }

    if (timeLeft <= 0) {
      clearInterval(interval);

      try {
        if (target.username) {
          // PLAYER
          bot.chat(`/kill ${target.username}`);
        } else if (target.name) {
          // MOB
          bot.chat(`/kill @e[type=${target.name},distance=..5,limit=1]`);
        }
      } catch (e) {
        console.log("Kill failed:", e.message);
      }

      activeExecution = false;
      return;
    }

    bot.chat(`§c⚠ ${name} dies in ${timeLeft}...`);
    timeLeft--;
  }, 1000);
}

// ===== START BOT =====
function startBot() {
  const bot = mineflayer.createBot(botArgs);

  bot.on('spawn', () => {
    botStatus.connected = true;

    bot.chat('/skin Technoblade');

    // AFK jump
    if (afkInterval) clearInterval(afkInterval);
    afkInterval = setInterval(() => {
      if (!bot.entity) return;
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 400);
    }, 30000);

    startChat(bot);
  });

  bot.on('entityHurt', (entity) => {
    if (!bot.entity || entity.id !== bot.entity.id) return;

    const attacker = getAttacker(bot);
    if (!attacker) return;

    console.log("⚔️ Attacked by:", attacker.username || attacker.name);

    executeTarget(bot, attacker);
  });

  bot.on('end', () => {
    botStatus.connected = false;
    botStatus.attempts++;

    if (afkInterval) clearInterval(afkInterval);
    if (chatTimeout) clearTimeout(chatTimeout);

    setTimeout(startBot, 30000);
  });

  bot.on('error', (err) => {
    console.log("Bot error:", err.message);
  });
}

startBot();
