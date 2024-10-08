const { SlashCommandBuilder, PermissionFlagsBits, InteractionContextType, ApplicationIntegrationType } = require('discord.js');
const { askKitbash } = require('../../functions/helpers/aiRequest');
const AiMemories = require('../../models/aiMemories');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('countdown')
		.setDescription('How long until a certain date?')
		.setContexts([InteractionContextType.Guild, InteractionContextType.PrivateChannel])
		.setIntegrationTypes([ApplicationIntegrationType.UserInstall])
		.setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
		.addStringOption((str) => str.setName('date').setDescription('Which date are we checking?').setRequired(true)),
	options: {
		devOnly: false,
		disabled: false,
	},
	async execute(client, interaction) {
		// Defer, Things take time.
		await interaction.deferReply();

		// Current date
		const currentDate = new Date();

		// Definitions
		let userQuestion = interaction.options.getString('date');

		// Prepare AI personality
		let aiPersonality = [
			`It's currently ${currentDate.toDateString()}.`,
			'You are to serve as a countdown clock.',
			'You do not need to ask for more context, you are a clock.',
			'Keep your responses short and to the point but keep any relevant information in mind.',
			'You are to calculate the time until a certain date.',
			'Format your replies using two ** on each side of any relevant information.',
			'Format your response as follows: **{date}** is in **{time until date}**.',
			'Include the requested date and the name of what is being requested in your response.',
		].join(' ');

		// Check if the user is asking for a date that has been remembered
		const rememberedThoughts = await AiMemories.findOne({ 'memories.memoryType': 'date' });
		const rememberedThought = rememberedThoughts.memories.find((memory) => memory.memoryTopic.toLowerCase().includes(userQuestion.toLowerCase()));
		if (rememberedThought) aiPersonality += ` I remember that **${rememberedThought.memoryTopic}** is about **${rememberedThought.memoryData}**.`;

		// Make the first letter of each word uppercase
		const capitalizeFirstLetter = (string) => {
			return string.charAt(0).toUpperCase() + string.slice(1);
		};
		userQuestion = userQuestion.split(' ').map(capitalizeFirstLetter).join(' ');

		// Generate response
		const aiReply = await askKitbash('gpt-4o', aiPersonality, userQuestion, 150);

		// Send the response
		await interaction.followUp({ content: `${aiReply}` });
	},
};
