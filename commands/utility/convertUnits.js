const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');
const { askKitbash } = require('../../functions/helpers/aiRequest');

module.exports = {
	data: new ContextMenuCommandBuilder().setName('Convert Units').setType(ApplicationCommandType.Message),
	options: {
		devOnly: false,
		disabled: false,
	},
	async execute(client, interaction, settings) {
		// Defer, Things take time.
		await interaction.deferReply({ ephemeral: true });

		// Definitions
		const message = interaction.targetMessage;

		// Define the ai personality, dumb them down a bit.
		const aiPersonality = 'You are to convert units for users. you can convert units from one to another. Format your replies such as the following: ## Conversions\\n- {conversion}';

		// Generate response
		const aiReply = await askKitbash('gpt-4o', aiPersonality, message.content, 100);

        // Send the response
		await interaction.followUp({ content: `${aiReply}`, ephemeral: true });
	},
};
