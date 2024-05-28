const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, blockQuote, codeBlock } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder().setName('ytdl').setDescription('Download a video from youtube').setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),
	options: {
		devOnly: false,
		disabled: false,
	},
	async execute(client, interaction) {},
};
