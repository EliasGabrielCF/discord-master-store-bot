const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db     = require('../../utils/database');
const { t }  = require('../../utils/i18n');
const colors = require('../../utils/colors');
const { v4: uuidv4 } = require('uuid');

/**
 * Poll schema:
 * { id, question, options: [{label, votes:[userId]}], active, endsAt, channelId, messageId, hostId }
 */

async function create(client, interaction, { question, options, duration, channelId }) {
  const guildId = interaction.guildId;
  const channel = interaction.guild.channels.cache.get(channelId) || interaction.channel;
  const endsAt  = Date.now() + duration;
  const id      = uuidv4().split('-')[0].toUpperCase();

  const pollOptions = options.map(label => ({ label, votes: [] }));

  const embed = buildEmbed(guildId, question, pollOptions, endsAt, id);
  const rows  = buildButtons(guildId, id, pollOptions);

  const message = await channel.send({ embeds: [embed], components: rows });

  const poll = {
    id, question, options: pollOptions, active: true,
    endsAt, channelId: channel.id, messageId: message.id,
    hostId: interaction.user.id,
  };

  db.set(guildId, 'polls', id, poll);
  return poll;
}

async function vote(client, interaction, pollId, optIndex) {
  const guildId = interaction.guildId;
  const poll    = db.get(guildId, 'polls', pollId);

  if (!poll || !poll.active) {
    return interaction.reply({ content: '❌ This poll has ended.', ephemeral: true });
  }

  const userId = interaction.user.id;

  // Remove previous vote
  poll.options.forEach(opt => {
    const idx = opt.votes.indexOf(userId);
    if (idx !== -1) opt.votes.splice(idx, 1);
  });

  // Add new vote
  poll.options[optIndex].votes.push(userId);
  db.set(guildId, 'polls', pollId, poll);

  // Update embed
  try {
    const channel = await client.channels.fetch(poll.channelId);
    const message = await channel.messages.fetch(poll.messageId);
    const embed   = buildEmbed(guildId, poll.question, poll.options, poll.endsAt, pollId);
    await message.edit({ embeds: [embed] });
  } catch {}

  return interaction.reply({ content: '✅ Vote registered!', ephemeral: true });
}

async function end(client, guildId, pollId) {
  const poll = db.get(guildId, 'polls', pollId);
  if (!poll || !poll.active) return;

  db.merge(guildId, 'polls', pollId, { active: false });

  const channel = await client.channels.fetch(poll.channelId).catch(() => null);
  if (!channel) return;

  const totalVotes = poll.options.reduce((a, o) => a + o.votes.length, 0);
  const maxVotes   = Math.max(...poll.options.map(o => o.votes.length));
  const winners    = poll.options.filter(o => o.votes.length === maxVotes);

  const embed = new EmbedBuilder()
    .setColor(colors.SUCCESS)
    .setTitle(`📊 ${t('poll.title', guildId)} — ENDED`)
    .setDescription(`**${poll.question}**\n\n` + poll.options.map((o, i) => {
      const pct = totalVotes ? Math.round((o.votes.length / totalVotes) * 100) : 0;
      const bar = '█'.repeat(Math.round(pct / 10)) + '░'.repeat(10 - Math.round(pct / 10));
      return `**${i + 1}.** ${o.label}\n${bar} \`${pct}%\` (${o.votes.length} votes)`;
    }).join('\n\n'))
    .setFooter({ text: `Total: ${totalVotes} votes` })
    .setTimestamp();

  try {
    const message = await channel.messages.fetch(poll.messageId);
    await message.edit({ embeds: [embed], components: [] });
  } catch {}
}

function buildEmbed(guildId, question, options, endsAt, id) {
  const totalVotes = options.reduce((a, o) => a + o.votes.length, 0);
  return new EmbedBuilder()
    .setColor(colors.INFO)
    .setTitle(`📊 ${t('poll.title', guildId)}`)
    .setDescription(`**${question}**\n\n` + options.map((o, i) => {
      const pct = totalVotes ? Math.round((o.votes.length / totalVotes) * 100) : 0;
      return `**${i + 1}.** ${o.label} — \`${o.votes.length} votes\``;
    }).join('\n'))
    .setFooter({ text: `ID: ${id}` })
    .setTimestamp(endsAt);
}

function buildButtons(guildId, pollId, options) {
  const rows  = [];
  let   row   = new ActionRowBuilder();
  let   count = 0;

  for (let i = 0; i < options.length; i++) {
    if (count === 5) {
      rows.push(row);
      row   = new ActionRowBuilder();
      count = 0;
    }
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`poll_vote_${i}:${pollId}`)
        .setLabel(`${i + 1}. ${options[i].label}`.slice(0, 80))
        .setStyle(ButtonStyle.Primary),
    );
    count++;
  }
  rows.push(row);
  return rows;
}

module.exports = { create, vote, end };
