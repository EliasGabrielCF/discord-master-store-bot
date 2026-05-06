const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle,
} = require('discord.js');
const db               = require('../../utils/database');
const { t }            = require('../../utils/i18n');
const colors           = require('../../utils/colors');
const { isSupport }    = require('../../utils/permissions');
const ticketTranscript = require('./ticketTranscript');

/**
 * Handle ticket_close button — shows a confirmation
 */
async function handle(client, interaction) {
  const { channel, guild } = interaction;
  const guildId = guild.id;

  const ticket = db.get(guildId, 'tickets', channel.id);
  if (!ticket) return interaction.reply({ content: t('ticket.notInTicket', guildId), ephemeral: true });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`ticket_confirm_close:${channel.id}`)
      .setLabel(t('common.confirm', guildId))
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`page_info_cancel`) // disabled placeholder
      .setLabel(t('common.cancel', guildId))
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
  );

  return interaction.reply({
    embeds: [colors.warning(t('ticket.close', guildId), t('ticket.closeConfirm', guildId))],
    components: [row],
    ephemeral: true,
  });
}

/**
 * Handle ticket_confirm_close button — actually closes the ticket
 */
async function confirm(client, interaction) {
  const { channel, member, guild } = interaction;
  const guildId = guild.id;

  const ticket = db.get(guildId, 'tickets', channel.id);
  if (!ticket) return interaction.reply({ content: t('ticket.notInTicket', guildId), ephemeral: true });

  await interaction.deferReply();

  // Generate transcript first
  const transcriptResult = await ticketTranscript.generate(client, interaction, ticket, channel);

  // Update ticket status
  db.merge(guildId, 'tickets', channel.id, {
    status: 'closed',
    closedBy: member.id,
    closedAt: Date.now(),
  });

  // Log
  const logChannelId = db.get(guildId, 'config', 'logChannel');
  if (logChannelId) {
    const logCh = guild.channels.cache.get(logChannelId);
    if (logCh) {
      const embed = new EmbedBuilder()
        .setColor(colors.ERROR)
        .setTitle(t('log.ticketClose', guildId))
        .addFields(
          { name: 'Ticket', value: `#${ticket.number}`, inline: true },
          { name: 'Closed By', value: member.toString(), inline: true },
          { name: 'User', value: `<@${ticket.userId}>`, inline: true },
        )
        .setTimestamp();
      if (transcriptResult) embed.addFields({ name: 'Transcript', value: `<#${logChannelId}>` });
      await logCh.send({ embeds: [embed] }).catch(() => {});
    }
  }

  // DM rating to the user
  const ticketUser = await guild.members.fetch(ticket.userId).catch(() => null);
  if (ticketUser) {
    const ratingRow = new ActionRowBuilder().addComponents(
      ...[1, 2, 3, 4, 5].map(n =>
        new ButtonBuilder()
          .setCustomId(`ticket_rating_${n}:${channel.id}`)
          .setLabel('⭐'.repeat(n))
          .setStyle(ButtonStyle.Secondary),
      ),
    );
    await ticketUser.send({
      embeds: [colors.info('Ticket Rating', t('ticket.rating', guildId))],
      components: [ratingRow],
    }).catch(() => {});
  }

  await interaction.editReply({
    embeds: [colors.error(t('ticket.close', guildId), t('ticket.closed', guildId, { user: member.toString() }))],
    components: [],
  });

  // Delete channel after 5 seconds
  setTimeout(() => channel.delete().catch(() => {}), 5000);
}

/**
 * Handle ticket rating
 */
async function handleRating(client, interaction, stars) {
  const guildId   = interaction.guildId;
  const ticketId  = interaction.customId.split(':')[1];
  const ticket    = db.get(guildId, 'tickets', ticketId);
  if (ticket) {
    db.merge(guildId, 'tickets', ticketId, { rating: stars, ratedBy: interaction.user.id });
  }
  return interaction.update({
    embeds: [colors.success('Rating', t('ticket.ratingThanks', guildId))],
    components: [],
  });
}

module.exports = { handle, confirm, handleRating };
