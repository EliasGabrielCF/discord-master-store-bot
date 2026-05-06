const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [];
const commandsPath = path.join(__dirname, 'src', 'commands');

const categories = fs.readdirSync(commandsPath);

for (const category of categories) {
  const categoryPath = path.join(commandsPath, category);
  const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(path.join(categoryPath, file));
    if (command.data) {
      commands.push(command.data.toJSON());
    }
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    let data;
    if (process.env.GUILD_ID) {
      // Deploy to a specific guild (instant) / Publicar em um servidor específico (instantâneo)
      data = await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands },
      );
      console.log(`Successfully reloaded ${data.length} guild (/) commands.`);
    } else {
      // Deploy globally (can take up to 1 hour to sync across all servers) / Publicar globalmente (pode levar até 1 hora para sincronizar)
      data = await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands },
      );
      console.log(`Successfully reloaded ${data.length} global (/) commands.`);
    }

  } catch (error) {
    console.error(error);
  }
})();
