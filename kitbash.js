// Configuration File
const dotenv = require('dotenv');
dotenv.config();

// Discord Classes
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
require('events').EventEmitter.defaultMaxListeners = 16;

// Define Client
const client = new Client({
	intents: [
		// GatewayIntentBits.Guilds,
		// GatewayIntentBits.GuildInvites,
		// GatewayIntentBits.GuildMessages,
		// GatewayIntentBits.GuildMembers,
		// GatewayIntentBits.GuildPresences,
		// GatewayIntentBits.MessageContent,
		// GatewayIntentBits.GuildModeration,
		// GatewayIntentBits.GuildVoiceStates,
		// GatewayIntentBits.GuildMessageReactions,
		// GatewayIntentBits.GuildEmojisAndStickers,
	],
	// partials: [Partials.Message, Partials.Reaction, Partials.Channel],
	allowedMentions: {
		parse: ['users', 'roles'],
	},
});

// Define Collections
client.commands = new Collection();
client.events = new Collection();

// Run Loaders
require('./core/loaders/commandLoader')(client);
require('./core/loaders/eventLoader')(client);

client.login(process.env.DISCORD_TOKEN);
