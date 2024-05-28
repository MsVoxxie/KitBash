const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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
		//! This entire thing fucking sucks, redo it later

		// Defer, Things take time.
		await interaction.deferReply();

		// Definitions
		const user = interaction.options.getString('user') || null;
		let grabbedPins;

		// Get the pins for the user
		if (user) {
			grabbedPins = await Pin.find({ authorId: user });
		} else {
			grabbedPins = await Pin.find({});
		}

		// Check if there are any pins
		if (!grabbedPins.length) return interaction.followUp({ content: 'No pins found.' });

		// Loop over the pins and create the embeds
		const embeds = [];

		for await (const pin of grabbedPins) {
			const embed = new EmbedBuilder()
				.setTitle(`Pin #${grabbedPins.indexOf(pin) + 1}`)
				// .setDescription(`[Jump to Message](https://discord.com/channels/${interaction.guild.id}/${pin.channelId}/${pin.messageId})`)
				.addFields({ name: 'Author', value: `<@${pin.authorId}>` }, { name: 'Content', value: pin.content || 'No content' })
				.setFooter({ text: `Total Pins: ${grabbedPins.length}` })
				.setColor(client.color);

			if (pin.media.length) {
				for (const media of pin.media) {
					embed.setImage(media);
				}
			}
			embeds.push(embed);
		}

		// Build the buttons
		const messageButtons = new ActionRowBuilder().addComponents(
			new ButtonBuilder().setCustomId('previous').setLabel('Previous').setStyle(ButtonStyle.Success),
			new ButtonBuilder().setCustomId('next').setLabel('Next').setStyle(ButtonStyle.Success),
			new ButtonBuilder().setCustomId('confirm').setLabel('Confirm').setStyle(ButtonStyle.Success),
			new ButtonBuilder().setCustomId('delete').setLabel('Delete').setStyle(ButtonStyle.Danger)
		);

		// Respond with the embeds
		const pinMessage = await interaction.followUp({ embeds: [embeds[0]], components: [messageButtons], fetchReply: true });

		// Pagination
		let currentPage = 0;
		const filter = (buttonInteraction) => {
			return buttonInteraction.user.id === interaction.user.id;
		};
		const collector = pinMessage.createMessageComponentCollector({ filter, time: 60000 });

		collector.on('collect', async (buttonInteraction) => {
			buttonInteraction.deferUpdate();
			switch (buttonInteraction.customId) {
				case 'previous':
					if (currentPage > 0) {
						currentPage--;
						await interaction.editReply({ embeds: [embeds[currentPage]], components: [messageButtons] });
					}
					break;

				case 'next':
					if (currentPage < embeds.length - 1) {
						currentPage++;
						await interaction.editReply({ embeds: [embeds[currentPage]], components: [messageButtons] });
					}
					break;

				case 'confirm':
					collector.stop();
					await interaction.editReply({ components: [] });

					break;
				case 'delete':
					await Pin.findOneAndDelete({ messageId: grabbedPins[currentPage].messageId });
					grabbedPins.splice(currentPage, 1);
					if (currentPage > 0) {
						currentPage--;
						await interaction.editReply({ embeds: [embeds[currentPage]], components: [messageButtons] });
					}
					break;
			}
		});

		collector.on('end', async () => {
			await interaction.editReply({ components: [] });
		});
	},
};
