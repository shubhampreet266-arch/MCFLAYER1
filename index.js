const mineflayer = require('mineflayer');
const http = require('http');

// Web server for Render
http.createServer((req, res) => {
  res.write("Bot is alive!");
  res.end();
}).listen(process.env.PORT || 3000, () => {
  console.log("Web server is running on port", process.env.PORT || 3000);
});

const botArgs = {
  host: 'lamprey.aternos.host', 
  port: 30780,             
  username: 'MINEFLAYERBOT',
  auth: 'offline'
};

function createBot() {
  console.log(`[${new Date().toLocaleTimeString()}] Attempting to join ${botArgs.host}:${botArgs.port}...`);
  
  const bot = mineflayer.createBot(botArgs);

  bot.once('spawn', () => {
    console.log('✅ Bot successfully joined the server!');
    bot.chat('/gamemode spectator');
  });

  bot.on('error', (err) => {
    console.log('❌ Connection Error:', err.message);
  });

  bot.on('kicked', (reason) => {
    console.log('⚠️ Kicked from server:', reason);
  });
  
  bot.once('end', (reason) => {
    console.log(`🔌 Disconnected: ${reason}. Retrying in 20s...`);
    setTimeout(createBot, 20000);
  });
}

// Start the bot
createBot();




