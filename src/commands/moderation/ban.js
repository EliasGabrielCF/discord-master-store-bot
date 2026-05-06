const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db     = require('../../utils/database');
const { t }  = require('../../utils/i18n');
const colors = require('../../utils/colors');

function parseDuration(str) {
  const match = str.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return null;
  const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return parseInt(match[1]) * units[match[2]];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban').setDescription('Ban a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(o => o.setName('user').setDescription('User to ban').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false))
    .addIntegerOption(o => o.setName('days').setDescription('Delete messages from last X days (0-7)').setRequired(false)),

  async execute(client, interaction) {
    const guildId = interaction.guildId;
    const target  = interaction.options.getMember('user');
    const reason  = interaction.options.getString('reason') || 'No reason provided';
    const days    = interaction.options.getInteger('days') || 0;

    if (!target) return interaction.reply({ embeds: [colors.error('Ban', 'User not found in server.')], ephemeral: true });
    if (!target.bannable) return interaction.reply({ embeds: [colors.error('Ban', 'I cannot ban this user.')], ephemeral: true });

    await target.send({ content: t('moderation.dmBanned', guildId, { guild: interaction.guild.name, reason }) }).catch(() => {});
    await target.ban({ deleteMessageDays: days, reason });

    // Log
    const logCh = interaction.guild.channels.cache.get(db.get(guildId, 'config', 'logChannel'));
    if (logCh) {
      logCh.send({ embeds: [colors.error(t('log.ban', guildId), t('moderation.banned', guildId, { user: target.user.tag, reason }))] }).catch(() => {});
    }

    return interaction.reply({
      embeds: [colors.success(t('log.ban', guildId), t('moderation.banned', guildId, { user: target.user.tag, reason }))],
    });
  },
};
