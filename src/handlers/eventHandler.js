const { readdirSync } = require('fs');
const path = require('path');

/**
 * Loads all event files from src/events/*.js / Carrega todos os arquivos de eventos
 * Each file must export / Cada arquivo deve exportar: { name: string, once?: boolean, execute(...args) }
 */
async function loadEvents(client) {
  const eventsPath = path.join(__dirname, '..', 'events');
  const files      = readdirSync(eventsPath).filter(f => f.endsWith('.js'));

  for (const file of files) {
    const event = require(path.join(eventsPath, file));

    if (!event.name || !event.execute) {
      console.warn(`[Events] Skipping ${file}: missing name or execute export.`);
      continue;
    }

    if (event.once) {
      client.once(event.name, (...args) => event.execute(client, ...args));
    } else {
      client.on(event.name, (...args) => event.execute(client, ...args));
    }

    console.log(`[Events] Registered: ${event.name}`);
  }
}

module.exports = { loadEvents };
