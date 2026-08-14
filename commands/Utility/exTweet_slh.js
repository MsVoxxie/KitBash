const { SlashCommandBuilder, AttachmentBuilder, InteractionContextType, ApplicationIntegrationType } = require('discord.js');
const { getTweetMediaFallback, pickBestDiscordMedia } = require('../../functions/fetch/tweetMediaFallback');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('extweet')
		.setDescription('Retrieve the raw media from a specified tweet!')
		.setContexts([InteractionContextType.Guild, InteractionContextType.PrivateChannel])
		.setIntegrationTypes([ApplicationIntegrationType.UserInstall])
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
		try {
			let media = [];

			try {
				const res = await twitFetch.tweet.details(twitId);
				if (res && Array.isArray(res.media) && res.media.length) {
					media = res.media.map((m) => m?.url).filter(Boolean);
				}
			} catch (e) {
				// Continue into fallback resolver.
			}

			if (!media.length) {
				const fallback = await getTweetMediaFallback(twitUser, twitId);
				media = fallback.media;
			}

			const bestMedia = pickBestDiscordMedia(media);
			if (bestMedia) media = [bestMedia];

			if (!media.length) {
				return interaction.followUp({ content: `Sorry, this tweet doesn't contain any media, or it couldn't be fetched right now.`, ephemeral: true });
			}

			const fileAttachments = [];
			for await (const mediaUrl of media) {
				if (!mediaUrl) continue;

				// Convert the attachment url to a file name
				const fileExt = mediaUrl.split('/').pop().split('?')[0].split('.')[1];
				const fileName = `kitbash_${twitUser}_${twitId}.${fileExt}`;

				// Push the attachment to the fileAttachments array
				fileAttachments.push(new AttachmentBuilder(mediaUrl, { name: fileName }));
			}

			if (!fileAttachments.length) {
				return interaction.followUp({ content: `Sorry, this tweet doesn't contain valid media URLs!`, ephemeral: true });
			}

			await interaction.followUp({ files: fileAttachments, ephemeral: ephemeralToggle });
		} catch (e) {
			console.log(`exTweet slash failed for ${twitUser}/${twitId}: ${e?.message || e}`);
			await interaction.followUp({ content: 'There was an error retrieving this tweet. It may be protected, unavailable, or rate-limited.', ephemeral: true });
		}
	},
};
