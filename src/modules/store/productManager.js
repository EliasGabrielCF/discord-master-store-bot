const db   = require('../../utils/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Product schema: { id, name, description, price, stock, imageUrl, createdAt }
 * stock = -1 means unlimited
 */

function getAll(guildId) {
  return db.values(guildId, 'products');
}

function getById(guildId, productId) {
  return db.get(guildId, 'products', productId);
}

function add(guildId, { name, description, price, stock = -1, imageUrl = null }) {
  const id = uuidv4().split('-')[0].toUpperCase();
  const product = { id, name, description, price: parseFloat(price), stock: parseInt(stock), imageUrl, createdAt: Date.now() };
  db.set(guildId, 'products', id, product);
  return product;
}

function edit(guildId, productId, changes) {
  const product = db.get(guildId, 'products', productId);
  if (!product) return null;
  const updated = { ...product, ...changes };
  db.set(guildId, 'products', productId, updated);
  return updated;
}

function remove(guildId, productId) {
  const product = db.get(guildId, 'products', productId);
  if (!product) return null;
  db.delete(guildId, 'products', productId);
  return product;
}

function decrementStock(guildId, productId, qty = 1) {
  const product = db.get(guildId, 'products', productId);
  if (!product) return null;
  if (product.stock !== -1) {
    product.stock = Math.max(0, product.stock - qty);
    db.set(guildId, 'products', productId, product);
  }
  return product;
}

function isAvailable(product, qty = 1) {
  if (!product) return false;
  return product.stock === -1 || product.stock >= qty;
}

module.exports = { getAll, getById, add, edit, remove, decrementStock, isAvailable };
