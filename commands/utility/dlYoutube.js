const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, blockQuote, codeBlock } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder().setName('ytdl').setDescription('Download a video from youtube').setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),
	integration_types: [0, 1, 2],
	options: {
		devOnly: false,
		disabled: false,
	},
	async execute(client, interaction) {},
};
