const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionContextType } = require('discord.js');
const { dateToLongDate } = require('../../functions/helpers/dateFormatters');
const { cleanDiscordMarkdown, urlToMarkdown } = require('../../functions/helpers/stringFormatters');
const Pin = require('../../models/pinSchema');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('listpins')
		.setDescription('List all currently saved pins')
		.setContexts([InteractionContextType.Guild, InteractionContextType.PrivateChannel])
		.setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
		.addStringOption((option) => option.setName('user').setDescription('The user to list pins for').setRequired(false)),
	options: {
		devOnly: false,
		disabled: false,
	},
	async execute(client, interaction) {
		//! Rewrite in progress

		// Defer, Things take time.
		await interaction.deferReply({ ephemeral: true });

		// Definitions
		let reviewEmbed;
		const user = interaction.options.getString('user') || null;
		let grabbedPins;

		// Get the pins for the user
		if (user) {
			grabbedPins = await Pin.find({ authorId: user });
		} else {
			grabbedPins = await Pin.find({ pinnedBy: interaction.user.id });
		}

		// Check if there are any pins
		if (!grabbedPins.length) return interaction.followUp({ content: 'No pins found.' });

		// Segment pins list into groups of 8
		const segmentedPins = [];
		for (let i = 0; i < grabbedPins.length; i += 8) {
			const segment = grabbedPins.slice(i, i + 8);
			segmentedPins.push(segment);
		}

		// Loop over the segments and create embeds with a list per embed
		const embeds = [];
		let increment = 1;
		for (const segment of segmentedPins) {
			// Map the segment and format it
			const formattedSegment = segment.map((pin) => {
				const formattedDate = dateToLongDate(pin.timestamp);
				const formattedContent = cleanDiscordMarkdown(urlToMarkdown(pin.messageContent)).replace(/\n/g, ' ');
				const formattedMedia = pin.messageMedia.length ? pin.messageMedia.map((media, index) => `[Media ${index + 1}](${media})`).join(' ') : 'No media';
				return `__\`[Pin #${pin.pinPosition}]\`__\n**Author)** <@${pin.authorId}>\n**Pinned In)** ${pin.pinnedIn}\n**Content)** ${formattedContent}\n**Media)** ${formattedMedia}\n**Pinned)** ${formattedDate}\n**[Direct Link](${pin.directLink})**\n`;
			});

			const embed = new EmbedBuilder()
				.setTitle(`Page ${increment} of ${segmentedPins.length} | Total Pins: ${grabbedPins.length}`)
				.setDescription(`${formattedSegment.join('\n')}`)
				.setColor(client.color);

			embeds.push(embed);
			increment++;
		}

		// If there are multiple pages, create some buttons for pagination
		if (embeds.length > 1) {
			// Build the buttons
			const messageButtons = new ActionRowBuilder().addComponents(
				new ButtonBuilder().setCustomId('previous').setLabel('Previous').setStyle(ButtonStyle.Success),
				new ButtonBuilder().setCustomId('cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger),
				new ButtonBuilder().setCustomId('next').setLabel('Next').setStyle(ButtonStyle.Success)
			);

			// Send the first embed with buttons
			reviewEmbed = await interaction.followUp({ embeds: [embeds[0]], components: [messageButtons], fetchReply: true });
		} else {
			// If there is only one page, send the embed
			reviewEmbed = await interaction.followUp({ embeds: [embeds[0]], fetchReply: true });
		}

		// Define the collector
		const filter = (buttonInt) => buttonInt.user.id === interaction.user.id;
		const collector = reviewEmbed.createMessageComponentCollector({ filter, time: 60000 });

		// Pagination
		let currentPage = 0;
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
