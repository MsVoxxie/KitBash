const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('extweet')
		.setDescription('Retrieve the raw media from a specified tweet!')
		.addStringOption((option) => option.setName('tweet_url').setDescription('twitter url').setRequired(true)),
	options: {
		devOnly: false,
		disabled: false,
	},
	async execute(client, interaction, settings) {
		const { Rettiwt } = require('rettiwt-api');
		const twitFetch = new Rettiwt({ apiKey: process.env.TWIT_TOKEN });

		await interaction.deferReply();
		const twitURL = interaction.options.getString('tweet_url');
		const twitId = /\/status\/(\d+)/s.exec(twitURL);

		if (!twitId) return interaction.followUp('This is an invalid url or the tweet cannot be retrieved!');

		await twitFetch.tweet
			.details(twitId[1])
			.then(async (res) => {
				if (!res) return interaction.followUp({ content: 'There was an error retrieving this tweet.\nIt may be considered NSFW.', ephemeral: true });
				const fileAttachments = [];
				if (!res.media) return interaction.followUp({ content: `Sorry, this tweet doesn't contain any media!`, ephemeral: true });
				for await (const attach of res.media) {
					const attachment = attach;
					fileAttachments.push(new AttachmentBuilder(attachment.url));
				}
				await interaction.followUp({ files: fileAttachments.map((a) => a) });
			})
			.catch(async (e) => {
				console.log(e);
				await interaction.followUp({ content: 'An unknown error occurred.', ephemeral: true });
			});
	},
};
