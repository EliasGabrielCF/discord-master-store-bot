const {
  SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder,
  ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle,
} = require('discord.js');
const db     = require('../../utils/database');
const { t }  = require('../../utils/i18n');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('View and manage bot configuration')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub => sub.setName('view').setDescription('View current configuration'))
    .addSubcommand(sub => sub
      .setName('set')
      .setDescription('Set a configuration value')
      .addStringOption(opt =>
        opt.setName('key')
          .setDescription('Configuration key')
          .setRequired(true)
          .addChoices(
            { name: 'Admin Role', value: 'adminRole' },
            { name: 'Support Role', value: 'supportRole' },
            { name: 'Auto Role', value: 'autoRole' },
            { name: 'Log Channel', value: 'logChannel' },
            { name: 'Welcome Channel', value: 'welcomeChannel' },
            { name: 'Ticket Category', value: 'ticketCategory' },
            { name: 'Store Channel', value: 'storeChannel' },
          ))
      .addStringOption(opt => opt.setName('value').setDescription('Value (role ID or channel ID)').setRequired(true))),

  async execute(client, interaction) {
    const guildId = interaction.guildId;
    const sub     = interaction.options.getSubcommand();

    if (sub === 'view') {
      const cfg = db.read(guildId, 'config');

      const fmt = (val) => {
        if (!val) return '`Not set`';
        return `\`${val}\``;
      };

      const embed = new EmbedBuilder()
        .setColor(colors.PRIMARY)
        .setTitle(t('config.title', guildId))
        .setThumbnail(interaction.guild.iconURL())
        .addFields(
          { name: '⚙️ Admin Role',        value: cfg.adminRole       ? `<@&${cfg.adminRole}>`       : '`Not set`', inline: true },
          { name: '🛡️ Support Role',      value: cfg.supportRole     ? `<@&${cfg.supportRole}>`     : '`Not set`', inline: true },
          { name: '🤖 Auto Role',         value: cfg.autoRole        ? `<@&${cfg.autoRole}>`        : '`Not set`', inline: true },
          { name: '📋 Log Channel',       value: cfg.logChannel      ? `<#${cfg.logChannel}>`       : '`Not set`', inline: true },
          { name: '👋 Welcome Channel',   value: cfg.welcomeChannel  ? `<#${cfg.welcomeChannel}>`  : '`Not set`', inline: true },
          { name: '🎫 Ticket Category',   value: cfg.ticketCategory  ? `<#${cfg.ticketCategory}>`  : '`Not set`', inline: true },
          { name: '🛒 Store Channel',     value: cfg.storeChannel    ? `<#${cfg.storeChannel}>`    : '`Not set`', inline: true },
          { name: '🌐 Language',          value: fmt(cfg.language || process.env.DEFAULT_LANGUAGE || 'pt-BR'), inline: true },
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'set') {
      const key   = interaction.options.getString('key');
      const value = interaction.options.getString('value');
      db.set(guildId, 'config', key, value);
      return interaction.reply({
        embeds: [colors.success(t('config.title', guildId), t('config.updated', guildId, { key, value }))],
        ephemeral: true,
      });
    }
  },
};
