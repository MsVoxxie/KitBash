const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, blockQuote, codeBlock, InteractionContextType } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!')
		.setContexts([InteractionContextType.Guild, InteractionContextType.PrivateChannel])
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
				{ name: `<:discord_white:1229370575294566431> Websocket`, value: blockQuote(codeBlock(websocketPing)), inline: true },
				{ name: '<:theconnectionisgood:1229370579102994472> Host<>Discord', value: blockQuote(codeBlock(discordPing)), inline: true }
			)
			.setTimestamp();

		await interaction.followUp({ embeds: [embed] });
	},
};
