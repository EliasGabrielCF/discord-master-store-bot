const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { t } = require('../../utils/i18n');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot latency'),

  async execute(client, interaction) {
    const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;

    const embed = new EmbedBuilder()
      .setColor(colors.INFO)
      .setTitle('🏓 Pong!')
      .addFields(
        { name: 'Bot Latency', value: `\`${latency}ms\``, inline: true },
        { name: 'API Latency', value: `\`${Math.round(client.ws.ping)}ms\``, inline: true },
      )
      .setTimestamp();

    return interaction.editReply({ content: null, embeds: [embed] });
  },
};
