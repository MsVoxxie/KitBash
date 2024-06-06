const { SlashCommandBuilder, PermissionFlagsBits, codeBlock } = require('discord.js');
const AiThoughts = require('../../models/aiThoughts');

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
		await AiThoughts.findOneAndUpdate({}, { $push: { thoughts: { topic: userTopic, thought: userThought } } }, { upsert: true });

		// Send the response
		await interaction.followUp({ content: `I have remembered that **${userThought}** is about **${userTopic}**.` });
	},
};
