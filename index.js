const mineflayer = require('mineflayer')
const http = require('http')

// Create a web server so Render doesn't shut down the project
http.createServer((req, res) => {
  res.write("Bot is alive!");
  res.end();
}).listen(process.env.PORT || 3000);

const botArgs = {
  host: 'PixelCraft-kgp9.aternos.me',  //Replace with your Aternos IP
  port: 30780,             // Change if your Aternos port is different
  username: 'MINEFLAYERBOT',
  version: false,      // Updated for 1.21.11
  auth: 'offline'          // For cracked servers
}

function createBot() {
  const bot = mineflayer.createBot(botArgs)

  bot.on('spawn', () => {
    console.log('Bot joined!')
    bot.chat('/gamemode spectator') // Works because you OP'd the bot
  })

  bot.on('error', (err) => console.log('Error:', err.message))
  
  bot.once('end', (reason) => {
    console.log(`Disconnected: ${reason}. Rejoining in 20s...`)
    setTimeout(createBot, 20000)
  })
}

createBot()


