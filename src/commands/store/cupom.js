const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db      = require('../../utils/database');
const { t }   = require('../../utils/i18n');
const colors  = require('../../utils/colors');
const coupons = require('../../modules/store/couponManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cupom')
    .setDescription('Gerenciar cupons de desconto')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub => sub
      .setName('criar')
      .setDescription('Criar um novo cupom')
      .addStringOption(o => o.setName('codigo').setDescription('Código do cupom (ex: PROMO10)').setRequired(true))
      .addStringOption(o => o.setName('tipo').setDescription('Tipo de desconto').setRequired(true).addChoices(
        { name: 'Percentual (%)', value: 'percent' },
        { name: 'Valor Fixo (R$)', value: 'fixed' },
      ))
      .addNumberOption(o => o.setName('valor').setDescription('Valor do desconto').setRequired(true))
      .addIntegerOption(o => o.setName('usos').setDescription('Máximo de usos (0 = ilimitado)').setRequired(false))
      .addStringOption(o => o.setName('expira').setDescription('Data de expiração (YYYY-MM-DD)').setRequired(false)))
    .addSubcommand(sub => sub
      .setName('remover')
      .setDescription('Remover um cupom')
      .addStringOption(o => o.setName('codigo').setDescription('Código do cupom').setRequired(true)))
    .addSubcommand(sub => sub.setName('listar').setDescription('Listar cupons ativos'))
    .addSubcommand(sub => sub
      .setName('info')
      .setDescription('Ver informações de um cupom')
      .addStringOption(o => o.setName('codigo').setDescription('Código do cupom').setRequired(true))),

  async execute(client, interaction) {
    const guildId = interaction.guildId;
    const sub     = interaction.options.getSubcommand();

    if (sub === 'criar') {
      const coupon = coupons.create(guildId, {
        code:      interaction.options.getString('codigo'),
        type:      interaction.options.getString('tipo'),
        value:     interaction.options.getNumber('valor'),
        maxUses:   interaction.options.getInteger('usos') ?? 0,
        expiresAt: interaction.options.getString('expira'),
      });
      return interaction.reply({
        embeds: [colors.success(t('coupon.title', guildId), t('coupon.created', guildId, { code: coupon.code }))],
        ephemeral: true,
      });
    }

    if (sub === 'remover') {
      const code   = interaction.options.getString('codigo');
      const coupon = coupons.remove(guildId, code);
      if (!coupon) return interaction.reply({ embeds: [colors.error('Error', t('coupon.notFound', guildId))], ephemeral: true });
      return interaction.reply({
        embeds: [colors.success(t('coupon.title', guildId), t('coupon.deleted', guildId, { code }))],
        ephemeral: true,
      });
    }

    if (sub === 'listar') {
      const all = coupons.getAll(guildId);
      if (!all.length) return interaction.reply({ embeds: [colors.info(t('coupon.listTitle', guildId), t('coupon.noCoupons', guildId))], ephemeral: true });

      const embed = new EmbedBuilder().setColor(colors.STORE).setTitle(t('coupon.listTitle', guildId));
      for (const c of all) {
        const desc = c.type === 'percent' ? `${c.value}%` : `R$ ${c.value.toFixed(2)}`;
        embed.addFields({
          name: `\`${c.code}\` — ${desc}`,
          value: `Uses: ${c.uses}/${c.maxUses || '∞'} | Expires: ${c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'Never'}`,
          inline: true,
        });
      }
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'info') {
      const code   = interaction.options.getString('codigo');
      const coupon = coupons.getByCode(guildId, code);
      if (!coupon) return interaction.reply({ embeds: [colors.error('Error', t('coupon.notFound', guildId))], ephemeral: true });

      const embed = new EmbedBuilder()
        .setColor(colors.STORE)
        .setTitle(`🏷️ ${coupon.code}`)
        .addFields(
          { name: t('coupon.type', guildId), value: coupon.type === 'percent' ? t('coupon.typePercent', guildId) : t('coupon.typeFixed', guildId), inline: true },
          { name: t('coupon.value', guildId), value: coupon.type === 'percent' ? `${coupon.value}%` : `R$ ${coupon.value}`, inline: true },
          { name: t('coupon.uses', guildId), value: `${coupon.uses}/${coupon.maxUses || '∞'}`, inline: true },
          { name: t('coupon.expires', guildId), value: coupon.expiresAt ? `<t:${Math.floor(coupon.expiresAt / 1000)}:R>` : 'Never', inline: true },
        );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
