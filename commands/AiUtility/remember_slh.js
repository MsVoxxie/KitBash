const { SlashCommandBuilder, PermissionFlagsBits, codeBlock, EmbedBuilder, InteractionContextType, ApplicationIntegrationType } = require('discord.js');
const { upperFirst } = require('../../functions/helpers/stringFormatters');
const AiMemories = require('../../models/aiMemories');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('remember')
		.setDescription('Have kitbash remember something.')
		.setContexts([InteractionContextType.Guild, InteractionContextType.PrivateChannel])
		.setIntegrationTypes([ApplicationIntegrationType.UserInstall])
		.setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
		.addStringOption((option) =>
			option
				.setName('type')
				.setDescription('What type of memory is this?')
				.addChoices({ name: 'Date', value: 'date' }, { name: 'Remember', value: 'remember' }, { name: 'Birthday', value: 'birthday' }, { name: 'Task', value: 'task' })
				.setRequired(true)
		)
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
		const memoryType = interaction.options.getString('type');

		// Save the thought
		await AiMemories.findOneAndUpdate({}, { $push: { memories: { memoryType, memoryTopic: userTopic, memoryData: userThought } } }, { upsert: true });

		// Format description
		const description = codeBlock('yaml', `Type) ${upperFirst(memoryType)}\nTopic) ${userTopic}\nMemory) ${userThought}`);

		// Create embed
		const embed = new EmbedBuilder().setTitle('Memory Saved').setDescription(description).setColor(client.color).setTimestamp();

		// Send the response
		await interaction.editReply({ embeds: [embed] });
	},
};
