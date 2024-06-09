const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('extweet')
		.setDescription('Retrieve the raw media from a specified tweet!')
		.addStringOption((option) => option.setName('tweet_url').setDescription('twitter url').setRequired(true))
		.addBooleanOption((bool) => bool.setName('ephemeral').setDescription('Should this message be hidden? (Default True!)')),
	options: {
		devOnly: false,
		disabled: false,
	},
	async execute(client, interaction, settings) {
		// Twit
		const { Rettiwt } = require('rettiwt-api');
		const twitFetch = new Rettiwt({ apiKey: process.env.TWIT_TOKEN });

		const twitURL = interaction.options.getString('tweet_url');
		const twitRegex = /[a-zA-Z0-9_]{0,15}\/status\/(\d+)/s.exec(twitURL);
		if (!twitRegex) return interaction.reply({ content: 'This is an invalid twitter url or the tweet cannot be retrieved.', ephemeral: true });

		// Get the twit id and user
		const twitId = twitRegex[1];
		const twitUser = twitRegex[0].split('/')[0];

		// Ephem Check
		const ephCheck = interaction.options.getBoolean('ephemeral');
		const ephemeralToggle = ephCheck !== null ? ephCheck : false;
		await interaction.deferReply({ ephemeral: ephemeralToggle });

		// Fetch the tweet
		await twitFetch.tweet
			.details(twitId)
			.then(async (res) => {
				if (!res) return interaction.followUp({ content: 'There was an error retrieving this tweet.\nIt may be considered NSFW.', ephemeral: true });
				const fileAttachments = [];
				if (!res.media) return interaction.followUp({ content: `Sorry, this tweet doesn't contain any media!`, ephemeral: true });
				for await (const attach of res.media) {
					const attachment = attach;

					// Convert the attachment url to a file name
					const fileExt = attachment.url.split('/').pop().split('?')[0].split('.')[1];
					const fileName = `kitbash_${twitUser}_${twitId}.${fileExt}`;

					// Push the attachment to the fileAttachments array
					fileAttachments.push(new AttachmentBuilder(attachment.url, { name: fileName }));
				}
				await interaction.followUp({ files: fileAttachments.map((a) => a), ephemeral: ephemeralToggle });
			})
			.catch(async (e) => {
				console.log(e);
				await interaction.followUp({ content: 'An unknown error occurred.', ephemeral: true });
			});
	},
};
