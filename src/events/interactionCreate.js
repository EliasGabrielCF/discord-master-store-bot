const { Events, InteractionType } = require('discord.js');
const { handleComponent }         = require('../handlers/componentHandler');
const { t }                       = require('../utils/i18n');
const colors                      = require('../utils/colors');

module.exports = {
  name: Events.InteractionCreate,
  async execute(client, interaction) {
    const guildId = interaction.guildId;

    // ── Slash Commands ────────────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(client, interaction);
      } catch (err) {
        console.error(`[Command Error] /${interaction.commandName}:`, err);
        const errEmbed = colors.error('Error', err.message || 'An unexpected error occurred.');
        const payload  = { embeds: [errEmbed], ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(payload);
        } else {
          await interaction.reply(payload);
        }
      }
      return;
    }

    // ── Buttons, SelectMenus, Modals ──────────────────────────────────────────
    if (
      interaction.isButton() ||
      interaction.isAnySelectMenu() ||
      interaction.isModalSubmit()
    ) {
      await handleComponent(client, interaction);
    }
  },
};
