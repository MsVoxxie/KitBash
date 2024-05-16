const { AttachmentBuilder, SlashCommandBuilder, PermissionFlagsBits, codeBlock } = require('discord.js');
const { default: OpenAI } = require('openai');

const OpenAIConfig = new OpenAI({ apiKey: process.env.OPENAI_KEY });
const AI = OpenAIConfig;

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
		const conversationStarter = [
			{
				role: 'system',
				content:
					"You are to serve as a dictionary, you define words in a short and concise way. Don't ever ask for more context, You are a book. Format your replies such as the following: ## Word\\n- {definition}",
			},
			{ role: 'user', content: userQuestion },
		];

		// Generate response
		const aiResponse = await AI.chat.completions.create({
			model: process.env.AI_MODEL,
			messages: conversationStarter,
			max_tokens: 50,
			temperature: 0.7,
			frequency_penalty: 0.3,
			presence_penalty: 0.9,
			n: 1,
		});

		let aiReply = aiResponse.choices[0].message?.content;

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
