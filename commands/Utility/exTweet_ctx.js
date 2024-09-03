const { ContextMenuCommandBuilder, ApplicationCommandType, AttachmentBuilder, InteractionContextType } = require('discord.js');

module.exports = {
	data: new ContextMenuCommandBuilder()
		.setName('exTweet')
		.setContexts([InteractionContextType.Guild, InteractionContextType.PrivateChannel])
		.setType(ApplicationCommandType.Message),
	options: {
		devOnly: false,
		disabled: false,
	},
	async execute(client, interaction, settings) {
		// Definitions
		const message = interaction.targetMessage;

		// Twit
		const { Rettiwt } = require('rettiwt-api');
		const twitFetch = new Rettiwt({ apiKey: process.env.TWIT_TOKEN });

		const twitURL = message.content;
		const twitRegex = /[a-zA-Z0-9_]{0,15}\/status\/(\d+)/s.exec(twitURL);
		if (!twitRegex) return interaction.reply({ content: 'This is an invalid twitter url or the tweet cannot be retrieved.', ephemeral: true });

		// Get the twit id and user
		const twitId = twitRegex[1];
		const twitUser = twitRegex[0].split('/')[0];

		// Defer, Things take time.
		await interaction.deferReply();

		// Fetch the tweet
		await twitFetch.tweet
			.details(twitId)
			.then(async (res) => {
				if (!res) return interaction.followUp({ content: 'There was an error retrieving this tweet.\nIt may be considered NSFW.' });
				const fileAttachments = [];
				if (!res.media) return interaction.followUp({ content: `Sorry, this tweet doesn't contain any media!` });
				for await (const attach of res.media) {
					const attachment = attach;

					// Convert the attachment url to a file name
					const fileExt = attachment.url.split('/').pop().split('?')[0].split('.')[1];
					const fileName = `kitbash_${twitUser}_${twitId}.${fileExt}`;

					// Push the attachment to the fileAttachments array
					fileAttachments.push(new AttachmentBuilder(attachment.url, { name: fileName }));
				}
				await interaction.followUp({ files: fileAttachments.map((a) => a) });
			})
			.catch(async (e) => {
				console.log(e);
				await interaction.followUp({ content: 'An unknown error occurred.' });
			});
	},
};
