const mineflayer = require('mineflayer');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// ===== WEB SERVER =====
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

// ===== SAFE QUOTES (NO ILLEGAL CHARACTERS) =====
const quotes = [
  "Technoblade never dies.",
  "Blood for the Blood God!",
  "One of us.",
  "YOU MORON!",
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
  "Your fate is sealed, %target%."
];

// ===== CHAT LOOP (NO SPAM STACKING) =====
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

// ===== ATTACKER DETECTION =====
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

// ===== EXECUTION SYSTEM (SAFE) =====
function execute(bot, target) {
  if (!target || executionRunning) return;
  executionRunning = true;

  const name = target.username;

  const line =
    attackLines[Math.floor(Math.random() * attackLines.length)]
      .replace("%target%", name);

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
        bot.chat(`/execute as ${name} run kill @s`);
      } catch (e) {
        console.log("Kill error:", e.message);
      }

      executionRunning = false;
      return;
    }

    bot.chat(name + " dies in " + time + "...");
    time--;
  }, 1000);
}

// ===== START BOT =====
function startBot() {
  const bot = mineflayer.createBot(botArgs);

  bot.on('spawn', () => {
    connected = true;

    // IMPORTANT: NO /skin COMMAND (FIXED YOUR ISSUE)

    // SAFE chat loop
    startChat(bot);

    // simple anti-AFK jump
    setInterval(() => {
      if (!bot.entity) return;
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 300);
    }, 30000);
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

  bot.on('kicked', (reason) => {
    console.log("KICKED:", reason);
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
