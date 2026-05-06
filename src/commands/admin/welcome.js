const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db     = require('../../utils/database');
const { t }  = require('../../utils/i18n');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Configure the welcome system')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub => sub
      .setName('set')
      .setDescription('Set the welcome channel')
      .addChannelOption(opt => opt.setName('channel').setDescription('Welcome channel').setRequired(true)))
    .addSubcommand(sub => sub
      .setName('message')
      .setDescription('Set a custom welcome message')
      .addStringOption(opt => opt
        .setName('text')
        .setDescription('Use {user} {server} {count} as placeholders')
        .setRequired(true)))
    .addSubcommand(sub => sub.setName('test').setDescription('Send a test welcome message'))
    .addSubcommand(sub => sub.setName('disable').setDescription('Disable welcome messages')),

  async execute(client, interaction) {
    const guildId = interaction.guildId;
    const sub     = interaction.options.getSubcommand();

    if (sub === 'set') {
      const channel = interaction.options.getChannel('channel');
      db.set(guildId, 'config', 'welcomeChannel', channel.id);
      return interaction.reply({
        embeds: [colors.success('Welcome', t('welcome.set', guildId, { channel: `<#${channel.id}>` }))],
        ephemeral: true,
      });
    }

    if (sub === 'message') {
      const text = interaction.options.getString('text');
      db.set(guildId, 'config', 'welcomeMessage', text);
      return interaction.reply({
        embeds: [colors.success('Welcome', t('welcome.messageSet', guildId))],
        ephemeral: true,
      });
    }

    if (sub === 'test') {
      // Fire a fake guildMemberAdd
      const event = require('../../events/guildMemberAdd');
      await event.execute(client, interaction.member);
      return interaction.reply({
        embeds: [colors.success('Welcome', t('welcome.test', guildId))],
        ephemeral: true,
      });
    }

    if (sub === 'disable') {
      db.set(guildId, 'config', 'welcomeChannel', null);
      return interaction.reply({
        embeds: [colors.warning('Welcome', 'Welcome messages disabled.')],
        ephemeral: true,
      });
    }
  },
};
