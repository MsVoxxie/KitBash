const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { dateToLongDate } = require('../../functions/helpers/dateFormatters');
const { trimString } = require('../../functions/helpers/stringFormatters');
const Pin = require('../../models/pinSchema');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('listpins')
		.setDescription('List all currently saved pins')
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

		// Segment pins list into groups of 10
		const segmentedPins = [];
		for (let i = 0; i < grabbedPins.length; i += 10) {
			const segment = grabbedPins.slice(i, i + 10);
			segmentedPins.push(segment);
		}

		// Loop over the segments and create embeds with a list per embed
		const embeds = [];
		let increment = 1;
		for (const segment of segmentedPins) {
			// Map the segment and format it
			const formattedSegment = segment.map((pin) => {
				const formattedDate = dateToLongDate(pin.timestamp);
				return `__\`[Pin #${pin.pinPosition}]\`__\n**Author)** <@${pin.authorId}>\n**Pinned In)** ${pin.pinnedIn}\n**Content)** ${trimString(pin.messageContent, 50)}\n**Media Count)** ${pin.messageMedia.length}\n**Pinned)** ${formattedDate}\n**[Direct Link](${pin.directLink})**\n`;
			});

			const embed = new EmbedBuilder()
				.setTitle(`Page ${increment} of ${segmentedPins.length} | Total Pins: ${grabbedPins.length}`)
				.setDescription(`${formattedSegment.join('\n')}`)
				.setColor(client.color);

			embeds.push(embed);
			increment++;
		}

		// Send the first embed
		await interaction.followUp({ embeds: [embeds[0]] });
	},
};
