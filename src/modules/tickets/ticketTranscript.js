const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const fse    = require('fs-extra');
const path   = require('path');
const db     = require('../../utils/database');
const { t }  = require('../../utils/i18n');
const colors = require('../../utils/colors');

/**
 * Generate an HTML transcript of the ticket and send it to the log channel.
 */
async function generate(client, interaction, ticket, channel) {
  const { guild } = interaction || { guild: channel.guild };
  const guildId   = guild.id;

  try {
    // Fetch all messages in the channel
    const messages = [];
    let lastId;
    while (true) {
      const fetched = await channel.messages.fetch({ limit: 100, before: lastId });
      if (!fetched.size) break;
      messages.push(...fetched.values());
      lastId = fetched.last().id;
    }
    messages.reverse();

    // Build HTML
    const html = buildHTML(guild, ticket, messages, channel.name);

    // Save file
    const transcriptsDir = path.join(process.cwd(), 'transcripts');
    fse.ensureDirSync(transcriptsDir);
    const fileName = `ticket-${ticket.number}-${Date.now()}.html`;
    const filePath = path.join(transcriptsDir, fileName);
    fse.writeFileSync(filePath, html, 'utf8');

    // Send to log channel
    const logChannelId = db.get(guildId, 'config', 'logChannel');
    if (logChannelId) {
      const logCh = guild.channels.cache.get(logChannelId);
      if (logCh) {
        const attachment = new AttachmentBuilder(filePath, { name: fileName });
        const embed = new EmbedBuilder()
          .setColor(colors.NEUTRAL)
          .setTitle(`📄 Transcript — Ticket #${ticket.number}`)
          .addFields(
            { name: 'User', value: `<@${ticket.userId}>`, inline: true },
            { name: 'Messages', value: `${messages.length}`, inline: true },
            { name: 'Category', value: ticket.category || 'Unknown', inline: true },
          )
          .setTimestamp();
        await logCh.send({ embeds: [embed], files: [attachment] }).catch(() => {});
      }
    }

    return filePath;
  } catch (err) {
    console.error('[Transcript] Error generating transcript:', err);
    return null;
  }
}

/**
 * Handle transcript button inside a ticket
 */
async function handle(client, interaction) {
  const { channel, guild, member } = interaction;
  const guildId = guild.id;
  const ticket  = db.get(guildId, 'tickets', channel.id);

  if (!ticket) return interaction.reply({ content: t('ticket.notInTicket', guildId), ephemeral: true });

  await interaction.deferReply({ ephemeral: true });
  const result = await generate(client, interaction, ticket, channel);

  return interaction.editReply({
    content: result
      ? t('ticket.transcriptSaved', guildId, { channel: `<#${db.get(guildId, 'config', 'logChannel') || channel.id}>` })
      : '❌ Failed to generate transcript.',
  });
}

function buildHTML(guild, ticket, messages, channelName) {
  const rows = messages.map(msg => {
    const time    = new Date(msg.createdTimestamp).toLocaleString();
    const content = escapeHtml(msg.content || '') || '<em>[embed/attachment]</em>';
    const avatar  = msg.author.displayAvatarURL({ format: 'png', size: 32 });
    return `
      <div class="message">
        <img class="avatar" src="${avatar}" alt="avatar"/>
        <div class="content">
          <span class="author" style="color:${msg.member?.displayHexColor || '#fff'}">${escapeHtml(msg.author.tag)}</span>
          <span class="time">${time}</span>
          <p>${content}</p>
        </div>
      </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Ticket #${ticket.number} Transcript</title>
  <style>
    body { background:#313338; color:#dbdee1; font-family:'Segoe UI',sans-serif; margin:0; padding:20px; }
    header { background:#2b2d31; padding:16px 24px; border-radius:8px; margin-bottom:20px; }
    header h1 { margin:0; font-size:1.4rem; color:#5865f2; }
    header p  { margin:4px 0 0; font-size:.85rem; color:#96989d; }
    .message { display:flex; gap:12px; margin-bottom:16px; }
    .avatar  { width:32px; height:32px; border-radius:50%; margin-top:4px; }
    .author  { font-weight:700; font-size:.9rem; margin-right:8px; }
    .time    { font-size:.75rem; color:#96989d; }
    p        { margin:4px 0 0; line-height:1.5; }
  </style>
</head>
<body>
  <header>
    <h1>🎫 Ticket #${ticket.number} — ${ticket.category}</h1>
    <p>Server: ${escapeHtml(guild.name)} | Channel: #${escapeHtml(channelName)} | Messages: ${messages.length}</p>
  </header>
  <main>${rows}</main>
</body>
</html>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = { generate, handle };
