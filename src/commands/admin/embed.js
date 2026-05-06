const {
  SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder,
  ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder,
} = require('discord.js');
const db     = require('../../utils/database');
const { t }  = require('../../utils/i18n');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Create and manage custom embeds')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand(sub => sub
      .setName('send')
      .setDescription('Create and send a custom embed')
      .addChannelOption(opt => opt.setName('channel').setDescription('Target channel').setRequired(true)))
    .addSubcommand(sub => sub
      .setName('template-save')
      .setDescription('Save the last created embed as a template')
      .addStringOption(opt => opt.setName('name').setDescription('Template name').setRequired(true)))
    .addSubcommand(sub => sub
      .setName('template-load')
      .setDescription('Load a saved template')
      .addStringOption(opt => opt.setName('name').setDescription('Template name').setRequired(true))
      .addChannelOption(opt => opt.setName('channel').setDescription('Target channel').setRequired(true)))
    .addSubcommand(sub => sub.setName('template-list').setDescription('List all saved templates'))
    .addSubcommand(sub => sub
      .setName('template-delete')
      .setDescription('Delete a template')
      .addStringOption(opt => opt.setName('name').setDescription('Template name').setRequired(true))),

  async execute(client, interaction) {
    const guildId = interaction.guildId;
    const sub     = interaction.options.getSubcommand();

    if (sub === 'send') {
      const channel = interaction.options.getChannel('channel');
      // Show modal for embed builder
      const modal = new ModalBuilder()
        .setCustomId(`embed_send:${channel.id}`)
        .setTitle('Embed Builder');

      const fields = [
        new TextInputBuilder().setCustomId('title').setLabel('Title').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(256),
        new TextInputBuilder().setCustomId('description').setLabel('Description').setStyle(TextInputStyle.Paragraph).setRequired(false).setMaxLength(4000),
        new TextInputBuilder().setCustomId('color').setLabel('Color (hex, e.g. #5865F2)').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(7),
        new TextInputBuilder().setCustomId('imageUrl').setLabel('Image URL (optional)').setStyle(TextInputStyle.Short).setRequired(false),
        new TextInputBuilder().setCustomId('footer').setLabel('Footer text (optional)').setStyle(TextInputStyle.Short).setRequired(false),
      ];

      for (const field of fields) {
        modal.addComponents(new ActionRowBuilder().addComponents(field));
      }

      // Store the channel for the modal handler
      if (!client.embedQueue) client.embedQueue = new Map();
      client.embedQueue.set(interaction.user.id, channel.id);

      return interaction.showModal(modal);
    }

    if (sub === 'template-list') {
      const templates = db.read(guildId, 'embedTemplates');
      const names     = Object.keys(templates);
      if (!names.length) {
        return interaction.reply({ embeds: [colors.warning('Templates', t('embed.noTemplates', guildId))], ephemeral: true });
      }
      return interaction.reply({
        embeds: [colors.info('📋 Embed Templates', names.map((n, i) => `${i + 1}. \`${n}\``).join('\n'))],
        ephemeral: true,
      });
    }

    if (sub === 'template-load') {
      const name    = interaction.options.getString('name');
      const channel = interaction.options.getChannel('channel');
      const tmpl    = db.get(guildId, 'embedTemplates', name);
      if (!tmpl) return interaction.reply({ embeds: [colors.error('Error', t('embed.notFound', guildId))], ephemeral: true });
      const embed = new EmbedBuilder(tmpl);
      await channel.send({ embeds: [embed] });
      return interaction.reply({ embeds: [colors.success('Template', t('embed.loaded', guildId, { name }))], ephemeral: true });
    }

    if (sub === 'template-delete') {
      const name = interaction.options.getString('name');
      if (!db.has(guildId, 'embedTemplates', name)) {
        return interaction.reply({ embeds: [colors.error('Error', t('embed.notFound', guildId))], ephemeral: true });
      }
      db.delete(guildId, 'embedTemplates', name);
      return interaction.reply({ embeds: [colors.success('Template', t('embed.deleted', guildId, { name }))], ephemeral: true });
    }
  },
};
