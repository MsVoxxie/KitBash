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
		await interaction.deferReply();

		// Definitions
		const message = interaction.targetMessage;

		// Define the ai personality, dumb them down a bit.
		const aiPersonality = [
			'You are to convert units for users.',
			'Any currency conversions should be converted to USD.',
			'You convert units from one to another without further questions.',
			'Format your replies such as the following: ## Conversions\\n- {fromunit → tounit}',
			'If there aren\'t any conversions, reply with "No conversions found."',
		].join(' ');
		// Generate response
		const aiReply = await askKitbash('gpt-4o', aiPersonality, message.content, 500);

		// Send the response
		await interaction.followUp({ content: `${aiReply}` });
	},
};
