const path = require('path');
const db   = require('./database');

const SUPPORTED = ['pt-BR', 'es', 'en'];
const DEFAULT   = process.env.DEFAULT_LANGUAGE || 'pt-BR';

// Cache loaded locale files / Fazer cache dos arquivos de idioma carregados
const cache = {};

function loadLocale(lang) {
  if (!cache[lang]) {
    try {
      cache[lang] = require(path.join(process.cwd(), 'src', 'locales', `${lang}.json`));
    } catch {
      cache[lang] = require(path.join(process.cwd(), 'src', 'locales', `${DEFAULT}.json`));
    }
  }
  return cache[lang];
}

/**
 * Get the language for a guild / Obter o idioma de um servidor.
 */
function getLang(guildId) {
  if (!guildId) return DEFAULT;
  const cfg = db.get(guildId, 'config', 'language');
  return cfg || DEFAULT;
}

/**
 * Translate a dot-notation key for a given guild / Traduzir uma chave para um servidor.
 * Supports simple variable interpolation: t('key', guildId, { name: 'João' }) / Suporta variáveis
 * In locale files use {{name}} as placeholder / Nos arquivos use {{name}} como espaço reservado.
 */
function t(key, guildId, vars = {}) {
  const lang   = getLang(guildId);
  const locale = loadLocale(lang);

  const value = key.split('.').reduce((obj, k) => (obj && obj[k] !== undefined ? obj[k] : null), locale);

  if (value === null) {
    // Fallback to English / Usar Inglês como fallback
    const fallback = loadLocale('en');
    const fb = key.split('.').reduce((obj, k) => (obj && obj[k] !== undefined ? obj[k] : null), fallback);
    if (fb === null) return key; // Return raw key as last resort / Retornar chave como último recurso
    return interpolate(fb, vars);
  }

  return interpolate(value, vars);
}

function interpolate(str, vars) {
  return str.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{{${k}}}`));
}

module.exports = { t, getLang, SUPPORTED, DEFAULT };
