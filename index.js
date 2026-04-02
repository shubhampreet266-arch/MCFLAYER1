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

// ===== QUOTES (BIG LIST) =====
const quotes = [
  "Technoblade never dies.",
  "Blood for the Blood God!",
  "One of us.",
  "Do not reveal your strategies in a YouTube video, you fool! YOU MORON!",
  "I win these.",
  "Not even close.",
  "The Blade.",
  "You underestimate me.",
  "I have calculated your defeat.",
  "This is just another Tuesday.",
  "Skill issue.",
  "You thought you stood a chance?",
  "You should have stayed home.",
  "I am inevitable.",
  "You made a mistake.",
  "This is where you lose.",
  "I have seen this outcome already.",
  "Your defeat was predicted.",
  "You cannot win.",
  "This was over before it began."
];

// ===== ATTACK LINES =====
const attackLines = [
  "YOU DARE STRIKE ME, %player%?",
  "You have made a grave mistake, %player%.",
  "You chose death, %player%.",
  "You thought you could win, %player%?",
  "Your fate was sealed, %player%.",
  "Technoblade never dies.",
  "Blood for the Blood God!"
  "Your defeat was predicted.",
  "You cannot win.",
  "This was over before it began.",
  "This is just another Tuesday.",
  "Skill issue.",
  "You thought you stood a chance?",
  "You should have stayed home.",
  "I am inevitable.",
  "You made a mistake.",
  "Not even close"
  "Technoblade never dies"
  "GG"
  
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

// ===== TRUE ATTACKER DETECTION =====
function getAttackerFromProjectile(bot) {
  const projectile = Object.values(bot.entities).find(e =>
    (e.name === 'arrow' || e.name === 'trident') &&
    e.position.distanceTo(bot.entity.position) < 3
  );

  if (!projectile) return null;

  // owner tracking (works in newer versions)
  if (projectile.metadata && projectile.metadata[7]) {
    const ownerId = projectile.metadata[7];
    return bot.entities[ownerId];
  }

  return null;
}

function getMeleeAttacker(bot) {
  return bot.nearestEntity(e =>
    e.type === 'player' &&
    e.username !== bot.username &&
    e.position.distanceTo(bot.entity.position) < 4
  );
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

  // ===== DAMAGE EVENT =====
  bot.on('entityHurt', (entity) => {
    if (!bot.entity || entity.id !== bot.entity.id) return;

    const now = Date.now();
    if (now - lastAttackTime < 1500) return;
    lastAttackTime = now;

    let attacker =
      getAttackerFromProjectile(bot) ||
      getMeleeAttacker(bot);

    if (!attacker) {
      console.log("⚠️ Attacker unknown");
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

startBot();
