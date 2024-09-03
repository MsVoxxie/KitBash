const { ContextMenuCommandBuilder, ApplicationCommandType, InteractionContextType, ApplicationIntegrationType } = require('discord.js');
const getMedia = require('../../functions/helpers/fetchMedia');
const Pin = require('../../models/pinSchema');

module.exports = {
	data: new ContextMenuCommandBuilder()
		.setName('[Create Pin]')
		.setContexts([InteractionContextType.Guild, InteractionContextType.PrivateChannel])
		.setIntegrationTypes([ApplicationIntegrationType.UserInstall])
		.setType(ApplicationCommandType.Message),
	options: {
		devOnly: false,
		disabled: false,
	},
	async execute(client, interaction) {
		// Defer, Things take time.
		await interaction.deferReply({ ephemeral: true });

		// Definitions
		const message = interaction.targetMessage;

		// Check if the message is already pinned.
		const check = await Pin.findOne({ messageId: message.id });
		if (check) return interaction.followUp({ content: `[This message is already pinned](<${message.url}>)` });

		// Get the total pin count
		const totalPins = await Pin.countDocuments({});

		// Check for media of some kind
		const { content, media } = await getMedia(message);

		// Create the pin.
		const pin = new Pin({
			pinnedBy: interaction.user.id,
			pinnedIn: interaction.guildId ? 'Guild' : 'Direct Messages',
			authorId: message.author.id,
			channelId: interaction.channelId,
			messageId: message.id,
			messageContent: content || 'No content',
			messageMedia: media,
			directLink: message.url,
			pinPosition: totalPins + 1,
		});

		await pin.save();

		// Respond with total pin count
		interaction.followUp({ content: `**${totalPins + 1}** | [Message Saved to personal pins](<${message.url}>)` });
	},
};
