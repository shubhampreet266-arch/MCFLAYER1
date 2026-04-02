const mineflayer = require('mineflayer');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// ===== WEB SERVER =====
let connected = false;
app.get('/', (req, res) => res.send(connected ? "ONLINE" : "OFFLINE"));
app.listen(port);

// ===== BOT CONFIG =====
const botArgs = {
  host: 'Pixelcraft-kgp9.aternos.me',
  port: 30780,
  username: 'Technoblade',
  auth: 'offline',
  version: false
};

let chatRunning = false;
let executionRunning = false;

// ===== BIG QUOTE POOL =====
const quotes = [
  "Technoblade never dies.",
  "Blood for the Blood God!",
  "One of us.",
  "YOU MORON!",
  "Do not reveal your strategies in a YouTube video, you fool!",
  "I win these.",
  "Not even close.",
  "The Blade.",
  "You underestimate me.",
  "You should have stayed quiet.",
  "This was your mistake.",
  "You cannot win.",
  "Skill issue.",
  "I have already calculated this.",
  "This outcome was inevitable.",
  "You thought you stood a chance?",
  "This is just another fight.",
  "You are already defeated.",
  "I have seen this ending.",
  "Your defeat was guaranteed."
];

// ===== ATTACK LINES =====
const attackLines = [
  "YOU DARE STRIKE ME, %target%?",
  "You chose death, %target%.",
  "You made a mistake, %target%.",
  "Your fate was sealed, %target%.",
  "You should have run, %target%.",
  "Technoblade never dies.",
  "Blood for the Blood God!"
];

// ===== RANDOM CHAT (NO SPAM) =====
function startChat(bot) {
  if (chatRunning) return;
  chatRunning = true;

  function loop() {
    if (!connected) return;

    const msg = quotes[Math.floor(Math.random() * quotes.length)];
    bot.chat(msg);

    const delay = Math.floor(Math.random() * 90000) + 30000;
    setTimeout(loop, delay);
  }

  loop();
}

// ===== ATTACKER DETECTION (MELEE ONLY = STABLE) =====
function getAttacker(bot) {
  if (!bot.entity) return null;

  return bot.nearestEntity(e =>
    e &&
    e.type === 'player' &&
    e.username &&
    e.username !== bot.username &&
    e.position &&
    e.position.distanceTo(bot.entity.position) < 4
  );
}

// ===== EXECUTION SYSTEM =====
function execute(bot, target) {
  if (!target || executionRunning) return;
  executionRunning = true;

  const name = target.username;

  const line = attackLines[
    Math.floor(Math.random() * attackLines.length)
  ].replace("%target%", name);

  bot.chat(line);

  let time = 10;

  const interval = setInterval(() => {
    if (!connected) {
      clearInterval(interval);
      executionRunning = false;
      return;
    }

    if (time <= 0) {
      clearInterval(interval);

      try {
        bot.chat(`/kill ${name}`);
      } catch (e) {
        console.log("Kill error:", e.message);
      }

      executionRunning = false;
      return;
    }

    bot.chat(`§c⚠ ${name} dies in ${time}...`);
    time--;
  }, 1000);
}

// ===== START BOT =====
function startBot() {
  const bot = mineflayer.createBot(botArgs);

  bot.on('spawn', () => {
    connected = true;

    bot.chat('/skin Technoblade');

    // AFK jump
    setInterval(() => {
      if (!bot.entity) return;
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 300);
    }, 30000);

    startChat(bot);
  });

  bot.on('entityHurt', (entity) => {
    if (!bot.entity || entity.id !== bot.entity.id) return;

    try {
      const attacker = getAttacker(bot);
      if (!attacker) return;

      execute(bot, attacker);
    } catch (e) {
      console.log("Attack error:", e.message);
    }
  });

  bot.on('end', () => {
    connected = false;
    chatRunning = false;
    executionRunning = false;

    setTimeout(startBot, 30000);
  });

  bot.on('error', (err) => {
    console.log("Bot error:", err.message);
  });
}

startBot();
