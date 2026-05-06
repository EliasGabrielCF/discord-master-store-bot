const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { t } = require('../../utils/i18n');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show help menu'),

  async execute(client, interaction) {
    const guildId = interaction.guildId;

    const embed = new EmbedBuilder()
      .setColor(colors.PRIMARY)
      .setTitle(t('help.title', guildId))
      .setDescription(t('help.description', guildId))
      .addFields(
        { name: t('help.categories.admin', guildId), value: '`/config`, `/language`, `/embed`, `/announce`, `/welcome`', inline: false },
        { name: t('help.categories.store', guildId), value: '`/produto`, `/cupom`, `/venda`', inline: false },
        { name: t('help.categories.tickets', guildId), value: '`/ticket panel`, `/ticket fechar`, `/ticket add`, `/ticket remove`', inline: false },
        { name: t('help.categories.moderation', guildId), value: '`/ban`, `/kick`, `/mute`, `/warn`, `/clear`, `/slowmode`', inline: false },
        { name: t('help.categories.roles', guildId), value: '`/autorole`, `/buttonrole`', inline: false },
        { name: t('help.categories.utility', guildId), value: '`/perfil`, `/ping`, `/help`', inline: false },
      )
      .setFooter({ text: 'Discord Master Store Bot • Developed by Elias Gabriel (FLEG)', iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
