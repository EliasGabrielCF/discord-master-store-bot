const db = require('../../utils/database');
const { t } = require('../../utils/i18n');
const colors = require('../../utils/colors');

/**
 * Button roles — toggle a role on/off when a user clicks a button.
 */
async function toggle(client, interaction, roleId) {
  const { guild, member } = interaction;
  const guildId = guild.id;
  const role    = guild.roles.cache.get(roleId);

  if (!role) return interaction.reply({ content: '❌ Role not found.', ephemeral: true });

  if (member.roles.cache.has(roleId)) {
    await member.roles.remove(role);
    return interaction.reply({
      embeds: [colors.info(t('buttonrole.roleRemoved', guildId, { role: role.name }), '\u200b')],
      ephemeral: true,
    });
  } else {
    await member.roles.add(role);
    return interaction.reply({
      embeds: [colors.success(t('buttonrole.roleAdded', guildId, { role: role.name }), '\u200b')],
      ephemeral: true,
    });
  }
}

module.exports = { toggle };
