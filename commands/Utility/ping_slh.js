const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, blockQuote, codeBlock, InteractionContextType, ApplicationIntegrationType } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!')
		.setContexts([InteractionContextType.Guild, InteractionContextType.PrivateChannel])
		.setIntegrationTypes([ApplicationIntegrationType.UserInstall])
		.setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),
	options: {
		devOnly: false,
		disabled: false,
	},
	async execute(client, interaction) {
		// Defer, Things take time.
		await interaction.deferReply();

		// Definitions
		const websocketPing = `${Math.round(client.ws.ping)}ms`;
		const discordPing = `${Date.now() - interaction.createdTimestamp}ms`;

		// Embed
		const embed = new EmbedBuilder()
			.setColor(client.color)
			.addFields(
				{ name: `<:discord_white:1338246462672211998> Websocket`, value: blockQuote(codeBlock(websocketPing)), inline: true },
				{ name: '<:connection_excellent:1338246446641578024> Host<>Discord', value: blockQuote(codeBlock(discordPing)), inline: true }
			)
			.setTimestamp();

		await interaction.followUp({ embeds: [embed] });
	},
};
