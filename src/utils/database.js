const fse = require('fs-extra');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');

/**
 * Simple JSON-based database manager / Gerenciador de banco de dados simples baseado em JSON.
 * Each guild has its own folder: data/{guildId}/{collection}.json / Cada servidor tem sua própria pasta
 * Structure is intentionally simple so anyone can read/edit the data files directly / Estrutura simples para edição direta.
 */
class Database {
  constructor() {
    fse.ensureDirSync(DATA_DIR);
  }

  _filePath(guildId, collection) {
    const dir = path.join(DATA_DIR, guildId);
    fse.ensureDirSync(dir);
    return path.join(dir, `${collection}.json`);
  }

  /** Read an entire collection (returns {} if not found) / Ler uma coleção inteira */
  read(guildId, collection) {
    try {
      return fse.readJsonSync(this._filePath(guildId, collection));
    } catch {
      return {};
    }
  }

  /** Write an entire collection / Escrever uma coleção inteira */
  write(guildId, collection, data) {
    fse.writeJsonSync(this._filePath(guildId, collection), data, { spaces: 2 });
  }

  /** Get a single key from a collection / Obter uma chave única de uma coleção */
  get(guildId, collection, key) {
    const col = this.read(guildId, collection);
    return col[key];
  }

  /** Set a single key in a collection / Definir uma chave única em uma coleção */
  set(guildId, collection, key, value) {
    const col = this.read(guildId, collection);
    col[key] = value;
    this.write(guildId, collection, col);
    return value;
  }

  /** Delete a single key from a collection / Deletar uma chave de uma coleção */
  delete(guildId, collection, key) {
    const col = this.read(guildId, collection);
    delete col[key];
    this.write(guildId, collection, col);
  }

  /** Push an item to an array stored under a key / Adicionar item a um array armazenado em uma chave */
  push(guildId, collection, key, item) {
    const col = this.read(guildId, collection);
    if (!Array.isArray(col[key])) col[key] = [];
    col[key].push(item);
    this.write(guildId, collection, col);
    return col[key];
  }

  /** Get all keys of a collection as an array of [key, value] / Obter todas as chaves como um array */
  entries(guildId, collection) {
    return Object.entries(this.read(guildId, collection));
  }

  /** Get all values of a collection / Obter todos os valores de uma coleção */
  values(guildId, collection) {
    return Object.values(this.read(guildId, collection));
  }

  /** Check if a key exists / Checar se uma chave existe */
  has(guildId, collection, key) {
    return key in this.read(guildId, collection);
  }

  /** Merge partial data into an existing key / Mesclar dados parciais em uma chave existente */
  merge(guildId, collection, key, partial) {
    const existing = this.get(guildId, collection, key) || {};
    return this.set(guildId, collection, key, { ...existing, ...partial });
  }
}

module.exports = new Database();
