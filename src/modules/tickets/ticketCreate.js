const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder,
  ButtonStyle, PermissionFlagsBits, ChannelType,
} = require('discord.js');
const db     = require('../../utils/database');
const { t }  = require('../../utils/i18n');
const colors = require('../../utils/colors');
const { isBotAdmin, isSupport } = require('../../utils/permissions');

const CATEGORIES = {
  support:   { emoji: '🛠️', label: key => t('ticket.categories.support', key) },
  purchase:  { emoji: '🛒', label: key => t('ticket.categories.purchase', key) },
  complaint: { emoji: '📢', label: key => t('ticket.categories.complaint', key) },
  other:     { emoji: '❓', label: key => t('ticket.categories.other', key) },
};

/**
 * Handle ticket_open_{category} button click
 */
async function handle(client, interaction, category) {
  await interaction.deferReply({ ephemeral: true });

  const { guild, user } = interaction;
  const guildId         = guild.id;

  // Check if user already has an open ticket
  const tickets = db.read(guildId, 'tickets');
  const existing = Object.values(tickets).find(
    t => t.userId === user.id && t.status === 'open',
  );

  if (existing) {
    const ch = guild.channels.cache.get(existing.channelId);
    return interaction.editReply({
      content: t('ticket.alreadyOpen', guildId, { channel: ch ? `<#${ch.id}>` : '#deleted' }),
    });
  }

  // Get next ticket number
  const allTickets = Object.values(tickets);
  const number     = allTickets.length + 1;

  // Get ticket category from config
  const categoryId = db.get(guildId, 'config', 'ticketCategory');
  const catData    = CATEGORIES[category] || CATEGORIES.other;
  const catLabel   = t(`ticket.categories.${category}`, guildId);

  // Get support role
  const supportRoleId = db.get(guildId, 'config', 'supportRole');

  // Create the ticket channel
  const channelOptions = {
    name: `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}-${number}`,
    type: ChannelType.GuildText,
    topic: `Ticket #${number} | ${catLabel} | ${user.tag}`,
    permissionOverwrites: [
      { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: user.id,  allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
      { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] },
    ],
  };

  if (categoryId) channelOptions.parent = categoryId;
  if (supportRoleId) {
    channelOptions.permissionOverwrites.push({
      id: supportRoleId,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
    });
  }

  const channel = await guild.channels.create(channelOptions);

  // Build ticket embed
  const embed = new EmbedBuilder()
    .setColor(colors.TICKET)
    .setTitle(t('ticket.title', guildId, { number, category: catLabel }))
    .setDescription(t('ticket.description', guildId, { user: user.toString() }))
    .addFields(
      { name: '📂 Category', value: catLabel, inline: true },
      { name: '👤 User', value: `${user.tag}`, inline: true },
      { name: '🔢 Number', value: `#${number}`, inline: true },
    )
    .setFooter({ text: t('ticket.footer', guildId) })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`ticket_claim:${channel.id}`).setLabel(t('ticket.claim', guildId)).setStyle(ButtonStyle.Success).setEmoji('✅'),
    new ButtonBuilder().setCustomId(`ticket_close:${channel.id}`).setLabel(t('ticket.close', guildId)).setStyle(ButtonStyle.Danger).setEmoji('🔒'),
    new ButtonBuilder().setCustomId(`ticket_transcript:${channel.id}`).setLabel(t('ticket.transcript', guildId)).setStyle(ButtonStyle.Secondary).setEmoji('📄'),
  );

  await channel.send({
    content: `${user.toString()}${supportRoleId ? ` <@&${supportRoleId}>` : ''}`,
    embeds: [embed],
    components: [row],
  });

  // Save ticket to database
  const ticketData = {
    id: channel.id,
    channelId: channel.id,
    userId: user.id,
    category,
    number,
    status: 'open',
    claimedBy: null,
    createdAt: Date.now(),
    messages: [],
  };
  db.set(guildId, 'tickets', channel.id, ticketData);

  // Update client profile
  const profile = db.get(guildId, 'profiles', user.id) || { tickets: 0 };
  profile.tickets = (profile.tickets || 0) + 1;
  db.set(guildId, 'profiles', user.id, profile);

  // Log
  const logChannelId = db.get(guildId, 'config', 'logChannel');
  if (logChannelId) {
    const logCh = guild.channels.cache.get(logChannelId);
    if (logCh) {
      const logEmbed = new EmbedBuilder()
        .setColor(colors.TICKET)
        .setTitle(t('log.ticketOpen', guildId))
        .addFields(
          { name: 'User', value: `${user.tag}`, inline: true },
          { name: 'Category', value: catLabel, inline: true },
          { name: 'Channel', value: `<#${channel.id}>`, inline: true },
        )
        .setTimestamp();
      await logCh.send({ embeds: [logEmbed] }).catch(() => {});
    }
  }

  return interaction.editReply({
    content: t('ticket.opened', guildId, { channel: `<#${channel.id}>` }),
  });
}

/**
 * Handle ticket_claim button
 */
async function claim(client, interaction) {
  const { channel, member, guild } = interaction;
  const guildId = guild.id;

  if (!isSupport(member, guildId)) {
    return interaction.reply({ content: t('common.noPermission', guildId), ephemeral: true });
  }

  const ticket = db.get(guildId, 'tickets', channel.id);
  if (!ticket) return interaction.reply({ content: t('ticket.notInTicket', guildId), ephemeral: true });

  db.merge(guildId, 'tickets', channel.id, { claimedBy: member.id });

  await channel.permissionOverwrites.edit(member.id, {
    ViewChannel: true, SendMessages: true, ReadMessageHistory: true,
  });

  const embed = colors.success(t('ticket.claim', guildId), t('ticket.claimed', guildId, { user: member.toString() }));
  return interaction.reply({ embeds: [embed] });
}

module.exports = { handle, claim, CATEGORIES };
