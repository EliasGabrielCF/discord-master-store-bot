const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db     = require('../../utils/database');
const { t }  = require('../../utils/i18n');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('perfil')
    .setDescription('View your or another user\'s profile')
    .addUserOption(o => o.setName('user').setDescription('User to view').setRequired(false)),

  async execute(client, interaction) {
    const guildId = interaction.guildId;
    const user    = interaction.options.getUser('user') || interaction.user;
    const member  = await interaction.guild.members.fetch(user.id).catch(() => null);

    const profile = db.get(guildId, 'profiles', user.id) || {
      purchases: 0, totalSpent: 0, points: 0, rank: 'bronze', tickets: 0, warnings: 0,
    };

    const embed = new EmbedBuilder()
      .setColor(colors.PRIMARY)
      .setTitle(t('profile.title', guildId, { user: user.tag }))
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: `🛒 ${t('profile.purchases', guildId)}`, value: `${profile.purchases}`, inline: true },
        { name: `💰 ${t('profile.spent', guildId)}`, value: `R$ ${profile.totalSpent.toFixed(2)}`, inline: true },
        { name: `🌟 ${t('profile.points', guildId)}`, value: `${profile.points}`, inline: true },
        { name: `🏆 ${t('profile.rank', guildId)}`, value: t(`profile.ranks.${profile.rank}`, guildId), inline: true },
        { name: `🎫 ${t('profile.tickets', guildId)}`, value: `${profile.tickets}`, inline: true },
        { name: `⚠️ ${t('profile.warnings', guildId)}`, value: `${profile.warnings}`, inline: true },
        { name: `📅 ${t('profile.joinedAt', guildId)}`, value: member?.joinedAt ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Unknown', inline: false },
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
