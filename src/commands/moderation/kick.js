const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db    = require('../../utils/database');
const { t } = require('../../utils/i18n');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick').setDescription('Kick a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false)),

  async execute(client, interaction) {
    const guildId = interaction.guildId;
    const target  = interaction.options.getMember('user');
    const reason  = interaction.options.getString('reason') || 'No reason provided';
    if (!target || !target.kickable) return interaction.reply({ embeds: [colors.error('Kick', 'Cannot kick this user.')], ephemeral: true });
    await target.send({ content: t('moderation.dmKicked', guildId, { guild: interaction.guild.name, reason }) }).catch(() => {});
    await target.kick(reason);
    return interaction.reply({ embeds: [colors.success(t('log.kick', guildId), t('moderation.kicked', guildId, { user: target.user.tag, reason }))] });
  },
};
