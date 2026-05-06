const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { t } = require('../../utils/i18n');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Set slowmode for a channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption(o => o.setName('seconds').setDescription('Seconds (0 to disable)').setRequired(true))
    .addChannelOption(o => o.setName('channel').setDescription('Target channel').setRequired(false)),

  async execute(client, interaction) {
    const guildId = interaction.guildId;
    const seconds = interaction.options.getInteger('seconds');
    const channel = interaction.options.getChannel('channel') || interaction.channel;

    if (seconds < 0 || seconds > 21600) {
      return interaction.reply({ content: '❌ Slowmode must be between 0 and 21600 seconds (6 hours).', ephemeral: true });
    }

    await channel.setRateLimitPerUser(seconds);

    if (seconds === 0) {
      return interaction.reply({
        embeds: [colors.success('Slowmode', t('moderation.slowmodeOff', guildId, { channel: `<#${channel.id}>` }))],
      });
    }

    return interaction.reply({
      embeds: [colors.success('Slowmode', t('moderation.slowmodeSet', guildId, { seconds, channel: `<#${channel.id}>` }))],
    });
  },
};
