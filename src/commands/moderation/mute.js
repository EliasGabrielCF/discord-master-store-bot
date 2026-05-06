const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db    = require('../../utils/database');
const { t } = require('../../utils/i18n');
const colors = require('../../utils/colors');

function parseDurationMs(str) {
  const m = str.match(/^(\d+)(s|m|h|d)$/i);
  if (!m) return null;
  return parseInt(m[1]) * { s: 1000, m: 60000, h: 3600000, d: 86400000 }[m[2].toLowerCase()];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute').setDescription('Mute (timeout) a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
    .addStringOption(o => o.setName('duration').setDescription('Duration (e.g. 10m, 1h, 1d)').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false)),

  async execute(client, interaction) {
    const guildId  = interaction.guildId;
    const target   = interaction.options.getMember('user');
    const durStr   = interaction.options.getString('duration');
    const reason   = interaction.options.getString('reason') || 'No reason provided';
    const ms       = parseDurationMs(durStr);
    if (!ms || ms > 2419200000) return interaction.reply({ content: '❌ Invalid duration. Max 28 days.', ephemeral: true });
    if (!target?.moderatable) return interaction.reply({ embeds: [colors.error('Mute', 'Cannot mute this user.')], ephemeral: true });
    await target.timeout(ms, reason);
    await target.send({ content: t('moderation.dmMuted', guildId, { guild: interaction.guild.name, duration: durStr, reason }) }).catch(() => {});
    return interaction.reply({ embeds: [colors.success(t('log.mute', guildId), t('moderation.muted', guildId, { user: target.user.tag, duration: durStr, reason }))] });
  },
};
