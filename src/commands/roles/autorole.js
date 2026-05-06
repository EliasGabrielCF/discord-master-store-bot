const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db     = require('../../utils/database');
const { t }  = require('../../utils/i18n');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autorole')
    .setDescription('Configure the auto-role given to new members')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(sub => sub
      .setName('set')
      .setDescription('Set the auto-role')
      .addRoleOption(o => o.setName('role').setDescription('Role to assign').setRequired(true)))
    .addSubcommand(sub => sub.setName('remove').setDescription('Remove the auto-role'))
    .addSubcommand(sub => sub.setName('info').setDescription('Check current auto-role')),

  async execute(client, interaction) {
    const guildId = interaction.guildId;
    const sub     = interaction.options.getSubcommand();

    if (sub === 'set') {
      const role = interaction.options.getRole('role');
      db.set(guildId, 'config', 'autoRole', role.id);
      return interaction.reply({
        embeds: [colors.success('Auto-Role', t('autorole.set', guildId, { role: role.toString() }))],
        ephemeral: true,
      });
    }

    if (sub === 'remove') {
      db.set(guildId, 'config', 'autoRole', null);
      return interaction.reply({
        embeds: [colors.warning('Auto-Role', t('autorole.removed', guildId))],
        ephemeral: true,
      });
    }

    if (sub === 'info') {
      const roleId = db.get(guildId, 'config', 'autoRole');
      const msg    = roleId ? t('autorole.current', guildId, { role: `<@&${roleId}>` }) : t('autorole.none', guildId);
      return interaction.reply({ embeds: [colors.info('Auto-Role', msg)], ephemeral: true });
    }
  },
};
