const mineflayer = require('mineflayer');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

let connected = false;

app.get('/', (req, res) => {
  res.send(connected ? "ONLINE" : "OFFLINE");
});

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

// ===== QUOTES =====
const quotes = [
 "Technoblade never dies.",
  "Blood for the Blood God!",
  "One of us.",
  "Never reveal your strategies in a youtube video, you fool! YOU MORON!",
  "Not even close.",
  "The Blade.",
  "You underestimate me.",
  "Your fate is sealed.",
  "This outcome was inevitable.",
  "Skill issue."
];

// ===== ATTACK LINES =====
const attackLines = [
  "YOU DARE STRIKE ME, %target%?",
  "You chose death, %target%.",
  "You made a mistake, %target%.",
  "Your fate is sealed, %target%.",
  "You underestimate me.",
  "Your fate is sealed.",
  "This outcome was inevitable.",
  "Skill issue.",
  "Not even close.",
];

// ===== CHAT =====
function startChat(bot) {
  if (chatRunning) return;
  chatRunning = true;

  function loop() {
    if (!connected) return;

    bot.chat(quotes[Math.floor(Math.random() * quotes.length)]);

    setTimeout(loop, Math.random() * 90000 + 30000);
  }

  loop();
}

// ===== FIND ATTACKER =====
function getAttacker(bot) {
  if (!bot.entity) return null;

  return bot.nearestEntity(e =>
    e &&
    e.type === 'player' &&
    e.username !== bot.username &&
    bot.entity.position &&
    e.position &&
    e.position.distanceTo(bot.entity.position) < 5
  );
}

// ===== EXECUTION =====
function execute(bot, target) {
  if (!target || executionRunning) return;

  executionRunning = true;

  const name = target.username;
  const line = attackLines[Math.floor(Math.random() * attackLines.length)]
    .replace("%target%", name);

  bot.chat(line);

  let time = 10;

  const interval = setInterval(() => {
    if (!connected || !bot.entity) {
      clearInterval(interval);
      executionRunning = false;
      return;
    }

    if (time <= 0) {
      clearInterval(interval);

      // SAFE fallback kill (works on most servers ONLY if OP)
      bot.chat(`/kill ${name}`);

      executionRunning = false;
      return;
    }

    bot.chat(`${name} dies in ${time}...`);
    time--;
  }, 1000);

  // safety unlock (prevents permanent lock)
  setTimeout(() => executionRunning = false, 20000);
}

// ===== BOT =====
function startBot() {
  const bot = mineflayer.createBot(botArgs);

  let jumpLoop;

  bot.on('spawn', () => {
    connected = true;

    startChat(bot);

    // FIXED jump loop (no stacking)
    if (jumpLoop) clearInterval(jumpLoop);

    jumpLoop = setInterval(() => {
      if (!bot.entity) return;
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 200);
    }, 30000);
  });

  bot.on('entityHurt', (entity) => {
    if (!bot.entity || entity.id !== bot.entity.id) return;

    const attacker = getAttacker(bot);
    if (attacker) execute(bot, attacker);
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
