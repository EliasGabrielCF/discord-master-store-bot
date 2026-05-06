# Discord Master Bot 🤖

The ultimate open-source Discord bot for managing communities and stores. Built with **Discord.js v14**, this bot is completely autonomous, multi-language, and uses a local JSON database (meaning no complex database setup is required!).

*Developed by Elias Gabriel (FLEG)*

## 🌟 Features

- 🎫 **Advanced Ticket System**: Custom categories, transcripts in HTML, rating system, claim button.
- 🛒 **Store Management**: Product registry, inventory tracking, manual sales logging, coupon codes (fixed/percentage).
- 👤 **Client Profiles**: Loyalty points based on purchases, rank system (Bronze to Diamond).
- 🎭 **Role Management**: Auto-role on join, Button-role panels.
- 📋 **Embed Builder**: Create, save, and load custom embeds directly through Discord modals.
- 🔨 **Moderation**: Ban, kick, mute (timeout), warn, slowmode, purge.
- 📊 **Giveaways & Polls**: Create rich polls and giveaways with automatic winner selection.
- 🌐 **Multi-Language**: PT-BR, EN, and ES supported natively.
- ⚙️ **Configurable**: Fully manageable via slash commands (`/config`).

## 🚀 Installation & Hosting

### 1. Requirements
- [Node.js](https://nodejs.org/) v18.0.0 or newer.
- A Discord Bot Token (Get it from the [Discord Developer Portal](https://discord.com/developers/applications)).
- Enable **Server Members Intent** and **Message Content Intent** in your Bot settings.

### 2. Setup

1. Clone or download this repository.
2. Open a terminal in the folder and install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your details:
   - `DISCORD_TOKEN`: Your bot token.
   - `CLIENT_ID`: Your application ID.
   - `GUILD_ID`: (Optional) Put your server ID here for instant slash command deployment during testing. Leave empty for global deployment.

### 3. Deploying Slash Commands
Before running the bot, you must register the commands with Discord:
```bash
node deploy-commands.js
```

### 4. Running the Bot
```bash
npm start
```

## 🌐 Hosting (VPS / Cloud)
Since this bot uses a local JSON database (`data/` folder) and local transcripts (`transcripts/` folder), you need a hosting provider with **persistent storage**.

- **VPS (Ubuntu/Debian)**: Highly recommended. Just clone the repo, install Node, and use `pm2` to keep it running forever (`pm2 start src/index.js --name "bot"`).
- **Railway/Render**: Make sure to mount a persistent volume to the `/data` and `/transcripts` directories, otherwise you will lose all products, tickets, and configs on every restart!

## 💳 Payment Gateway Integration (Developer Note)
This bot includes a robust manual sales registry (`/venda registrar`). If you want the bot to automatically process payments (e.g., Mercado Pago, Stripe, PayPal) and deliver products without human interaction:

1. Look in `.env` for the commented `PAYMENT_GATEWAY` placeholders.
2. You will need to implement a simple Express.js web server inside `src/index.js` to listen for Webhooks from your payment provider.
3. Upon receiving an `approved` payment webhook, call `salesManager.register()` and DM the user their product.

Since this is a general open-source template, automatic payment delivery logic is omitted, as it varies drastically between Mercado Pago (BR/Latam), Stripe (Global), and others.

## 🤝 Contributing
Feel free to fork, make modifications, and open a Pull Request! The code is modular, well-commented, and split into clear directories.

## 📄 License
MIT License - Free to use, modify, and distribute.
