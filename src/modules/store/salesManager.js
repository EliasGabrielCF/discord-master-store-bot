const db   = require('../../utils/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Sale schema:
 * { id, userId, productId, productName, quantity, unitPrice, couponCode, discount, total, date }
 */

function getAll(guildId) {
  return db.values(guildId, 'sales');
}

function register(guildId, { userId, productId, productName, quantity, unitPrice, couponCode = null, discount = 0 }) {
  const id    = uuidv4().split('-')[0].toUpperCase();
  const total = Math.max(0, (unitPrice * quantity) - discount);
  const sale  = {
    id, userId, productId, productName,
    quantity: parseInt(quantity),
    unitPrice: parseFloat(unitPrice),
    couponCode,
    discount: parseFloat(discount),
    total,
    date: Date.now(),
  };
  db.set(guildId, 'sales', id, sale);

  // Update client profile with points (1 point per $1 spent)
  const profile = db.get(guildId, 'profiles', userId) || {};
  profile.purchases = (profile.purchases || 0) + 1;
  profile.totalSpent = (profile.totalSpent || 0) + total;
  profile.points = (profile.points || 0) + Math.floor(total);
  profile.rank   = calculateRank(profile.points);
  db.set(guildId, 'profiles', userId, profile);

  return sale;
}

function getByUser(guildId, userId) {
  return getAll(guildId).filter(s => s.userId === userId);
}

function report(guildId, period = 'all') {
  const sales = getAll(guildId);
  const now   = Date.now();
  const cutoff = {
    today: now - 86400000,
    week:  now - 604800000,
    month: now - 2592000000,
    all:   0,
  }[period] || 0;

  const filtered    = sales.filter(s => s.date >= cutoff);
  const totalRev    = filtered.reduce((a, s) => a + s.total, 0);
  const productSums = {};
  for (const s of filtered) {
    productSums[s.productName] = (productSums[s.productName] || 0) + s.quantity;
  }
  const topProduct = Object.entries(productSums).sort((a, b) => b[1] - a[1])[0];

  return {
    count: filtered.length,
    revenue: totalRev,
    topProduct: topProduct ? { name: topProduct[0], qty: topProduct[1] } : null,
    period,
  };
}

function calculateRank(points) {
  if (points >= 10000) return 'diamond';
  if (points >= 3000)  return 'gold';
  if (points >= 1000)  return 'silver';
  return 'bronze';
}

module.exports = { getAll, register, getByUser, report, calculateRank };
