<div align="center">

# 🤖 Discord Master Store Bot

**The Ultimate Open-Source Discord Bot for Stores & Communities**  
*Uma solução completa, autônoma e open-source para o seu servidor.*

[![Discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.js.org)
[![Node.js](https://img.shields.io/badge/Node.js-18+-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Author](https://img.shields.io/badge/Author-Elias%20Gabriel%20(FLEG)-FF5722?style=for-the-badge&logo=github&logoColor=white)](https://github.com/EliasGabrielCF)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

</div>

<br>

## 🌟 Features / Funcionalidades

Este bot foi desenhado para ser **100% autônomo** e não requer bancos de dados complexos (utiliza um sistema JSON local otimizado). 

| Módulo | Funcionalidades |
| :--- | :--- |
| 🎫 **Tickets** | Sistema avançado com categorias, transcrições em HTML e sistema de avaliação. |
| 🛒 **Store** | Registro de produtos, estoque, histórico de vendas e cupons de desconto (% e fixo). |
| 👤 **Profiles** | Pontos de fidelidade por compras e sistema de Ranks (Bronze ao Diamante). |
| 🎭 **Roles** | Auto-role para novos membros e painéis interativos de Button-role. |
| 🔨 **Moderação** | Ban, kick, mute (timeout), warn, slowmode e clear (purge). |
| 📊 **Interação** | Criação de enquetes ricas e sistema de sorteios. |
| 🌐 **Idiomas** | Suporte nativo por servidor para **PT-BR**, **EN** e **ES**. |

---

## 🚀 Como Instalar (Setup)

### 1. Requisitos
- [Node.js](https://nodejs.org/) v18.0.0 ou superior.
- Um Token de Bot do Discord (Obtenha no [Discord Developer Portal](https://discord.com/developers/applications)).
- Ative as intents: **Server Members Intent** e **Message Content Intent** nas configurações do seu Bot.

### 2. Configuração

1. Clone ou baixe este repositório.
2. Abra o terminal na pasta e instale as dependências:
   ```bash
   npm install
   ```
3. Copie o arquivo `.env.example` para `.env` e preencha com suas chaves:
   - `DISCORD_TOKEN`: O token do seu bot.
   - `CLIENT_ID`: O ID da aplicação do bot.
   - `GUILD_ID`: (Opcional) Coloque o ID do seu servidor de testes para publicar os comandos `/` instantaneamente.

### 3. Publicando os Comandos Slash
Antes de ligar o bot, registre os comandos no Discord:
```bash
node deploy-commands.js
```

### 4. Iniciando o Bot
```bash
npm start
```

---

## 🌐 Hospedagem (Hosting)

Como este bot utiliza um banco de dados local (`data/`) e salva os logs de ticket localmente (`transcripts/`), você precisa de uma hospedagem com **armazenamento persistente** (Persistent Storage).

- ✔️ **Recomendado (VPS):** Ubuntu/Debian. Basta clonar, instalar o Node e usar o `pm2` para mantê-lo online (`pm2 start src/index.js --name "bot"`).
- ⚠️ **Railway/Render:** Certifique-se de configurar e montar um *Persistent Volume* para as pastas `/data` e `/transcripts`. Caso contrário, você perderá todos os produtos, tickets e dados a cada reinício!

---

## 💳 Integração de Pagamentos (Para Devs)

Este bot possui um registro manual de vendas (`/venda registrar`). Se você deseja que o bot processe pagamentos automáticos (Mercado Pago, Stripe, PayPal) e entregue os produtos sem interação humana:

1. No arquivo `.env`, existem espaços reservados (`PAYMENT_GATEWAY`).
2. Implemente um servidor *Express.js* simples dentro do `src/index.js` para escutar os Webhooks do seu provedor de pagamentos.
3. Ao receber um webhook de pagamento aprovado, chame `salesManager.register()` e envie o produto na DM do usuário.

Como este é um template open-source, a lógica automática foi abstraída, pois varia drasticamente entre o Mercado Pago (BR/Latam) e Stripe (Global).

---

<div align="center">
  <b>Developed with ❤️ by <a href="https://github.com/EliasGabrielCF">Elias Gabriel (FLEG)</a></b><br>
  Feel free to fork, modify, and open a Pull Request!
</div>
