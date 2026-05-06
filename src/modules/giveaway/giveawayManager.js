const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db     = require('../../utils/database');
const { t }  = require('../../utils/i18n');
const colors = require('../../utils/colors');
const { v4: uuidv4 } = require('uuid');

/**
 * Giveaway schema:
 * { id, prize, winnersCount, entries: [], active, endsAt, channelId, messageId, hostId }
 */

async function start(client, interaction, { prize, duration, winnersCount, channelId }) {
  const guildId = interaction.guildId;
  const channel = interaction.guild.channels.cache.get(channelId) || interaction.channel;
  const endsAt  = Date.now() + duration;
  const id      = uuidv4().split('-')[0].toUpperCase();

  const embed = new EmbedBuilder()
    .setColor(colors.PRIMARY)
    .setTitle(`🎉 ${t('giveaway.title', guildId)}`)
    .setDescription(`**${prize}**`)
    .addFields(
      { name: t('giveaway.prize', guildId), value: prize, inline: true },
      { name: t('giveaway.endsIn', guildId), value: `<t:${Math.floor(endsAt / 1000)}:R>`, inline: true },
      { name: t('giveaway.hostedBy', guildId), value: interaction.user.toString(), inline: true },
      { name: t('giveaway.entries', guildId, { count: 0 }), value: '\u200b', inline: true },
    )
    .setFooter({ text: `ID: ${id} • Winners: ${winnersCount}` })
    .setTimestamp(endsAt);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`giveaway_enter:${id}`)
      .setLabel(t('giveaway.enter', guildId))
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🎟️'),
  );

  const message = await channel.send({ embeds: [embed], components: [row] });

  const giveaway = {
    id, prize, winnersCount, entries: [], active: true,
    endsAt, channelId: channel.id, messageId: message.id,
    hostId: interaction.user.id, guildId,
  };

  db.set(guildId, 'giveaways', id, giveaway);
  return giveaway;
}

async function enter(client, interaction, giveawayId) {
  const guildId  = interaction.guildId;
  const giveaway = db.get(guildId, 'giveaways', giveawayId);

  if (!giveaway || !giveaway.active) {
    return interaction.reply({ content: '❌ This giveaway has ended.', ephemeral: true });
  }

  if (giveaway.entries.includes(interaction.user.id)) {
    return interaction.reply({ content: '✅ You are already entered!', ephemeral: true });
  }

  giveaway.entries.push(interaction.user.id);
  db.set(guildId, 'giveaways', giveawayId, giveaway);

  // Update button label
  try {
    const channel = await client.channels.fetch(giveaway.channelId);
    const message = await channel.messages.fetch(giveaway.messageId);
    const embed   = EmbedBuilder.from(message.embeds[0]);
    const fields  = embed.data.fields.map(f =>
      f.name.includes('participant') || f.name.includes('partici') || f.name.includes('entr')
        ? { ...f, value: `${giveaway.entries.length}` }
        : f,
    );
    embed.setFields(fields);
    await message.edit({ embeds: [embed] });
  } catch {}

  return interaction.reply({ content: t('giveaway.enter', guildId) + ' ✅', ephemeral: true });
}

async function end(client, guildId, giveawayId) {
  const giveaway = db.get(guildId, 'giveaways', giveawayId);
  if (!giveaway || !giveaway.active) return;

  db.merge(guildId, 'giveaways', giveawayId, { active: false });

  const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
  if (!channel) return;

  const winners = pickWinners(giveaway.entries, giveaway.winnersCount);
  const winText = winners.length
    ? winners.map(id => `<@${id}>`).join(', ')
    : t('giveaway.noEntries', guildId);

  const embed = new EmbedBuilder()
    .setColor(colors.SUCCESS)
    .setTitle(`🎉 ${t('giveaway.title', guildId)} — ENDED`)
    .setDescription(`**${giveaway.prize}**`)
    .addFields({ name: '🏆 Winners', value: winText })
    .setTimestamp();

  try {
    const message = await channel.messages.fetch(giveaway.messageId);
    await message.edit({ embeds: [embed], components: [] });
  } catch {}

  await channel.send({ content: t('giveaway.ended', guildId, { winners: winText }) });
}

async function reroll(client, guildId, giveawayId) {
  const giveaway = db.get(guildId, 'giveaways', giveawayId);
  if (!giveaway) return null;
  const winners = pickWinners(giveaway.entries, 1);
  return winners[0] || null;
}

function pickWinners(entries, count) {
  const shuffled = [...entries].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

module.exports = { start, enter, end, reroll };
