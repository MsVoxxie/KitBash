const { AttachmentBuilder, SlashCommandBuilder, PermissionFlagsBits, codeBlock } = require('discord.js');
const { askKitbash } = require('../../functions/helpers/aiRequest');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('describe')
		.setDescription("Describe a word using OpenAI's GPT-4 Turbo!")
		.setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
		.addStringOption((str) => str.setName('description').setDescription('What are you defining?').setRequired(true)),
	options: {
		devOnly: false,
		disabled: false,
	},
	async execute(client, interaction) {
		// Defer, Things take time.
		await interaction.deferReply();

		// Grab question and setup conversation starter
		const userQuestion = interaction.options.getString('description');
		const aiPersonality = [
			'You are to serve as a dictionary',
			'You define words in a short and concise way',
			"Don't ever ask for more context, You are a book",
			'Format your replies such as the following: ## Word\\n- {definition}"',
		].join(' ');

		// Generate response
		const aiReply = await askKitbash('gpt-4o', aiPersonality, userQuestion, 100);

		if (aiReply.length > 2000) {
			// If the reply length is over 2000 characters, send a txt file.
			const buffer = Buffer.from(aiReply, 'utf8');
			const txtFile = new AttachmentBuilder(buffer, { name: `${interaction.user.displayName}_response.txt` });

			interaction.followUp({ files: [txtFile] });
		} else {
			await interaction.followUp({ content: `${aiReply}` });
		}
	},
};
