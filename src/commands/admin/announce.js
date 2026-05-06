const {
  SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder,
} = require('discord.js');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Send an announcement to a channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(opt => opt.setName('message').setDescription('Announcement text').setRequired(true))
    .addChannelOption(opt => opt.setName('channel').setDescription('Target channel').setRequired(true))
    .addStringOption(opt => opt.setName('title').setDescription('Embed title').setRequired(false))
    .addStringOption(opt => opt.setName('color').setDescription('Hex color (e.g. #5865F2)').setRequired(false))
    .addStringOption(opt => opt.setName('image').setDescription('Image URL').setRequired(false))
    .addStringOption(opt => opt.setName('ping').setDescription('Ping @everyone or a role ID').setRequired(false)),

  async execute(client, interaction) {
    const channel = interaction.options.getChannel('channel');
    const message = interaction.options.getString('message');
    const title   = interaction.options.getString('title');
    const color   = interaction.options.getString('color');
    const image   = interaction.options.getString('image');
    const ping    = interaction.options.getString('ping');

    let colorHex;
    try { colorHex = color ? parseInt(color.replace('#', ''), 16) : colors.PRIMARY; }
    catch { colorHex = colors.PRIMARY; }

    const embed = new EmbedBuilder()
      .setColor(colorHex)
      .setDescription(message)
      .setTimestamp()
      .setFooter({ text: `Sent by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

    if (title) embed.setTitle(title);
    if (image) embed.setImage(image);

    let content = '';
    if (ping === '@everyone') content = '@everyone';
    else if (ping) content = `<@&${ping}>`;

    await channel.send({ content: content || undefined, embeds: [embed] });
    return interaction.reply({ content: `✅ Announcement sent to <#${channel.id}>`, ephemeral: true });
  },
};
