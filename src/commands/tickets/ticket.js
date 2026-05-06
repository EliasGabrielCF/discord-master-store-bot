const {
  SlashCommandBuilder, PermissionFlagsBits,
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
} = require('discord.js');
const { t }  = require('../../utils/i18n');
const colors = require('../../utils/colors');
const { CATEGORIES } = require('../../modules/tickets/ticketCreate');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Ticket system commands')
    .addSubcommand(sub => sub.setName('panel').setDescription('Send the ticket panel to a channel')
      .addChannelOption(o => o.setName('channel').setDescription('Target channel').setRequired(false)))
    .addSubcommand(sub => sub.setName('fechar').setDescription('Close the current ticket'))
    .addSubcommand(sub => sub.setName('add').setDescription('Add a user to the ticket').addUserOption(o => o.setName('user').setDescription('User to add').setRequired(true)))
    .addSubcommand(sub => sub.setName('remove').setDescription('Remove a user from the ticket').addUserOption(o => o.setName('user').setDescription('User to remove').setRequired(true))),

  async execute(client, interaction) {
    const guildId = interaction.guildId;
    const sub     = interaction.options.getSubcommand();
    const db      = require('../../utils/database');

    if (sub === 'panel') {
      const channel = interaction.options.getChannel('channel') || interaction.channel;

      const embed = new EmbedBuilder()
        .setColor(colors.TICKET)
        .setTitle(t('ticket.panelTitle', guildId))
        .setDescription(t('ticket.panelDescription', guildId))
        .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ticket_open_support').setLabel(t('ticket.categories.support', guildId)).setStyle(ButtonStyle.Primary).setEmoji('🛠️'),
        new ButtonBuilder().setCustomId('ticket_open_purchase').setLabel(t('ticket.categories.purchase', guildId)).setStyle(ButtonStyle.Success).setEmoji('🛒'),
        new ButtonBuilder().setCustomId('ticket_open_complaint').setLabel(t('ticket.categories.complaint', guildId)).setStyle(ButtonStyle.Danger).setEmoji('📢'),
        new ButtonBuilder().setCustomId('ticket_open_other').setLabel(t('ticket.categories.other', guildId)).setStyle(ButtonStyle.Secondary).setEmoji('❓'),
      );

      await channel.send({ embeds: [embed], components: [row] });
      return interaction.reply({ content: `✅ Ticket panel sent to <#${channel.id}>`, ephemeral: true });
    }

    if (sub === 'fechar') {
      const ticketClose = require('../../modules/tickets/ticketClose');
      return ticketClose.handle(client, interaction);
    }

    if (sub === 'add') {
      const ticket = db.get(guildId, 'tickets', interaction.channel.id);
      if (!ticket) return interaction.reply({ content: t('ticket.notInTicket', guildId), ephemeral: true });
      const user = interaction.options.getUser('user');
      await interaction.channel.permissionOverwrites.edit(user.id, {
        ViewChannel: true, SendMessages: true, ReadMessageHistory: true,
      });
      return interaction.reply({ content: `✅ Added ${user} to the ticket.`, ephemeral: true });
    }

    if (sub === 'remove') {
      const ticket = db.get(guildId, 'tickets', interaction.channel.id);
      if (!ticket) return interaction.reply({ content: t('ticket.notInTicket', guildId), ephemeral: true });
      const user = interaction.options.getUser('user');
      await interaction.channel.permissionOverwrites.edit(user.id, { ViewChannel: false });
      return interaction.reply({ content: `✅ Removed ${user} from the ticket.`, ephemeral: true });
    }
  },
};
