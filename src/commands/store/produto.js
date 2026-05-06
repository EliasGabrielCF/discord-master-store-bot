const {
  SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
} = require('discord.js');
const db       = require('../../utils/database');
const { t }    = require('../../utils/i18n');
const colors   = require('../../utils/colors');
const products = require('../../modules/store/productManager');
const { paginate, pageButtons } = require('../../utils/pagination');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('produto')
    .setDescription('Gerenciar produtos da loja')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub => sub
      .setName('add')
      .setDescription('Adicionar um produto')
      .addStringOption(o => o.setName('nome').setDescription('Nome do produto').setRequired(true))
      .addNumberOption(o => o.setName('preco').setDescription('Preço').setRequired(true))
      .addStringOption(o => o.setName('descricao').setDescription('Descrição').setRequired(false))
      .addIntegerOption(o => o.setName('estoque').setDescription('Estoque (-1 = ilimitado)').setRequired(false))
      .addStringOption(o => o.setName('imagem').setDescription('URL da imagem').setRequired(false)))
    .addSubcommand(sub => sub
      .setName('remover')
      .setDescription('Remover um produto')
      .addStringOption(o => o.setName('id').setDescription('ID do produto').setRequired(true)))
    .addSubcommand(sub => sub
      .setName('editar')
      .setDescription('Editar um produto')
      .addStringOption(o => o.setName('id').setDescription('ID do produto').setRequired(true))
      .addStringOption(o => o.setName('nome').setDescription('Novo nome').setRequired(false))
      .addNumberOption(o => o.setName('preco').setDescription('Novo preço').setRequired(false))
      .addIntegerOption(o => o.setName('estoque').setDescription('Novo estoque').setRequired(false)))
    .addSubcommand(sub => sub.setName('listar').setDescription('Listar todos os produtos')),

  async execute(client, interaction) {
    const guildId = interaction.guildId;
    const sub     = interaction.options.getSubcommand();

    if (sub === 'add') {
      const product = products.add(guildId, {
        name:        interaction.options.getString('nome'),
        description: interaction.options.getString('descricao') || '',
        price:       interaction.options.getNumber('preco'),
        stock:       interaction.options.getInteger('estoque') ?? -1,
        imageUrl:    interaction.options.getString('imagem'),
      });
      return interaction.reply({
        embeds: [colors.success(t('product.title', guildId), t('product.added', guildId, { name: product.name }))],
        ephemeral: true,
      });
    }

    if (sub === 'remover') {
      const id      = interaction.options.getString('id');
      const product = products.remove(guildId, id);
      if (!product) return interaction.reply({ embeds: [colors.error('Error', t('product.notFound', guildId))], ephemeral: true });
      return interaction.reply({
        embeds: [colors.success(t('product.title', guildId), t('product.deleted', guildId, { name: product.name }))],
        ephemeral: true,
      });
    }

    if (sub === 'editar') {
      const id      = interaction.options.getString('id');
      const changes = {};
      const nome    = interaction.options.getString('nome');
      const preco   = interaction.options.getNumber('preco');
      const estoque = interaction.options.getInteger('estoque');
      if (nome)   changes.name  = nome;
      if (preco)  changes.price = preco;
      if (estoque !== null) changes.stock = estoque;
      const product = products.edit(guildId, id, changes);
      if (!product) return interaction.reply({ embeds: [colors.error('Error', t('product.notFound', guildId))], ephemeral: true });
      return interaction.reply({
        embeds: [colors.success(t('product.title', guildId), t('product.edited', guildId, { name: product.name }))],
        ephemeral: true,
      });
    }

    if (sub === 'listar') {
      const all = products.getAll(guildId);
      if (!all.length) return interaction.reply({ embeds: [colors.info(t('product.listTitle', guildId), t('product.noProducts', guildId))], ephemeral: true });

      const pages = paginate(all, 5).map((page, i) => {
        const embed = new EmbedBuilder()
          .setColor(colors.STORE)
          .setTitle(t('product.listTitle', guildId))
          .setFooter({ text: `Page ${i + 1}` });
        for (const p of page) {
          embed.addFields({
            name: `${p.name} — R$ ${p.price.toFixed(2)}`,
            value: `ID: \`${p.id}\` | Stock: ${p.stock === -1 ? t('product.unlimited', guildId) : p.stock}\n${p.description || '_No description_'}`,
          });
        }
        return embed;
      });

      const msg = await interaction.reply({
        embeds: [pages[0]],
        components: pages.length > 1 ? [pageButtons('products', 0, pages.length)] : [],
        fetchReply: true,
      });

      if (!client.pageCache) client.pageCache = new Map();
      client.pageCache.set(`${msg.id}_products`, { pages, page: 0 });
    }
  },
};
