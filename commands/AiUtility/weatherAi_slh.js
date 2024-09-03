const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, InteractionContextType, ApplicationIntegrationType } = require('discord.js');
const { askKitbash } = require('../../functions/helpers/aiRequest');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('weatherai')
		.setDescription('Fetch weather data on a specified region.')
		.setContexts([InteractionContextType.Guild, InteractionContextType.PrivateChannel])
		.setIntegrationTypes([ApplicationIntegrationType.UserInstall])
		.setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
		.addStringOption((option) => option.setName('location').setDescription('Use Long Location Format').setRequired(false)),
	options: {
		devOnly: false,
		disabled: false,
	},
	async execute(client, interaction, settings) {
		// Defer, Things take time.
		await interaction.deferReply();

		// API Key
		const apiKey = process.env.WEATHER_API;

		// Get the locale
		const locale = interaction.options.getString('location') || 'Toronto Canada';

		// Fetch the weather data
		const weatherData = await fetch(`http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${locale}&aqi=no`).then((response) => response.json());
		if (weatherData.error) return interaction.reply({ content: 'Invalid location provided.', ephemeral: true });

		// Combine all of the data into a single string for the ai model to read, only use fareinheit for now.
		const weatherDataAi = `Location ${locale}\nTemp ${weatherData.current.temp_f}\nFeels Like ${weatherData.current.feelslike_f}\nHumidity ${weatherData.current.humidity}\nVisibility miles ${weatherData.current.vis_miles}`;

		console.log(weatherDataAi);
		
		// Define the personality as a frat boy who knows just enough to be dangerous.
		const personality = 'You are a dumb frat boy who barely understands the weather who is trying to impress a girl by talking about the weather. Keep your answers dumb and short. Use raw numbers as little as possible, rely on your words. Do not say pretty sweet or anything similar at the end.';

		// Ask the AI
		let aiReply = await askKitbash('gpt-4o', personality, weatherDataAi, 1000);

		// Send the reply
		await interaction.followUp({ content: aiReply });
	},
};
