const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { t }      = require('../../utils/i18n');
const colors     = require('../../utils/colors');
const sales      = require('../../modules/store/salesManager');
const products   = require('../../modules/store/productManager');
const coupons    = require('../../modules/store/couponManager');
const { paginate, pageButtons } = require('../../utils/pagination');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('venda')
    .setDescription('Gerenciar vendas da loja')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub => sub
      .setName('registrar')
      .setDescription('Registrar uma venda manualmente')
      .addUserOption(o => o.setName('cliente').setDescription('Cliente').setRequired(true))
      .addStringOption(o => o.setName('produto_id').setDescription('ID do produto').setRequired(true))
      .addIntegerOption(o => o.setName('quantidade').setDescription('Quantidade').setRequired(false))
      .addStringOption(o => o.setName('cupom').setDescription('Código do cupom (opcional)').setRequired(false)))
    .addSubcommand(sub => sub
      .setName('historico')
      .setDescription('Ver histórico de vendas')
      .addUserOption(o => o.setName('cliente').setDescription('Filtrar por cliente (opcional)').setRequired(false)))
    .addSubcommand(sub => sub
      .setName('relatorio')
      .setDescription('Ver relatório de vendas')
      .addStringOption(o => o.setName('periodo').setDescription('Período').setRequired(false).addChoices(
        { name: 'Hoje', value: 'today' },
        { name: 'Esta Semana', value: 'week' },
        { name: 'Este Mês', value: 'month' },
        { name: 'Todos os Tempos', value: 'all' },
      ))),

  async execute(client, interaction) {
    const guildId = interaction.guildId;
    const sub     = interaction.options.getSubcommand();

    if (sub === 'registrar') {
      const user      = interaction.options.getUser('cliente');
      const productId = interaction.options.getString('produto_id');
      const qty       = interaction.options.getInteger('quantidade') || 1;
      const couponCode = interaction.options.getString('cupom');
      const product   = products.getById(guildId, productId);

      if (!product) return interaction.reply({ embeds: [colors.error('Error', t('product.notFound', guildId))], ephemeral: true });
      if (!products.isAvailable(product, qty)) return interaction.reply({ embeds: [colors.error('Error', t('product.outOfStock', guildId, { name: product.name }))], ephemeral: true });

      let discount = 0;
      if (couponCode) {
        const result = coupons.apply(guildId, couponCode, product.price * qty);
        if (!result.valid) return interaction.reply({ embeds: [colors.error('Cupom', t(`coupon.${result.error}`, guildId))], ephemeral: true });
        discount = result.discount;
      }

      const sale = sales.register(guildId, {
        userId: user.id, productId, productName: product.name,
        quantity: qty, unitPrice: product.price, couponCode, discount,
      });

      products.decrementStock(guildId, productId, qty);

      return interaction.reply({
        embeds: [colors.success(t('sale.title', guildId), t('sale.registered', guildId, { id: sale.id }))],
        ephemeral: true,
      });
    }

    if (sub === 'historico') {
      const user  = interaction.options.getUser('cliente');
      const all   = user ? sales.getByUser(guildId, user.id) : sales.getAll(guildId);

      if (!all.length) return interaction.reply({ embeds: [colors.info(t('sale.historyTitle', guildId), t('sale.noSales', guildId))], ephemeral: true });

      const sorted = [...all].sort((a, b) => b.date - a.date);
      const pages  = paginate(sorted, 5).map((page, i) => {
        const embed = new EmbedBuilder().setColor(colors.STORE).setTitle(t('sale.historyTitle', guildId)).setFooter({ text: `Page ${i + 1}` });
        for (const s of page) {
          embed.addFields({
            name: `#${s.id} — ${s.productName}`,
            value: `User: <@${s.userId}> | Qty: ${s.quantity} | Total: R$ ${s.total.toFixed(2)} | <t:${Math.floor(s.date / 1000)}:R>`,
          });
        }
        return embed;
      });

      const msg = await interaction.reply({ embeds: [pages[0]], components: pages.length > 1 ? [pageButtons('sales', 0, pages.length)] : [], fetchReply: true });
      if (!client.pageCache) client.pageCache = new Map();
      client.pageCache.set(`${msg.id}_sales`, { pages, page: 0 });
    }

    if (sub === 'relatorio') {
      const period = interaction.options.getString('periodo') || 'all';
      const rep    = sales.report(guildId, period);

      const embed = new EmbedBuilder()
        .setColor(colors.STORE)
        .setTitle(t('sale.reportTitle', guildId))
        .addFields(
          { name: t('sale.totalSales', guildId), value: `${rep.count}`, inline: true },
          { name: t('sale.totalRevenue', guildId), value: `R$ ${rep.revenue.toFixed(2)}`, inline: true },
          { name: t('sale.topProduct', guildId), value: rep.topProduct ? `${rep.topProduct.name} (${rep.topProduct.qty} sold)` : 'N/A', inline: true },
        )
        .setFooter({ text: `Period: ${t(`sale.${period}`, guildId)}` })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }
  },
};
