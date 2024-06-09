const { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');
const Canvas = require('@napi-rs/canvas');
const GIFEncoder = require('gifencoder');
const { GifReader } = require('omggif');
const fetch = require('node-fetch');
const path = require('path');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('caption')
		.setDescription('Caption an image.')
		.setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
		.addAttachmentOption((option) => option.setName('image').setDescription('The image to caption.').setRequired(true))
		.addStringOption((option) => option.setName('caption').setDescription('The caption to add to the image.').setRequired(true)),
	options: {
		devOnly: false,
		disabled: false,
	},
	async execute(client, interaction) {
		// Defer, Things take time.
		await interaction.deferReply();

		// Definitions
		const image = interaction.options.get('image');
		const caption = interaction.options.getString('caption');

		// Get image details
		const { width, height, contentType } = image.attachment;
		const imageURL = image.attachment.url;

		// Canvas setup
		const canvas = Canvas.createCanvas(width, height);
		const ctx = canvas.getContext('2d');

		// Register font from file
		Canvas.GlobalFonts.registerFromPath(path.join(__dirname, '../../fonts/Roboto-Regular.ttf'), 'Roboto-Regular');

		// Load image
		const img = await Canvas.loadImage(imageURL);
		ctx.drawImage(img, 0, 0, width, height);

		// Setup text
		const fontSize = Math.min(Math.max((width, height) / 10, 16), 100);
		ctx.font = `${fontSize}px Roboto-Regular`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		// Draw caption on the top center of the image
		const lines = wrapText(ctx, caption, width);
		const padding = fontSize / 2;
		const lineHeight = (fontSize * fontSize) / 100;
		const textHeight = lines.length * lineHeight + 2 * padding;

		//! Gif support hell
		if (contentType === 'image/gif') {
			// Get the gif frames
			const imageUrl = fetch(imageURL);
			const imageBuffer = await imageUrl.then((res) => res.buffer());
			const gifData = new GifReader(imageBuffer);
			const frameDelay = gifData.frameInfo(0).delay;

			// Create the encoder
			const encoder = new GIFEncoder(width, height);
			encoder.start();
			encoder.setRepeat(0);
			encoder.setTransparent();
			encoder.setDelay(frameDelay);

			// Loop through each frame
			for (let i = 0; i < gifData.numFrames(); i++) {
				// Get the frame
				const frameInfo = gifData.frameInfo(i);
				const frameData = Buffer.alloc(frameInfo.width * frameInfo.height * 4);
				gifData.decodeAndBlitFrameRGBA(i, frameData);

				// Put the frame data on the canvas
				const imageData = ctx.createImageData(frameInfo.width, frameInfo.height);
				imageData.data.set(frameData);

				// Draw the frame
				ctx.putImageData(imageData, 0, 0);

				const finishedFrame = textMagic(ctx, lines, width, height, lineHeight, textHeight);
				encoder.addFrame(finishedFrame);
			}
			encoder.finish();
			// Send the gif
			const gifAttachment = new AttachmentBuilder(encoder.out.getData(), { name: 'caption.gif' });
			await interaction.followUp({ files: [gifAttachment] });
		} else {
			// Generate Image
			textMagic(ctx, lines, width, height, lineHeight, textHeight);

			// Send the image
			const imageAttachment = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'caption.png' });
			await interaction.followUp({ files: [imageAttachment] });
		}
	},
};

const textMagic = (ctx, lines, width, height, lineHeight, textHeight) => {
	ctx.fillStyle = 'white';
	ctx.fillRect(0, 0, width, textHeight);

	// Draw text
	ctx.fillStyle = 'black';
	lines.forEach((line, i) => {
		ctx.fillText(line, width / 2, height / 30 + (i + 1) * lineHeight);
	});
	return ctx;
};

const wrapText = (context, text, maxWidth) => {
	const words = text.split(' ');
	let line = '';
	const lines = [];

	for (let i = 0; i < words.length; i++) {
		const testLine = line + words[i] + ' ';
		const metrics = context.measureText(testLine);
		const testWidth = metrics.width;

		if (testWidth > maxWidth && i > 0) {
			lines.push(line.trim());
			line = words[i] + ' ';
		} else {
			line = testLine;
		}
	}
	lines.push(line.trim());
	return lines;
};
