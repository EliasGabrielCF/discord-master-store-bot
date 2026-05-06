const db = require('../../utils/database');

/**
 * Coupon schema:
 * { code, type: 'percent'|'fixed', value, maxUses, uses, expiresAt, createdAt }
 */

function getAll(guildId) {
  return db.values(guildId, 'coupons');
}

function getByCode(guildId, code) {
  return db.get(guildId, 'coupons', code.toUpperCase());
}

function create(guildId, { code, type, value, maxUses = 0, expiresAt = null }) {
  const coupon = {
    code: code.toUpperCase(),
    type,  // 'percent' | 'fixed'
    value: parseFloat(value),
    maxUses: parseInt(maxUses),  // 0 = unlimited
    uses: 0,
    expiresAt: expiresAt ? new Date(expiresAt).getTime() : null,
    createdAt: Date.now(),
  };
  db.set(guildId, 'coupons', coupon.code, coupon);
  return coupon;
}

function remove(guildId, code) {
  const coupon = db.get(guildId, 'coupons', code.toUpperCase());
  if (!coupon) return null;
  db.delete(guildId, 'coupons', code.toUpperCase());
  return coupon;
}

/**
 * Validate and apply a coupon to a price.
 * Returns { valid, discount, finalPrice, error }
 */
function apply(guildId, code, price) {
  const coupon = getByCode(guildId, code);
  if (!coupon) return { valid: false, error: 'notFound' };
  if (coupon.expiresAt && coupon.expiresAt < Date.now()) return { valid: false, error: 'expired' };
  if (coupon.maxUses > 0 && coupon.uses >= coupon.maxUses) return { valid: false, error: 'maxUses' };

  const discount   = coupon.type === 'percent' ? (price * coupon.value) / 100 : coupon.value;
  const finalPrice = Math.max(0, price - discount);

  // Increment uses
  db.merge(guildId, 'coupons', coupon.code, { uses: coupon.uses + 1 });

  return { valid: true, discount, finalPrice, coupon };
}

module.exports = { getAll, getByCode, create, remove, apply };
