const { SlashCommandBuilder, PermissionFlagsBits, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');
const db     = require('../../utils/database');
const { t }  = require('../../utils/i18n');
const { SUPPORTED } = require('../../utils/i18n');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('language')
    .setDescription('Change the bot language for this server / Mudar o idioma / Cambiar idioma')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(client, interaction) {
    const guildId = interaction.guildId;
    const current = db.get(guildId, 'config', 'language') || process.env.DEFAULT_LANGUAGE || 'pt-BR';

    const select = new StringSelectMenuBuilder()
      .setCustomId('lang_select')
      .setPlaceholder('Select language / Idioma / Idioma')
      .addOptions(
        new StringSelectMenuOptionBuilder().setLabel('🇧🇷 Português (BR)').setValue('pt-BR').setDefault(current === 'pt-BR'),
        new StringSelectMenuOptionBuilder().setLabel('🇪🇸 Español').setValue('es').setDefault(current === 'es'),
        new StringSelectMenuOptionBuilder().setLabel('🇺🇸 English').setValue('en').setDefault(current === 'en'),
      );

    const row = new ActionRowBuilder().addComponents(select);

    return interaction.reply({
      embeds: [colors.info('🌐 Language / Idioma', `Current: **${current}**`)],
      components: [row],
      ephemeral: true,
    });
  },
};
