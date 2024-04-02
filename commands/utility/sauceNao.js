const { ContextMenuCommandBuilder, ApplicationCommandType, EmbedBuilder } = require('discord.js');

const SauceNAO = require('sagiri');
const sauceNAO = SauceNAO(process.env.SAUCENAO);

module.exports = {
	data: new ContextMenuCommandBuilder().setName('Find Sauce Nao').setType(ApplicationCommandType.Message),
	options: {
		devOnly: false,
		disabled: false,
	},
	async execute(client, interaction, settings) {
		// Defer, Things take time.
		await interaction.deferReply();

		// Definitions
		const message = interaction.targetMessage;

		// Check for media of some kind
		let attachedMedia = null;

		// Attachment
		if (message.attachments.size) attachedMedia = message.attachments.first().url;
		if (message.embeds.length) attachedMedia = message.embeds[0].data.thumbnail ? message.embeds[0].data.thumbnail.url : message.embeds[0].data.url;

		// Check if this message contains any images.
		if (!attachedMedia) return interaction.followUp({ content: `[This message does not contain any images.](${message.url})`, ephemeral: true });

		// Grab the first image.
		const searchImage = attachedMedia;

		// Search for it.
		const fetchedResults = await sauceNAO(searchImage, { results: 5 });
		const firstResult = fetchedResults[0];

		if (firstResult.similarity < 60) return interaction.followUp({ content: `[No high similarity results...](${message.url})`, ephemeral: true })

		// Build Embed
		const embed = new EmbedBuilder()
			.setURL(`${firstResult.authorUrl ? firstResult.authorUrl : firstResult.url}`)
            .setTitle('**SauceNAO**')
			.setDescription(`I Believe I've found it!\nThe artist is: ${firstResult.authorName ? `[${firstResult.authorName}](${firstResult.authorUrl})` : `[Unable to find Artist...](${firstResult.url})`}\nThe Source is: [${firstResult.site}](${firstResult.url})\n[Sourced Image](${message.url})`)
			.setThumbnail(firstResult.thumbnail);

		interaction.followUp({ embeds: [embed] });
	},
};
