const { EmbedBuilder } = require('discord.js');

// Brand colors used across all embeds / Cores da marca usadas em todos os embeds
module.exports = {
  PRIMARY:   0x5865F2, // Discord Blurple
  SUCCESS:   0x57F287, // Green
  ERROR:     0xED4245, // Red
  WARNING:   0xFEE75C, // Yellow
  INFO:      0x5865F2, // Blurple
  TICKET:    0xEB459E, // Pink
  STORE:     0xF4900C, // Orange
  MOD:       0xED4245, // Red
  NEUTRAL:   0x2B2D31, // Dark

  /**
   * Quick embed builders for consistency / Construtores rápidos de embed para consistência
   */
  success(title, description) {
    return new EmbedBuilder()
      .setColor(this.SUCCESS)
      .setTitle(`✅ ${title}`)
      .setDescription(description)
      .setTimestamp();
  },

  error(title, description) {
    return new EmbedBuilder()
      .setColor(this.ERROR)
      .setTitle(`❌ ${title}`)
      .setDescription(description)
      .setTimestamp();
  },

  warning(title, description) {
    return new EmbedBuilder()
      .setColor(this.WARNING)
      .setTitle(`⚠️ ${title}`)
      .setDescription(description)
      .setTimestamp();
  },

  info(title, description) {
    return new EmbedBuilder()
      .setColor(this.INFO)
      .setTitle(`ℹ️ ${title}`)
      .setDescription(description)
      .setTimestamp();
  },
};
