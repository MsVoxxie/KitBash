const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');
const getMedia = require('../../functions/helpers/fetchMedia');
const Pin = require('../../models/pinSchema');

module.exports = {
	data: new ContextMenuCommandBuilder().setName('Create Pin').setType(ApplicationCommandType.Message),
	options: {
		devOnly: false,
		disabled: false,
	},
	async execute(client, interaction) {
		// Defer, Things take time.
		await interaction.deferReply();

		// Definitions
		const message = interaction.targetMessage;

		// Check if the message is already pinned.
		const check = await Pin.findOne({ messageId: message.id });
		if (check) return interaction.followUp({ content: `[This message is already pinned](<${message.url}>)` });

		// Check for media of some kind
		const media = await getMedia(message);

		// Create the pin.
		const pin = new Pin({
			messageId: message.id,
			authorId: message.author.id,
			content: message.content || 'No content',
			media: media,
		});
		await pin.save();

		// Get the total pin count
		const totalPins = await Pin.countDocuments({});

		// Respond with total pin count
		interaction.followUp({ content: `**${totalPins}** | [Message Saved to personal pins](<${message.url}>)` });
	},
};
