const ticketCreate    = require('../modules/tickets/ticketCreate');
const ticketClose     = require('../modules/tickets/ticketClose');
const ticketTranscript = require('../modules/tickets/ticketTranscript');
const buttonRole      = require('../modules/roles/buttonRole');
const { t }           = require('../utils/i18n');
const colors          = require('../utils/colors');

/**
 * Central router for all button clicks, select menus, and modals / Roteador central para todos os botões e menus.
 * customId convention:  action_param1_param2:data
 * Examples / Exemplos:
 *   ticket_open_support
 *   ticket_close:ticketId
 *   ticket_claim:ticketId
 *   ticket_transcript:ticketId
 *   ticket_rating_3:ticketId
 *   buttonrole_toggle:roleId
 *   page_prev_products
 *   page_next_products
 *   lang_select   (StringSelectMenuInteraction)
 *   giveaway_enter:giveawayId
 *   poll_vote_0:pollId
 *   confirm_delete_product:productId
 */
async function handleComponent(client, interaction) {
  const guildId = interaction.guildId;
  const id      = interaction.customId;

  try {
    // ── Ticket buttons / Botões de ticket ─────────────────────────────────────────────────────
    if (id.startsWith('ticket_open_')) {
      const category = id.replace('ticket_open_', '');
      return await ticketCreate.handle(client, interaction, category);
    }

    if (id.startsWith('ticket_close')) {
      return await ticketClose.handle(client, interaction);
    }

    if (id.startsWith('ticket_confirm_close')) {
      return await ticketClose.confirm(client, interaction);
    }

    if (id.startsWith('ticket_claim')) {
      return await ticketCreate.claim(client, interaction);
    }

    if (id.startsWith('ticket_transcript')) {
      return await ticketTranscript.handle(client, interaction);
    }

    if (id.startsWith('ticket_rating_')) {
      const stars = parseInt(id.split('_')[2]);
      return await ticketClose.handleRating(client, interaction, stars);
    }

    // ── Button Roles / Cargos por botão ────────────────────────────────────────────────────────
    if (id.startsWith('buttonrole_toggle:')) {
      const roleId = id.split(':')[1];
      return await buttonRole.toggle(client, interaction, roleId);
    }

    // ── Language selector / Seletor de idioma ───────────────────────────────────────────────────
    if (id === 'lang_select') {
      const { SUPPORTED } = require('../utils/i18n');
      const db = require('../utils/database');
      const selected = interaction.values[0];
      if (!SUPPORTED.includes(selected)) return;
      db.set(guildId, 'config', 'language', selected);
      return interaction.update({
        embeds: [colors.success(t('language.title', guildId), t('language.changed', guildId))],
        components: [],
      });
    }

    // ── Giveaway enter button / Botão de entrar em sorteio ───────────────────────────────────────────────
    if (id.startsWith('giveaway_enter:')) {
      const giveawayId = id.split(':')[1];
      const giveaway   = require('../modules/giveaway/giveawayManager');
      return await giveaway.enter(client, interaction, giveawayId);
    }

    // ── Poll vote buttons / Botões de enquete ───────────────────────────────────────────────────
    if (id.startsWith('poll_vote_')) {
      const parts    = id.split(':');
      const optIndex = parseInt(parts[0].replace('poll_vote_', ''));
      const pollId   = parts[1];
      const pollMgr  = require('../modules/poll/pollManager');
      return await pollMgr.vote(client, interaction, pollId, optIndex);
    }

    // ── Pagination / Paginação (handled per command via client.pageCache) ───────────────
    if (id.startsWith('page_')) {
      const parts     = id.split('_');   // ['page','prev','products']
      const direction = parts[1];        // prev | next | info
      const namespace = parts.slice(2).join('_');
      const cache     = client.pageCache?.get(`${interaction.message.id}_${namespace}`);
      if (!cache) return interaction.update({ content: '⏳', components: [] });
      let page = cache.page;
      if (direction === 'next') page = Math.min(page + 1, cache.pages.length - 1);
      if (direction === 'prev') page = Math.max(page - 1, 0);
      cache.page = page;
      client.pageCache.set(`${interaction.message.id}_${namespace}`, cache);
      const { pageButtons } = require('../utils/pagination');
      return interaction.update({
        embeds: [cache.pages[page]],
        components: [pageButtons(namespace, page, cache.pages.length)],
      });
    }

  } catch (err) {
    console.error('[ComponentHandler]', err);
    const reply = { content: `❌ An error occurred.`, ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
}

module.exports = { handleComponent };
