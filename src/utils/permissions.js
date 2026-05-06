const { PermissionFlagsBits } = require('discord.js');
const db = require('./database');

/**
 * Check if a member has bot admin permissions / Checar se um membro tem permissões de admin no bot.
 * Bot admin = Discord admin OR has the configured admin role / Admin do Discord OU cargo de admin configurado.
 */
function isBotAdmin(member, guildId) {
  if (!member) return false;
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  const adminRoleId = db.get(guildId, 'config', 'adminRole');
  return adminRoleId ? member.roles.cache.has(adminRoleId) : false;
}

/**
 * Check if a member is bot support staff / Checar se um membro é da equipe de suporte do bot.
 * Support staff = bot admin OR has the configured support role / Admin do bot OU cargo de suporte configurado.
 */
function isSupport(member, guildId) {
  if (!member) return false;
  if (isBotAdmin(member, guildId)) return true;
  const supportRoleId = db.get(guildId, 'config', 'supportRole');
  return supportRoleId ? member.roles.cache.has(supportRoleId) : false;
}

/**
 * Generic Discord permission check / Checagem genérica de permissões do Discord.
 */
function hasPermission(member, ...permissions) {
  return member.permissions.has(permissions);
}

module.exports = { isBotAdmin, isSupport, hasPermission };
