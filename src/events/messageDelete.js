const { Events, EmbedBuilder } = require('discord.js');
const db     = require('../utils/database');
const { t }  = require('../utils/i18n');
const colors = require('../utils/colors');

module.exports = {
  name: Events.MessageDelete,
  async execute(client, message) {
    if (!message.guild || message.author?.bot) return;
    const guildId      = message.guild.id;
    const logChannelId = db.get(guildId, 'config', 'logChannel');
    if (!logChannelId) return;

    const logChannel = message.guild.channels.cache.get(logChannelId);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(colors.WARNING)
      .setTitle(t('log.messageDelete', guildId))
      .addFields(
        { name: 'Author', value: message.author ? `${message.author.tag} (${message.author.id})` : 'Unknown', inline: true },
        { name: 'Channel', value: `<#${message.channelId}>`, inline: true },
        { name: 'Content', value: message.content ? (message.content.slice(0, 1024) || 'Empty') : '*No text content*' },
      )
      .setTimestamp();

    await logChannel.send({ embeds: [embed] }).catch(() => {});
  },
};
