const { SlashCommandBuilder, PermissionFlagsBits, codeBlock } = require('discord.js');
const AiMemories = require('../../models/aiMemories');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('remember')
		.setDescription('Have kitbash remember something.')
		.setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
		.addStringOption((option) => option.setName('topic').setDescription('What are we remembering?').setRequired(true))
		.addStringOption((option) => option.setName('thought').setDescription('What are we remembering about this topic?').setRequired(true)),
	options: {
		devOnly: false,
		disabled: false,
	},
	async execute(client, interaction) {
		// Defer, Things take time.
		await interaction.deferReply({ ephemeral: true });

		// Definitions
		let userTopic = interaction.options.getString('topic');
		let userThought = interaction.options.getString('thought');

		// Save the thought
		await AiMemories.findOneAndUpdate({}, { $push: { memories: { topic: userTopic, thought: userThought } } }, { upsert: true });

		// Send the response
		await interaction.followUp({ content: `I have remembered that **${userTopic}** is **${userThought}**` });
	},
};
