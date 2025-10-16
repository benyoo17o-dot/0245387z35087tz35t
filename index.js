// npm install discord.js express cors body-parser

const { Client, GatewayIntentBits, REST, Routes, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require(‘discord.js’);
const express = require(‘express’);
const cors = require(‘cors’);
const bodyParser = require(‘body-parser’);

// ==================== KONFIGURATION ====================
const CONFIG = {
DISCORD_TOKEN: ‘MTQyODEyNzk4MTgyOTc1MDgwNQ.G7oi_m.la4k2uq5al2Z96cW_yUI64UpY7xHoTm-89s5B4’, // Ersetze mit deinem Token
DASHBOARD_PORT: 5000,
BOT_NAME: ‘Rekii’,
PREFIX: ‘!’,
};

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ==================== DISCORD BOT ====================
const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent,
GatewayIntentBits.DirectMessages,
],
});

let botConfig = {
status: ‘online’,
statusMessage: ‘🎮 Rekii Bot Active’,
moderation: {
automod: true,
antiSpam: true,
antiRaid: true,
logChannel: ‘#mod-logs’,
muteRole: ‘@Muted’
}
};

// Bot Ready
client.once(‘ready’, () => {
console.log(`✅ Rekii Bot eingeloggt als ${client.user.tag}`);
updateBotStatus();
registerCommands();
});

// Update Bot Status
function updateBotStatus() {
client.user.setPresence({
activities: [{ name: botConfig.statusMessage, type: 2 }],
status: botConfig.status
});
}

// Commands registrieren
function registerCommands() {
const commands = [
{
name: ‘ping’,
description: ‘Zeigt den Bot Ping’,
},
{
name: ‘embed’,
description: ‘Sendet ein Custom Embed’,
options: [
{
name: ‘titel’,
type: 3,
description: ‘Titel des Embeds’,
required: true,
},
{
name: ‘beschreibung’,
type: 3,
description: ‘Beschreibung des Embeds’,
required: true,
},
],
},
{
name: ‘kick’,
description: ‘Kickt einen Nutzer’,
options: [
{
name: ‘nutzer’,
type: 6,
description: ‘Der zu kickende Nutzer’,
required: true,
},
{
name: ‘grund’,
type: 3,
description: ‘Grund für den Kick’,
required: false,
},
],
},
{
name: ‘ban’,
description: ‘Bannt einen Nutzer’,
options: [
{
name: ‘nutzer’,
type: 6,
description: ‘Der zu bannende Nutzer’,
required: true,
},
{
name: ‘grund’,
type: 3,
description: ‘Grund für den Ban’,
required: false,
},
],
},
{
name: ‘mute’,
description: ‘Muted einen Nutzer’,
options: [
{
name: ‘nutzer’,
type: 6,
description: ‘Der zu mutende Nutzer’,
required: true,
},
{
name: ‘dauer’,
type: 4,
description: ‘Dauer in Minuten’,
required: false,
},
],
},
{
name: ‘unlock’,
description: ‘Entsperrt einen Channel’,
},
{
name: ‘lock’,
description: ‘Sperrt einen Channel’,
},
{
name: ‘clear’,
description: ‘Löscht Nachrichten’,
options: [
{
name: ‘anzahl’,
type: 4,
description: ‘Anzahl der Nachrichten zum Löschen’,
required: true,
},
],
},
];

const rest = new REST({ version: ‘10’ }).setToken(CONFIG.DISCORD_TOKEN);

(async () => {
try {
await rest.put(
Routes.applicationCommands(client.user.id),
{ body: commands },
);
console.log(‘✅ Slash Commands registriert’);
} catch (error) {
console.error(‘Fehler beim Registrieren der Commands:’, error);
}
})();
}
client.on(‘interactionCreate’, async (interaction) => {
if (!interaction.isChatInputCommand()) return;

const { commandName, options } = interaction;

try {
if (commandName === ‘ping’) {
await interaction.reply(`🏓 Pong! ${client.ws.ping}ms`);
}

```
if (commandName === 'embed') {
  const titel = options.getString('titel');
  const beschreibung = options.getString('beschreibung');

  const embed = new EmbedBuilder()
    .setTitle(titel)
    .setDescription(beschreibung)
    .setColor('#808080')
    .setFooter({ text: 'Rekii Bot' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

if (commandName === 'kick') {
  if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
    return interaction.reply({ content: '❌ Du hast keine Berechtigung!', ephemeral: true });
  }

  const user = options.getUser('nutzer');
  const grund = options.getString('grund') || 'Kein Grund angegeben';

  try {
    await interaction.guild.members.kick(user, grund);
    const kickEmbed = new EmbedBuilder()
      .setTitle('👢 Nutzer gekickt')
      .setDescription(`${user.tag} wurde gekickt\n**Grund:** ${grund}`)
      .setColor('#808080')
      .setFooter({ text: 'Rekii Moderation' });
    await interaction.reply({ embeds: [kickEmbed] });
  } catch (error) {
    await interaction.reply({ content: '❌ Konnte den Nutzer nicht kicken!', ephemeral: true });
  }
}

if (commandName === 'ban') {
  if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
    return interaction.reply({ content: '❌ Du hast keine Berechtigung!', ephemeral: true });
  }

  const user = options.getUser('nutzer');
  const grund = options.getString('grund') || 'Kein Grund angegeben';

  try {
    await interaction.guild.bans.create(user, { reason: grund });
    const banEmbed = new EmbedBuilder()
      .setTitle('🔨 Nutzer gebannt')
      .setDescription(`${user.tag} wurde gebannt\n**Grund:** ${grund}`)
      .setColor('#000000')
      .setFooter({ text: 'Rekii Moderation' });
    await interaction.reply({ embeds: [banEmbed] });
  } catch (error) {
    await interaction.reply({ content: '❌ Konnte den Nutzer nicht bannen!', ephemeral: true });
  }
}

if (commandName === 'mute') {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
    return interaction.reply({ content: '❌ Du hast keine Berechtigung!', ephemeral: true });
  }

  const user = options.getUser('nutzer');
  const dauer = (options.getInteger('dauer') || 10) * 60 * 1000;

  try {
    const member = await interaction.guild.members.fetch(user.id);
    await member.timeout(dauer);
    const muteEmbed = new EmbedBuilder()
      .setTitle('🔇 Nutzer gemutet')
      .setDescription(`${user.tag} wurde gemutet\n**Dauer:** ${dauer / 60000} Minuten`)
      .setColor('#808080')
      .setFooter({ text: 'Rekii Moderation' });
    await interaction.reply({ embeds: [muteEmbed] });
  } catch (error) {
    await interaction.reply({ content: '❌ Konnte den Nutzer nicht muten!', ephemeral: true });
  }
}

if (commandName === 'lock') {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
    return interaction.reply({ content: '❌ Du hast keine Berechtigung!', ephemeral: true });
  }

  try {
    await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      SendMessages: false,
    });
    await interaction.reply('🔒 Channel gesperrt');
  } catch (error) {
    await interaction.reply({ content: '❌ Konnte Channel nicht sperren!', ephemeral: true });
  }
}

if (commandName === 'unlock') {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
    return interaction.reply({ content: '❌ Du hast keine Berechtigung!', ephemeral: true });
  }

  try {
    await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      SendMessages: true,
    });
    await interaction.reply('🔓 Channel entsperrt');
  } catch (error) {
    await interaction.reply({ content: '❌ Konnte Channel nicht entsperren!', ephemeral: true });
  }
}

if (commandName === 'clear') {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
    return interaction.reply({ content: '❌ Du hast keine Berechtigung!', ephemeral: true });
  }

  const anzahl = options.getInteger('anzahl');

  if (anzahl > 100) {
    return interaction.reply({ content: '❌ Maximal 100 Nachrichten!', ephemeral: true });
  }

  try {
    await interaction.channel.bulkDelete(anzahl);
    await interaction.reply({ content: `✅ ${anzahl} Nachrichten gelöscht`, ephemeral: true });
  } catch (error) {
    await interaction.reply({ content: '❌ Konnte Nachrichten nicht löschen!', ephemeral: true });
  }
}
```

} catch (error) {
console.error(error);
await interaction.reply({ content: ‘❌ Ein Fehler ist aufgetreten!’, ephemeral: true });
}
});

// ==================== EXPRESS DASHBOARD API ====================

// Bot Config abrufen
app.get(’/api/config’, (req, res) => {
res.json(botConfig);
});

// Bot Config aktualisieren
app.post(’/api/config/status’, (req, res) => {
const { status, message } = req.body;
botConfig.status = status || botConfig.status;
botConfig.statusMessage = message || botConfig.statusMessage;
updateBotStatus();
res.json({ success: true, config: botConfig });
});

// Moderation Settings aktualisieren
app.post(’/api/config/moderation’, (req, res) => {
botConfig.moderation = { …botConfig.moderation, …req.body };
res.json({ success: true, config: botConfig });
});

// Bot Statistiken
app.get(’/api/stats’, (req, res) => {
const guilds = client.guilds.cache.size;
const users = client.users.cache.size;

res.json({
botName: ‘Rekii’,
status: botConfig.status,
statusMessage: botConfig.statusMessage,
guilds,
users,
ping: client.ws.ping,
version: ‘2.0.0’,
uptime: client.uptime,
});
});

// Login mit einfacher Authentifizierung
const VALID_USERS = {
‘admin’: ‘rekii123’,
‘owner’: ‘owner2025’
};

app.post(’/api/login’, (req, res) => {
const { username, password } = req.body;

if (VALID_USERS[username] === password) {
res.json({
success: true,
token: Buffer.from(`${username}:${password}`).toString(‘base64’),
user: username
});
} else {
res.status(401).json({ success: false, message: ‘Ungültige Anmeldedaten’ });
}
});

// Middleware für Token Authentifizierung
function authMiddleware(req, res, next) {
const token = req.headers.authorization?.split(’ ’)[1];

if (!token) {
return res.status(401).json({ message: ‘Keine Authentifizierung’ });
}

try {
const decoded = Buffer.from(token, ‘base64’).toString(‘utf-8’);
const [username, password] = decoded.split(’:’);

```
if (VALID_USERS[username] === password) {
  req.user = username;
  next();
} else {
  res.status(401).json({ message: 'Ungültiger Token' });
}
```

} catch {
res.status(401).json({ message: ‘Ungültiger Token’ });
}
}

// Geschützte Routes
app.get(’/api/protected’, authMiddleware, (req, res) => {
res.json({ message: `Willkommen ${req.user}!`, data: botConfig });
});

// Discord Bot starten
client.login(CONFIG.DISCORD_TOKEN);

// Express Server starten
const PORT = CONFIG.DASHBOARD_PORT;
app.listen(PORT, () => {
console.log(`🚀 Dashboard API läuft auf http://localhost:${PORT}`);
});

// Bot bei Fehler neustarten
process.on(‘unhandledRejection’, error => {
console.error(‘Unbehandelter Promise Rejection:’, error);
});
