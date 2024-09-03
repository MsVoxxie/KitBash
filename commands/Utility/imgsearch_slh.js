const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionContextType } = require('discord.js');
const { serpapiImageSearch } = require('../../functions/fetch/webSearch');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('isearch')
		.setDescription('Search google images for a query.')
		.setContexts([InteractionContextType.Guild, InteractionContextType.PrivateChannel])
		.setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
		.addStringOption((option) => option.setName('query').setDescription('The query to search for').setRequired(true)),
	options: {
		devOnly: false,
		disabled: false,
	},
	async execute(client, interaction) {
		// Defer, Things take time.
		await interaction.deferReply();

		// Definitions
		const query = interaction.options.getString('query');

		// Search
		const results = await serpapiImageSearch(query);
		if (!results.length) return interaction.followUp('No results found.');

		// Build Embeds
		const embeds = [];
		for (const result of results) {
			// Format the result data for the embed description
			const description = [
				`**Query)** ${query}`,
				`**URL)** [Link](${result.link})`,
				`**Source)** ${result.source}`,
				`**Thumbnail)** [Link](${result.original})`,
				`**Dimensions)** ${result.original_width}x${result.original_height}`,
			].join('\n');

			const embed = new EmbedBuilder()
				.setTitle(`Result ${results.indexOf(result) + 1}/${results.length}`)
				.setDescription(description)
				.setImage(result.original)
				.setColor(client.color)
				.setFooter({ text: `Powered by Serpapi` })
				.setTimestamp();
			embeds.push(embed);
		}

		// Build Buttons if there are multiple embeds
		const messageButtons = new ActionRowBuilder().addComponents(
			new ButtonBuilder().setCustomId('previous').setLabel('Previous').setStyle(ButtonStyle.Success),
			new ButtonBuilder().setCustomId('cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger),
			new ButtonBuilder().setCustomId('next').setLabel('Next').setStyle(ButtonStyle.Success)
		);

		// Send first embed
		const embedList = await interaction.followUp({ embeds: [embeds[0]], components: [messageButtons], fetchReply: true });

		// Pagination
		let currentPage = 0;
		const filter = (i) => i.user.id === interaction.user.id;
		const collector = embedList.createMessageComponentCollector({ filter, time: 60000 });

		collector.on('collect', async (buttonInt) => {
			// Defer the button interaction
			await buttonInt.deferUpdate();

			// Handle the button interactions
			switch (buttonInt.customId) {
				case 'previous':
					if (currentPage > 0) {
						currentPage--;
						await interaction.editReply({ embeds: [embeds[currentPage]] });
					}
					break;
				case 'next':
					if (currentPage < embeds.length - 1) {
						currentPage++;
						await interaction.editReply({ embeds: [embeds[currentPage]] });
					}
					break;
				case 'cancel':
					await interaction.editReply({ components: [] });
					return collector.stop();
			}
		});

		collector.on('end', async () => {
			await interaction.editReply({ components: [] });
		});
	},
};
