const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Create transcripts directory if it doesn't exist / Criar pasta de transcrições se não existir
const transcriptsDir = path.join(__dirname, '..', 'transcripts');
if (!fs.existsSync(transcriptsDir)) {
  fs.mkdirSync(transcriptsDir, { recursive: true });
}

// Create data directory if it doesn't exist / Criar pasta de dados se não existir
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User],
});

client.commands = new Collection();
client.pageCache = new Map(); // For pagination / Para paginação

// Handlers
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');

async function init() {
  await loadCommands(client);
  await loadEvents(client);

  client.login(process.env.DISCORD_TOKEN);
}

init();

// Catch unhandled errors so the bot doesn't crash completely / Capturar erros não tratados para o bot não fechar completamente
process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error);
});
