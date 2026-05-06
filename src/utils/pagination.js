const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

/**
 * Splits an array into pages of `pageSize` items / Divide um array em páginas de tamanho `pageSize`.
 */
function paginate(array, pageSize = 5) {
  const pages = [];
  for (let i = 0; i < array.length; i += pageSize) {
    pages.push(array.slice(i, i + pageSize));
  }
  return pages.length ? pages : [[]];
}

/**
 * Creates prev/next navigation buttons / Cria botões de navegação anterior/próximo.
 * customId format: `page_{action}_{namespace}:{...extra}` 
 * e.g. `page_prev_products`
 */
function pageButtons(namespace, currentPage, totalPages) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`page_prev_${namespace}`)
      .setLabel('◀')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage === 0),
    new ButtonBuilder()
      .setCustomId(`page_info_${namespace}`)
      .setLabel(`${currentPage + 1} / ${totalPages}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`page_next_${namespace}`)
      .setLabel('▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage === totalPages - 1),
  );
}

module.exports = { paginate, pageButtons };
