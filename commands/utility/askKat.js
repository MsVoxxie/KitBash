const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { default: OpenAI } = require('openai');

const OpenAIConfig = new OpenAI({ apiKey: process.env.OPENAI_KEY });
const AI = OpenAIConfig;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('askkat')
		.setDescription("Ask Me a question, I'll answer the best I can!")
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

		// Grab question and setup conversation starter
		const userQuestion = interaction.options.getString('question');
		const conversationStarter = [
			{ role: 'system', content: process.env.PERSONALITY },
			{ role: 'user', content: userQuestion },
		];

		// Generate response
		const aiResponse = await AI.chat.completions.create({
			model: 'gpt-4',
			messages: conversationStarter,
			max_tokens: 1000,
			temperature: 0.7,
			frequency_penalty: 0.3,
			presence_penalty: 0.9,
			n: 1,
		});

		let aiReply = aiResponse.choices[0].message?.content;

		await interaction.followUp({ content: aiReply, ephemeral: ephemeralToggle });
	},
};
