const { Events, EmbedBuilder } = require('discord.js');
const db     = require('../utils/database');
const { t }  = require('../utils/i18n');
const colors = require('../utils/colors');

module.exports = {
  name: Events.GuildMemberRemove,
  async execute(client, member) {
    const guildId      = member.guild.id;
    const logChannelId = db.get(guildId, 'config', 'logChannel');
    if (!logChannelId) return;

    const logChannel = member.guild.channels.cache.get(logChannelId);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(colors.ERROR)
      .setTitle(t('log.memberLeave', guildId))
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'User', value: `${member.user.tag} (${member.id})`, inline: true },
        { name: 'Members', value: `${member.guild.memberCount}`, inline: true },
        { name: 'Joined At', value: member.joinedAt ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Unknown', inline: true },
      )
      .setTimestamp();

    await logChannel.send({ embeds: [embed] }).catch(() => {});
  },
};
