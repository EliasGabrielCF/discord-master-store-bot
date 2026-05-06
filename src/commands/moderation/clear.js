const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { t } = require('../../utils/i18n');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Clear messages from a channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(o => o.setName('amount').setDescription('Number of messages to delete (1-100)').setRequired(true)),

  async execute(client, interaction) {
    const guildId = interaction.guildId;
    const amount  = interaction.options.getInteger('amount');

    if (amount < 1 || amount > 100) {
      return interaction.reply({ content: '❌ Amount must be between 1 and 100.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const deleted = await interaction.channel.bulkDelete(amount, true);
      return interaction.editReply({
        embeds: [colors.success('Clear', t('moderation.cleared', guildId, { count: deleted.size }))],
      });
    } catch (err) {
      return interaction.editReply({ content: '❌ Failed to clear messages. Messages older than 14 days cannot be bulk deleted.' });
    }
  },
};
