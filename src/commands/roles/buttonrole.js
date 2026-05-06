const {
  SlashCommandBuilder, PermissionFlagsBits,
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
} = require('discord.js');
const { t }  = require('../../utils/i18n');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('buttonrole')
    .setDescription('Create a button role panel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(sub => sub
      .setName('criar')
      .setDescription('Create a button role panel (up to 5 roles)')
      .addStringOption(o => o.setName('titulo').setDescription('Panel title').setRequired(true))
      .addRoleOption(o => o.setName('role1').setDescription('Role 1').setRequired(true))
      .addRoleOption(o => o.setName('role2').setDescription('Role 2').setRequired(false))
      .addRoleOption(o => o.setName('role3').setDescription('Role 3').setRequired(false))
      .addRoleOption(o => o.setName('role4').setDescription('Role 4').setRequired(false))
      .addRoleOption(o => o.setName('role5').setDescription('Role 5').setRequired(false))
      .addChannelOption(o => o.setName('canal').setDescription('Channel to send the panel').setRequired(false))),

  async execute(client, interaction) {
    const guildId = interaction.guildId;
    const title   = interaction.options.getString('titulo');
    const channel = interaction.options.getChannel('canal') || interaction.channel;

    const roles = [
      interaction.options.getRole('role1'),
      interaction.options.getRole('role2'),
      interaction.options.getRole('role3'),
      interaction.options.getRole('role4'),
      interaction.options.getRole('role5'),
    ].filter(Boolean);

    const embed = new EmbedBuilder()
      .setColor(colors.PRIMARY)
      .setTitle(title)
      .setDescription(roles.map(r => `${r}`).join('\n'))
      .setFooter({ text: 'Click a button to get/remove the role' });

    const row = new ActionRowBuilder().addComponents(
      roles.map(r =>
        new ButtonBuilder()
          .setCustomId(`buttonrole_toggle:${r.id}`)
          .setLabel(r.name)
          .setStyle(ButtonStyle.Primary),
      ),
    );

    await channel.send({ embeds: [embed], components: [row] });
    return interaction.reply({
      embeds: [colors.success('Button Roles', t('buttonrole.panelCreated', guildId))],
      ephemeral: true,
    });
  },
};
