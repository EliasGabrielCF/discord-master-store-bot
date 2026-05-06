const { Events } = require('discord.js');
const cron       = require('node-cron');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`\n✅ Logged in as ${client.user.tag}`);
    console.log(`📡 Serving ${client.guilds.cache.size} guild(s)\n`);

    // Set bot activity
    client.user.setPresence({
      activities: [{ name: '🛒 Master Store Bot | /help', type: 3 }],
      status: 'online',
    });

    // ── Scheduled tasks ──────────────────────────────────────────────────────

    // Every minute: expire coupons and end giveaways/polls
    cron.schedule('* * * * *', async () => {
      const db  = require('../utils/database');
      const now = Date.now();

      for (const guild of client.guilds.cache.values()) {
        const guildId = guild.id;

        // Expire coupons
        const coupons = db.read(guildId, 'coupons');
        let changed   = false;
        for (const [code, coupon] of Object.entries(coupons)) {
          if (coupon.expiresAt && coupon.expiresAt < now) {
            delete coupons[code];
            changed = true;
          }
        }
        if (changed) db.write(guildId, 'coupons', coupons);

        // End giveaways
        const giveaways = db.read(guildId, 'giveaways');
        for (const [id, g] of Object.entries(giveaways)) {
          if (g.active && g.endsAt < now) {
            const giveawayMgr = require('../modules/giveaway/giveawayManager');
            await giveawayMgr.end(client, guildId, id).catch(() => {});
          }
        }

        // End polls
        const polls = db.read(guildId, 'polls');
        for (const [id, p] of Object.entries(polls)) {
          if (p.active && p.endsAt < now) {
            const pollMgr = require('../modules/poll/pollManager');
            await pollMgr.end(client, guildId, id).catch(() => {});
          }
        }
      }
    });
  },
};
