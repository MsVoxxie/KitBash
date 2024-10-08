const { ContextMenuCommandBuilder, ApplicationCommandType, EmbedBuilder, InteractionContextType, ApplicationIntegrationType } = require('discord.js');

const SauceNAO = require('sagiri');
const sauceNAO = SauceNAO(process.env.SAUCENAO);

module.exports = {
	data: new ContextMenuCommandBuilder()
		.setName('Search SauceNao')
		.setContexts([InteractionContextType.Guild, InteractionContextType.PrivateChannel])
		.setIntegrationTypes([ApplicationIntegrationType.UserInstall])
		.setType(ApplicationCommandType.Message),
	options: {
		devOnly: false,
		disabled: false,
	},
	async execute(client, interaction, settings) {
		// Definitions
		const message = interaction.targetMessage;

		// Check for media of some kind
		let attachedMedia = null;

		// Attachment
		if (message.embeds.length)
			attachedMedia = message.embeds[0].data.thumbnail
				? message.embeds[0].data.thumbnail.url
				: message.embeds[0].data.image.url
				? message.embeds[0].data.image.url
				: message.embeds[0].data.url;
		if (message.attachments.size) attachedMedia = message.attachments.first().url;

		// Check if this message contains any images.
		if (!attachedMedia) return interaction.reply({ content: `[This message does not contain any images.](${message.url})`, ephemeral: true });

		// Grab the first image.
		const searchImage = attachedMedia;

		// Defer, Things take time.
		await interaction.deferReply();

		// Search for it.
		try {
			const fetchedResults = await sauceNAO(searchImage, { results: 5 });
			const resultData = fetchedResults[0];
			const rawData = resultData.raw.data;

			let compiledData = {
				thumbnail: resultData.thumbnail,
				similarity: resultData.similarity,
				material: rawData.material || null,
				characters: rawData.characters || null,
				creator: rawData.creator || rawData.member_name || rawData.user_name || rawData.author_name || 'Unknown',
				creator_id: rawData.member_id || rawData.user_id || null,
				creator_url: rawData.author_url || null,
				title: rawData.title || null,
				e621_id: rawData.e621_id || null,
				fa_id: rawData.fa_id || null,
				pixiv_id: rawData.pixiv_id || null,
				kemono_id: rawData.id || null,
				danbooru_id: rawData.danbooru_id || null,
				gelbooru_id: rawData.gelbooru_id || null,
				source: resultData.url || null,
				ext_urls: rawData.ext_urls || null,
			};

			// Threshhold
			if (resultData.similarity < 70) {
				// Build Embed
				const embed = new EmbedBuilder()
					.setTitle(`**SauceNAO (${resultData.similarity}% Match)**`)
					.setDescription(`[No high similarity results...](${message.url})`)
					.setThumbnail(searchImage)
					.setColor(client.color);

				return interaction.followUp({ embeds: [embed] });
			}

			// Build Embed
			const embed = new EmbedBuilder()
				.setTitle(`**SauceNAO (${compiledData.similarity}% Match)**`)
				.setDescription(`Original Discord message can be found [Here](${message.url})`)
				.addFields({ name: 'Ext Urls', value: compiledData.ext_urls.map((u) => u).join('\n') })
				.setThumbnail(compiledData.thumbnail)
				.setColor(client.color)
				.setTimestamp();

			// Title
			if (compiledData.title) embed.addFields({ name: 'Title', value: `${compiledData.title}`, inline: true });

			// IDs
			if (compiledData.danbooru_id) embed.addFields({ name: 'Danbooru ID', value: `${compiledData.danbooru_id}`, inline: true });
			if (compiledData.gelbooru_id) embed.addFields({ name: 'Gelbooru ID', value: `${compiledData.gelbooru_id}`, inline: true });
			if (compiledData.kemono_id) embed.addFields({ name: 'Kemono ID', value: `${compiledData.kemono_id}`, inline: true });
			if (compiledData.e621_id) embed.addFields({ name: 'E621 ID', value: `${compiledData.e621_id}`, inline: true });
			if (compiledData.fa_id) embed.addFields({ name: 'FA ID', value: `${compiledData.fa_id}`, inline: true });

			// Creator
			if (compiledData.creator) embed.addFields({ name: 'Creator', value: `${compiledData.creator}`, inline: true });
			if (compiledData.creator_id) embed.addFields({ name: 'Creator ID', value: `${compiledData.creator_id}`, inline: true });
			if (compiledData.creator_url) embed.addFields({ name: 'Creator Url', value: `${compiledData.creator_url}`, inline: true });

			// Characters
			if (compiledData.material) embed.addFields({ name: 'Material', value: `${compiledData.material}`, inline: true });
			if (compiledData.characters) embed.addFields({ name: 'Characters', value: `${compiledData.characters}`, inline: true });

			// Source
			if (compiledData.source) embed.addFields({ name: 'Source', value: `${compiledData.source}`, inline: false });

			// Send the embed
			interaction.followUp({ embeds: [embed] });
		} catch (error) {
			console.log(error);
			const embed = new EmbedBuilder()
				.setTitle(`**SauceNAO Error**`)
				.setDescription(`[An error occurred. Please try again.](${message.url})`)
				.setColor(client.color)
				.setTimestamp();
			return interaction.followUp({ embeds: [embed] });
		}
	},
};
