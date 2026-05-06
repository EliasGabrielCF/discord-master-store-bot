const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db    = require('../../utils/database');
const { t } = require('../../utils/i18n');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand(sub => sub
      .setName('add')
      .setDescription('Give a warning to a user')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(true)))
    .addSubcommand(sub => sub
      .setName('list')
      .setDescription('List warnings of a user')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true)))
    .addSubcommand(sub => sub
      .setName('clear')
      .setDescription('Clear all warnings of a user')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))),

  async execute(client, interaction) {
    const guildId = interaction.guildId;
    const sub     = interaction.options.getSubcommand();
    const target  = interaction.options.getUser('user');

    if (sub === 'add') {
      const reason   = interaction.options.getString('reason');
      const warnings = db.get(guildId, 'warnings', target.id) || [];
      warnings.push({ reason, by: interaction.user.id, at: Date.now() });
      db.set(guildId, 'warnings', target.id, warnings);

      // Update profile
      const profile = db.get(guildId, 'profiles', target.id) || {};
      profile.warnings = warnings.length;
      db.set(guildId, 'profiles', target.id, profile);

      // DM the user
      const member = await interaction.guild.members.fetch(target.id).catch(() => null);
      if (member) {
        member.send({ content: t('moderation.dmWarned', guildId, { guild: interaction.guild.name, count: warnings.length, reason }) }).catch(() => {});
      }

      return interaction.reply({
        embeds: [colors.warning(t('log.warn', guildId), t('moderation.warned', guildId, { user: target.tag, count: warnings.length, reason }))],
      });
    }

    if (sub === 'list') {
      const warnings = db.get(guildId, 'warnings', target.id) || [];
      if (!warnings.length) return interaction.reply({ embeds: [colors.info('Warnings', t('moderation.noWarnings', guildId, { user: target.tag }))], ephemeral: true });

      const embed = new EmbedBuilder()
        .setColor(colors.WARNING)
        .setTitle(t('moderation.warningsList', guildId, { user: target.tag }));

      warnings.forEach((w, i) => {
        embed.addFields({ name: `#${i + 1} — <t:${Math.floor(w.at / 1000)}:R>`, value: `**Reason:** ${w.reason}\n**By:** <@${w.by}>` });
      });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'clear') {
      db.delete(guildId, 'warnings', target.id);
      const profile = db.get(guildId, 'profiles', target.id) || {};
      profile.warnings = 0;
      db.set(guildId, 'profiles', target.id, profile);
      return interaction.reply({ embeds: [colors.success('Warnings', t('moderation.warningsCleared', guildId, { user: target.tag }))] });
    }
  },
};
