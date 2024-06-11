const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');
const Pin = require('../../models/pinSchema');

module.exports = {
	data: new ContextMenuCommandBuilder().setName('[Remove Pin]').setType(ApplicationCommandType.Message),
	options: {
		devOnly: false,
		disabled: false,
	},
	async execute(client, interaction) {
		// Defer, Things take time.
		await interaction.deferReply({ ephemeral: true });

		// Definitions
		const message = interaction.targetMessage;

		// Check if the message is pinned
		const check = await Pin.findOne({ messageId: message.id });
		if (!check) return interaction.followUp({ content: `[This message is not pinned](<${message.url}>)` });

		// Remove the pin
		await Pin.findOneAndDelete({
			messageId: message.id,
		});

		// Respond
		interaction.followUp({ content: `[Message Removed from personal pins](<${message.url}>)` });
	},
};
