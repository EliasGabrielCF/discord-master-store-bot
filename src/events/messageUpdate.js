const { Events, EmbedBuilder } = require('discord.js');
const db     = require('../utils/database');
const { t }  = require('../utils/i18n');
const colors = require('../utils/colors');

module.exports = {
  name: Events.MessageUpdate,
  async execute(client, oldMessage, newMessage) {
    if (!newMessage.guild || newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;

    const guildId      = newMessage.guild.id;
    const logChannelId = db.get(guildId, 'config', 'logChannel');
    if (!logChannelId) return;

    const logChannel = newMessage.guild.channels.cache.get(logChannelId);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(colors.INFO)
      .setTitle(t('log.messageEdit', guildId))
      .setURL(newMessage.url)
      .addFields(
        { name: 'Author', value: `${newMessage.author.tag} (${newMessage.author.id})`, inline: true },
        { name: 'Channel', value: `<#${newMessage.channelId}>`, inline: true },
        { name: 'Before', value: (oldMessage.content || 'Empty').slice(0, 512) },
        { name: 'After',  value: (newMessage.content || 'Empty').slice(0, 512) },
      )
      .setTimestamp();

    await logChannel.send({ embeds: [embed] }).catch(() => {});
  },
};
