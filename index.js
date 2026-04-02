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
  version: false
};

let afkInterval = null;
let chatTimeout = null;
let lastMessageTime = 0;
let lastAttackTime = 0;
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
  "The Blade.",
  "You underestimate me.",
  "This is where you lose."
];

// ===== ATTACK LINES =====
const attackLines = [
  "YOU DARE STRIKE ME, %player%?",
  "You have made a grave mistake, %player%.",
  "You chose death, %player%.",
  "Your fate was sealed, %player%.",
  "Technoblade never dies.",
  "Blood for the Blood God!"
];

// ===== RANDOM CHAT =====
function startRandomChat(bot) {
  if (chatTimeout) clearTimeout(chatTimeout);

  function loop() {
    if (!botStatus.connected) return;

    const now = Date.now();
    if (now - lastMessageTime >= 30000) {
      const msg = quotes[Math.floor(Math.random() * quotes.length)];
      bot.chat(msg);
      lastMessageTime = now;
    }

    const delay = Math.floor(Math.random() * 90000) + 30000;
    chatTimeout = setTimeout(loop, delay);
  }

  loop();
}

// ===== PROJECTILE OWNER DETECTION =====
function getProjectileAttacker(bot) {
  const projectile = Object.values(bot.entities).find(e =>
    (e.name === 'arrow' || e.name === 'trident') &&
    e.position.distanceTo(bot.entity.position) < 3
  );

  if (!projectile) return null;

  if (projectile.metadata && projectile.metadata[7]) {
    return bot.entities[projectile.metadata[7]];
  }

  return null;
}

// ===== MELEE DETECTION =====
function getMeleeAttacker(bot) {
  return bot.nearestEntity(e =>
    e.type === 'player' &&
    e.username !== bot.username &&
    e.position.distanceTo(bot.entity.position) < 4
  );
}

// ===== COUNTDOWN SYSTEM =====
function startExecution(bot, target) {
  if (activeExecution) return;
  activeExecution = true;

  const line = attackLines[
    Math.floor(Math.random() * attackLines.length)
  ].replace("%player%", target.username);

  bot.chat(line);

  let timeLeft = 10;

  const countdown = setInterval(() => {
    if (timeLeft <= 0) {
      clearInterval(countdown);

      bot.chat(`/kill ${target.username}`);
      activeExecution = false;
      return;
    }

    // GLOBAL ANNOUNCEMENT STYLE
    bot.chat(`§c⚠ ${target.username} dies in ${timeLeft}...`);

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

    startRandomChat(bot);
  });

  // ===== DAMAGE DETECTION =====
  bot.on('entityHurt', (entity) => {
    if (!bot.entity || entity.id !== bot.entity.id) return;

    const now = Date.now();
    if (now - lastAttackTime < 2000) return;
    lastAttackTime = now;

    let attacker =
      getProjectileAttacker(bot) ||
      getMeleeAttacker(bot);

    if (!attacker) {
      console.log("⚠️ Attacker not found");
      return;
    }

    console.log(`⚔️ Attacked by ${attacker.username}`);

    startExecution(bot, attacker);
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

startBot();
