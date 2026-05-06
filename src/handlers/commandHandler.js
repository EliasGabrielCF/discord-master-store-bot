const { readdirSync } = require('fs');
const path = require('path');

/**
 * Recursively loads all command files from src/commands/**\/*.js / Carrega recursivamente todos os arquivos de comando
 * Each file must export / Cada arquivo deve exportar: { data: SlashCommandBuilder, execute(interaction) }
 */
async function loadCommands(client) {
  const commandsPath = path.join(__dirname, '..', 'commands');
  const categories   = readdirSync(commandsPath);

  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category);
    const files = readdirSync(categoryPath).filter(f => f.endsWith('.js'));

    for (const file of files) {
      const command = require(path.join(categoryPath, file));

      if (!command.data || !command.execute) {
        console.warn(`[Commands] Skipping ${file}: missing data or execute export.`);
        continue;
      }

      client.commands.set(command.data.name, command);
      console.log(`[Commands] Loaded: /${command.data.name}`);
    }
  }
}

module.exports = { loadCommands };
