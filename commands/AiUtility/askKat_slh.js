const { AttachmentBuilder, SlashCommandBuilder, PermissionFlagsBits, codeBlock, InteractionContextType, ApplicationIntegrationType } = require('discord.js');
const { askKitbash } = require('../../functions/helpers/aiRequest');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('askkat')
		.setDescription("Ask Me a question, I'll answer the best I can!")
		.setContexts([InteractionContextType.Guild, InteractionContextType.PrivateChannel])
		.setIntegrationTypes([ApplicationIntegrationType.UserInstall])
		.setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
		.addStringOption((str) => str.setName('question').setDescription('What to ask Kat?').setRequired(true))
		.addBooleanOption((bool) => bool.setName('ephemeral').setDescription('Should this message be hidden? (Default True!)')),
	options: {
		devOnly: false,
		disabled: false,
	},
	async execute(client, interaction) {
		// Ephem Check
		const ephCheck = interaction.options.getBoolean('ephemeral');
		const ephemeralToggle = ephCheck !== null ? ephCheck : true;

		// Defer, Things take time.
		await interaction.deferReply({ ephemeral: ephemeralToggle });

		// Grab question
		const userQuestion = interaction.options.getString('question');

		// Ask Kat
		let aiReply = await askKitbash('gpt-4o', process.env.PERSONALITY, userQuestion, 1000);

		if (aiReply.length > 2000) {
			// If the reply length is over 2000 characters, send a txt file.
			const buffer = Buffer.from(aiReply, 'utf8');
			const txtFile = new AttachmentBuilder(buffer, { name: `${interaction.user.displayName}_response.txt` });

			interaction.followUp({ files: [txtFile], ephemeral: ephemeralToggle });
		} else {
			await interaction.followUp({ content: `${codeBlock(`Q: ${userQuestion}`)}\n${aiReply}`, ephemeral: ephemeralToggle });
		}
	},
};
