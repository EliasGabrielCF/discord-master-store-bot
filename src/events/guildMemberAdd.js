const { Events, EmbedBuilder } = require('discord.js');
const db      = require('../utils/database');
const { t }   = require('../utils/i18n');
const colors  = require('../utils/colors');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(client, member) {
    const guildId = member.guild.id;

    // ── Auto-Role ─────────────────────────────────────────────────────────────
    const autoRoleId = db.get(guildId, 'config', 'autoRole');
    if (autoRoleId) {
      const role = member.guild.roles.cache.get(autoRoleId);
      if (role) {
        await member.roles.add(role).catch(() => {});
      }
    }

    // ── Welcome Message ───────────────────────────────────────────────────────
    const welcomeChannelId = db.get(guildId, 'config', 'welcomeChannel');
    if (welcomeChannelId) {
      const channel = member.guild.channels.cache.get(welcomeChannelId);
      if (channel) {
        const customMsg  = db.get(guildId, 'config', 'welcomeMessage');
        const memberCount = member.guild.memberCount;

        const description = customMsg
          ? customMsg
              .replace('{user}', member.user.toString())
              .replace('{server}', member.guild.name)
              .replace('{count}', memberCount)
          : t('welcome.description', guildId, { count: memberCount });

        const embed = new EmbedBuilder()
          .setColor(colors.PRIMARY)
          .setTitle(t('welcome.title', guildId, { user: member.user.username }))
          .setDescription(description)
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .setFooter({ text: member.guild.name, iconURL: member.guild.iconURL() })
          .setTimestamp();

        await channel.send({ embeds: [embed] }).catch(() => {});
      }
    }

    // ── Log ───────────────────────────────────────────────────────────────────
    const logChannelId = db.get(guildId, 'config', 'logChannel');
    if (logChannelId) {
      const logChannel = member.guild.channels.cache.get(logChannelId);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setColor(colors.SUCCESS)
          .setTitle(t('log.memberJoin', guildId))
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .addFields(
            { name: 'User', value: `${member.user.tag} (${member.id})`, inline: true },
            { name: 'Members', value: `${member.guild.memberCount}`, inline: true },
            { name: 'Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
          )
          .setTimestamp();
        await logChannel.send({ embeds: [embed] }).catch(() => {});
      }
    }
  },
};
